from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pymongo
import fitz 
import os
import hashlib
import socket
import ssl
from datetime import date, datetime

import groq

import json
from bson import ObjectId
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()  


class GenerateContentConfig:
    def __init__(self, temperature=0.3, response_mime_type=None):
        self.temperature = temperature
        self.response_mime_type = response_mime_type


class types:
    GenerateContentConfig = GenerateContentConfig


class GroqGenerateContentResponse:
    def __init__(self, text):
        self.text = text


class GroqModels:
    def __init__(self, client):
        self.client = client

    def generate_content(self, model, contents, config=None):
        temperature = getattr(config, "temperature", 0.3)
        response_mime_type = getattr(config, "response_mime_type", None)
        kwargs = {
            "model": model,
            "messages": [{"role": "user", "content": contents}],
            "temperature": temperature,
        }
        if response_mime_type == "application/json":
            kwargs["response_format"] = {"type": "json_object"}

        response = self.client.chat.completions.create(**kwargs)
        text = response.choices[0].message.content or ""
        return GroqGenerateContentResponse(text)


class GroqAIClient:
    def __init__(self, api_key):
        self.client = groq.Client(api_key=api_key)
        self.models = GroqModels(self.client)


client_ai = GroqAIClient(
    api_key=os.environ.get("GROQ_API_KEY")
)

MODEL = "llama-3.1-8b-instant"

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["deephire"]
jobs_collection = db["jobs"]
resumes_collection = db["resumes"]

REDIS_URL = os.environ.get("REDIS_URL")
JOBS_VERSION_KEY = "deephire:cache:jobs:version"
REDIS_DEBUG = os.environ.get("REDIS_DEBUG", "").lower() in {"1", "true", "yes", "on"}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _encode_redis_command(parts):
    encoded = [f"*{len(parts)}"]
    for part in parts:
        value = str(part)
        encoded.append(f"${len(value.encode('utf-8'))}")
        encoded.append(value)
    return "\r\n".join(encoded).encode("utf-8") + b"\r\n"


def _cache_log(message):
    if REDIS_DEBUG:
        print(f"[redis-cache] {message}")


def _summarize_key(key):
    text = str(key)
    return text if len(text) <= 120 else f"{text[:117]}..."


def _parse_redis_response(buffer: bytes, offset: int = 0):
    if offset >= len(buffer):
        return None

    prefix = buffer[offset:offset + 1]
    line_end = buffer.find(b"\r\n", offset)
    if line_end == -1:
        return None

    if prefix == b"+":
        return buffer[offset + 1:line_end].decode("utf-8"), line_end + 2

    if prefix == b"-":
        raise RuntimeError(buffer[offset + 1:line_end].decode("utf-8"))

    if prefix == b":":
        return int(buffer[offset + 1:line_end].decode("utf-8")), line_end + 2

    if prefix == b"$":
        bulk_length = int(buffer[offset + 1:line_end].decode("utf-8"))
        if bulk_length == -1:
            return None, line_end + 2

        value_start = line_end + 2
        value_end = value_start + bulk_length
        if len(buffer) < value_end + 2:
            return None
        return buffer[value_start:value_end].decode("utf-8"), value_end + 2

    if prefix == b"*":
        item_count = int(buffer[offset + 1:line_end].decode("utf-8"))
        values = []
        current_offset = line_end + 2
        for _ in range(item_count):
            parsed = _parse_redis_response(buffer, current_offset)
            if parsed is None:
                return None
            value, current_offset = parsed
            values.append(value)
        return values, current_offset

    return None


def _redis_request(command_parts):
    if not REDIS_URL:
        return None

    parsed_url = urlparse(REDIS_URL)
    is_tls = parsed_url.scheme == "rediss"
    host = parsed_url.hostname or "localhost"
    port = parsed_url.port or (6380 if is_tls else 6379)
    password = parsed_url.password or ""
    username = parsed_url.username or ""
    database = int(parsed_url.path.lstrip("/")) if parsed_url.path and parsed_url.path != "/" else None

    connection = socket.create_connection((host, port), timeout=3)
    if is_tls:
        context = ssl.create_default_context()
        connection = context.wrap_socket(connection, server_hostname=host)

    try:
        commands = []
        if password:
            if username:
                commands.append(["AUTH", username, password])
            else:
                commands.append(["AUTH", password])
        if database is not None:
            commands.append(["SELECT", database])
        commands.append(command_parts)

        buffer = b""

        for parts in commands:
            connection.sendall(_encode_redis_command(parts))

            while True:
                parsed = _parse_redis_response(buffer)
                if parsed is not None:
                    _, next_offset = parsed
                    buffer = buffer[next_offset:]
                    break

                chunk = connection.recv(4096)
                if not chunk:
                    raise RuntimeError("Redis connection closed unexpectedly")
                buffer += chunk

        return parsed[0]
    finally:
        connection.close()


def cache_get(key):
    if not REDIS_URL:
        _cache_log(f"disabled -> loader for {_summarize_key(key)}")
        return None

    try:
        value = _redis_request(["GET", key])
        _cache_log(f"{'hit' if value else 'miss'} {_summarize_key(key)}")
        return value
    except Exception as exc:
        print(f"Redis cache read failed: {exc}")
        return None


def cache_setex(key, ttl_seconds, value):
    if not REDIS_URL:
        return None

    try:
        result = _redis_request(["SET", key, json.dumps(value, default=_json_default), "EX", str(ttl_seconds)])
        _cache_log(f"write {_summarize_key(key)} ttl={ttl_seconds}")
        return result
    except Exception as exc:
        print(f"Redis cache write failed: {exc}")
        return None


def cache_incr(key):
    if not REDIS_URL:
        return None

    try:
        value = _redis_request(["INCR", key])
        _cache_log(f"version bump {_summarize_key(key)} -> {value}")
        return value
    except Exception as exc:
        print(f"Redis version bump failed: {exc}")
        return None


def cache_version(key):
    if not REDIS_URL:
        _cache_log(f"version read default 0 {_summarize_key(key)}")
        return 0

    try:
        value = cache_get(key)
        version = int(value or 0)
        _cache_log(f"version read {_summarize_key(key)} -> {version}")
        return version
    except Exception as exc:
        print(f"Redis version read failed: {exc}")
        return 0


def profile_version_key(user_id):
    return f"deephire:cache:user:{user_id}:profileVersion"


def resume_version_key(user_id):
    return f"deephire:cache:user:{user_id}:resumeVersion"


def _json_default(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, ObjectId):
        return str(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def cached_json(key, ttl_seconds, loader):
    cached_value = cache_get(key)
    if cached_value:
        try:
            return json.loads(cached_value)
        except Exception:
            pass

    value = loader()
    cache_setex(key, ttl_seconds, value)
    return value


def cache_key(prefix, payload):
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return f"deephire:cache:{prefix}:{digest}"


def jobs_cache_key(prefix, *parts):
    joined = "|".join(str(part) for part in parts)
    return cache_key(prefix, f"{joined}|jv{cache_version(JOBS_VERSION_KEY)}")

class ImproveRequest(BaseModel):
    section: str
    items: List[str]

# -------------------- UTILS --------------------
def convert_objectid_to_str(obj):
    """Convert MongoDB ObjectId to string recursively"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_objectid_to_str(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    else:
        return obj

def extract_text_from_pdf(content: bytes):
    doc = fitz.open(stream=content, filetype="pdf")
    return "\n".join([page.get_text() for page in doc])



def prompt_resume_parser(text):
    prompt = f"""
You are a professional resume parser. Extract the following fields from the resume text below:

Resume Text:
{text}

Return JSON with the following keys:
- name (string)
- email (string)
- phone (string)
- skills (array of strings)
- experience (array of experience objects). Each object should include:
  - title (string, e.g., "Software Engineer Intern")
  - company (string, if available)
  - duration (string like "June 2023 – Aug 2023")
  - bullets (array of key contributions or work)
- education (array of strings like 'NSUT – B.Tech – 2022–2026')
- projects (array of project objects). Each project should include:
  - title (string)
  - description (1-line summary)
  - work (array of bullet points)
- achievements (array of bullet points)
- curricular (array of bullet points)

Respond ONLY in valid JSON.
"""
    
    try:

        response = client_ai.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )

        return json.loads(response.text)

    except Exception as e:

        return {
            "error": str(e)
        }

def prompt_section_improvement(section: str, items: List[str]):
    section_text = "\n".join(f"- {item}" for item in items)
    prompt = f"""
You are a resume reviewer.

Section:
{section}

Content:
{section_text}

Give concise resume improvement suggestions.

Rules:
- One suggestion per line.
- Start each with 👉
- No markdown.
- No numbering.
"""
    try:

        response = client_ai.models.generate_content(
            model=MODEL,
            contents=prompt,
        )

        return [
            line.strip()
            for line in response.text.splitlines()
            if line.strip()
        ]

    except Exception as e:

        return [str(e)]

# -------------------- ROUTES --------------------

@app.post("/upload")
async def upload_resume(resume: UploadFile = File(...)):
    content = await resume.read()
    return prompt_resume_parser(extract_text_from_pdf(content))

@app.post("/improve")
async def improve_section(req: ImproveRequest):
    return {"suggestions": prompt_section_improvement(req.section, req.items)}


class GitHubAnalysisRequest(BaseModel):
    profile: Dict
    repos: List[Dict]

def prompt_github_analysis(profile: dict, repos: List[dict]):
    profile_summary = json.dumps(profile, indent=2)
    top_repos_summary = json.dumps(repos[:5], indent=2)

    prompt = f"""
You're a senior hiring engineer. Analyze the GitHub profile below and give constructive feedback.

GitHub Profile:
{profile_summary}

Top Repositories:
{top_repos_summary}

Give 3 sections in the response:
1. Strengths
2. Areas for Improvement
3. Suggestions to stand out more to recruiters.
4. Do **not** use *, asterisks, **Markdown**.
5. Use "👉" for each item in the sections and bullet arrow for sub items and numbers for tips.

Be detailed but concise. Keep language professional and supportive.
"""

    try:
        response = client_ai.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
            ),
        )

        return response.text.strip()

    except Exception as e:
        return f"❌ Groq error: {str(e)}"

@app.post("/analyze/github")
async def analyze_github(data: GitHubAnalysisRequest):
    return {"feedback": prompt_github_analysis(data.profile, data.repos)}

class MatchRequest(BaseModel):
    userId: Optional[str] = None
    search: Optional[str] = ""
    page: Optional[int] = 1

class SuggestRequest(BaseModel):
    resume: Dict[str, Any]
    job: Dict[str, Any]

class ResumeScoreRequest(BaseModel):
    resume: Dict[str, Any]
    job: Dict[str, Any]

# -------------------- HELPERS --------------------
def generate_match_prompt(resume: dict, job: dict, search_query: str):
    prompt = f"""
You're a resume-job matching assistant.

Given:
Resume: {json.dumps(resume, indent=2)}
Job: {json.dumps(job, indent=2)}
Search Query: "{search_query}"

Evaluate:
- How well this resume matches this job and search intent
- Use resume skills, experience, and relevant details

Return JSON with:
- score (0–100 integer)
- reason (1-liner why score was given)

Only return valid JSON.
"""
    try:
        res = client_ai.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json"
            )
        )
        return json.loads(res.text)
    except Exception as e:
        return {"score": 0, "reason": "Groq failed", "error": str(e)}

def generate_resume_score_prompt(resume: dict, job: dict):
    """Generate a resume match score based on resume and job details"""
    prompt = f"""
You are an expert resume evaluator and hiring manager. Analyze how well this resume matches this specific job posting.

Job Details:
- Title: {job.get('title', 'N/A')}
- Company: {job.get('company', 'N/A')}
- Location: {job.get('location', 'N/A')}
- Experience Required: {job.get('experience', 'N/A')}
- Job Type: {job.get('jobType', 'N/A')}
- Work Type: {job.get('workType', 'N/A')}
- Skills Required: {', '.join(job.get('skills', []))}
- Description: {job.get('description', 'N/A')}

Resume Profile:
- Name: {resume.get('name', 'N/A')}
- Skills: {', '.join(resume.get('skills', []))}
- Experience: {json.dumps(resume.get('experience', []), indent=2)}
- Education: {', '.join(resume.get('education', []))}
- Projects: {json.dumps(resume.get('projects', []), indent=2)}
- Achievements: {', '.join(resume.get('achievements', []))}

Evaluate the match based on:
1. Skills alignment (technical and soft skills)
2. Experience relevance (role similarity, company size, duration)
3. Education requirements match
4. Project relevance to the job role
5. Overall career progression and achievements
6. Location compatibility
7. Experience level match

Rate from 0-100:
- 90-100: Excellent match (perfect fit, hire immediately)
- 80-89: Very good match (strong candidate, minimal gaps)
- 70-79: Good match (suitable candidate, some training needed)
- 60-69: Decent match (potential candidate, moderate gaps)
- 50-59: Average match (significant gaps, but possible)
- 40-49: Below average (major skill/experience gaps)
- 0-39: Poor match (not suitable for this role)

Return JSON with:
- score (0-100 integer)
- reason (2-3 sentence explanation of the score)
- strengths (array of 2-3 key strengths)
- gaps (array of 2-3 main gaps or areas for improvement)

Only return valid JSON.
"""
    try:
        res = client_ai.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json"
            )
        )
        return json.loads(res.text)
    except Exception as e:
        return {
            "score": 0, 
            "reason": "Resume scoring failed due to technical error", 
            "strengths": ["Unable to analyze"],
            "gaps": ["Technical error occurred"],
            "error": str(e)
        }

def generate_improvement_prompt(resume: dict, job: dict):
    prompt = f"""
You are a career advisor helping someone improve their profile for a specific job application.

Job Details:
- Title: {job.get('title', 'N/A')}
- Company: {job.get('company', 'N/A')}
- Location: {job.get('location', 'N/A')}
- Experience Required: {job.get('experience', 'N/A')}
- Job Type: {job.get('jobType', 'N/A')}
- Work Type: {job.get('workType', 'N/A')}
- Description: {job.get('description', 'N/A')}

Current Profile:
{json.dumps(resume, indent=2)}

Based on this specific job posting, give 3-5 actionable improvement suggestions to make the candidate more competitive for THIS PARTICULAR ROLE.

Focus on:
- Skills that should be highlighted or learned for this role
- Experience that should be emphasized
- Keywords from the job description that should be included
- Specific technical or soft skills mentioned in the job posting
- How to align with the company culture/requirements

Guidelines:
- Start each suggestion with "👉"
- Be specific to this job posting, not generic advice
- Keep suggestions actionable and realistic
- Focus on what would make the biggest impact for THIS role
- Do not use Markdown, asterisks, or formatting
"""
    try:
        res = client_ai.models.generate_content(
            model=MODEL,
            contents=prompt
        )
        return res.text.strip()
    except Exception as e:
        return f"❌ Groq failed: {str(e)}"

def generate_smart_search_match(job: dict, search_query: str):
    """Use Groq to intelligently match search query against job"""
    prompt = f"""
You are a job search matching assistant. Analyze if this job matches the search query.

Job Details:
- Title: {job.get('title', '')}
- Company: {job.get('company', '')}
- Location: {job.get('location', '')}
- Description: {job.get('description', '')[:300]}...
- Work Type: {job.get('workType', '')}
- Job Type: {job.get('jobType', '')}
- Experience: {job.get('experience', '')}

Search Query: "{search_query}"

Consider:
- Job title keywords (SDE, Software Engineer, Developer, etc.)
- Company names (Google, Microsoft, etc.)
- Location (Bangalore, Mumbai, Remote, etc.)
- Experience level (Intern, Junior, Senior, etc.)
- Work arrangement (Remote, Onsite, Hybrid)

Rate the match from 0-100:
- 90-100: Excellent match (all key terms match)
- 70-89: Good match (most important terms match)
- 50-69: Partial match (some terms match)
- 30-49: Weak match (few terms match)
- 0-29: No match

Return JSON with:
- score (0-100 integer)
- reason (brief explanation of why it matches or doesn't)

Only return valid JSON.
"""
    try:
        res = client_ai.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json"
            )
        )
        return json.loads(res.text)
    except Exception as e:
        return {"score": 0, "reason": "Search matching failed", "error": str(e)}

def generate_job_quality_score(job: dict):
    """Use Groq to evaluate job quality and attractiveness"""
    prompt = f"""
You are a job evaluation expert. Rate this job posting based on its overall quality and attractiveness to job seekers.

Job Details:
- Title: {job.get('title', '')}
- Company: {job.get('company', '')}
- Location: {job.get('location', '')}
- Description: {job.get('description', '')[:500]}...
- Work Type: {job.get('workType', '')}
- Job Type: {job.get('jobType', '')}
- Experience: {job.get('experience', '')}
- Salary: {job.get('salary', 'Not specified')}

Evaluate based on:
- Company reputation and brand recognition
- Role attractiveness and growth potential
- Location desirability
- Compensation and benefits (if mentioned)
- Job description clarity and completeness
- Career advancement opportunities

Rate from 0-100:
- 90-100: Excellent opportunity (top-tier company, great role, clear growth path)
- 70-89: Good opportunity (solid company, decent role, some growth potential)
- 50-69: Average opportunity (standard role, moderate appeal)
- 30-49: Below average (limited appeal, unclear benefits)
- 0-29: Poor opportunity (red flags, unclear details)

Return JSON with:
- score (0-100 integer)
- reason (brief explanation of the rating)

Only return valid JSON.
"""
    try:
        response = client_ai.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        return json.loads(response.text)

    except Exception as e:
        return {
            "score": 50,
            "reason": "Job evaluation failed",
            "error": str(e)
        }


@app.post("/match-jobs")
async def match_jobs(req: MatchRequest):
    user_id = req.userId
    search = req.search or ""
    page = req.page or 1
    resume_version = cache_version(resume_version_key(user_id)) if user_id else 0
    jobs_version = cache_version(JOBS_VERSION_KEY)
    cache_key_value = cache_key(
        "match-jobs",
        json.dumps({"userId": user_id, "search": search, "page": page, "resumeVersion": resume_version, "jobsVersion": jobs_version}, sort_keys=True)
    )

    cached_result = cache_get(cache_key_value)
    if cached_result:
        try:
            return json.loads(cached_result)
        except Exception:
            pass

    # Get all jobs first
    jobs = list(jobs_collection.find({}))
    
    # If no jobs found, return empty result
    if not jobs:
        return {
            "total": 0,
            "page": page,
            "jobs": [],
        }

    jobs_with_scores = []

    for job in jobs:
        job = convert_objectid_to_str(job)
        
        if search:
            score_data = generate_smart_search_match(job, search)
            job["search_relevance"] = score_data.get("score", 0)  # Keep for filtering, don't show to user
            job["reason"] = score_data.get("reason", "Search match")
        else:
            # No search query: No scoring needed, just show all jobs
            job["search_relevance"] = 100  
            job["reason"] = "Available position"
        
       
        jobs_with_scores.append(job)

    if search:
        # With search: Sort by search relevance (highest first) and filter
        jobs_sorted = sorted(jobs_with_scores, key=lambda x: x["search_relevance"], reverse=True)
        
        # Filter out very low relevance matches
        high_quality_jobs = [job for job in jobs_sorted if job["search_relevance"] > 60]
        
        if high_quality_jobs:
            jobs_sorted = high_quality_jobs
        else:
            # If no high quality matches, lower the threshold
            jobs_sorted = [job for job in jobs_sorted if job["search_relevance"] > 30]
    else:
        jobs_sorted = sorted(jobs_with_scores, key=lambda x: x.get("_id", ""), reverse=True)

    per_page = 5
    start = (page - 1) * per_page
    end = start + per_page

    result = {
        "total": len(jobs_sorted),
        "page": page,
        "jobs": jobs_sorted[start:end],
    }

    cache_setex(cache_key_value, 1800, result)
    return result

@app.post("/suggest-improvements")
async def suggest_improvements(req: SuggestRequest):
    return {"suggestions": generate_improvement_prompt(req.resume, req.job)}

@app.post("/resume-score")
async def get_resume_score(req: ResumeScoreRequest):
    return generate_resume_score_prompt(req.resume, req.job)

@app.get("/test-jobs")
async def test_jobs():
    """Test endpoint to check jobs in database"""
    try:
        jobs_count = jobs_collection.count_documents({})
        sample_jobs = list(jobs_collection.find({}).limit(2))
        
        # Convert ObjectIds to strings
        sample_jobs = convert_objectid_to_str(sample_jobs)
        
        return {
            "total_jobs": jobs_count,
            "sample_jobs": sample_jobs,
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }

@app.post("/test-search")
async def test_search(search_query: dict):
    """Test endpoint to debug search functionality"""
    query = search_query.get("query", "")
    
    try:
        # Get first job for testing
        sample_job = jobs_collection.find_one({})
        if not sample_job:
            return {"error": "No jobs found in database"}
        
        # Convert ObjectId and test search
        sample_job = convert_objectid_to_str(sample_job)
        search_result = generate_smart_search_match(sample_job, query)
        
        return {
            "query": query,
            "sample_job": {
                "title": sample_job.get("title"),
                "company": sample_job.get("company"),
                "location": sample_job.get("location")
            },
            "search_result": search_result,
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }

@app.get("/test-scoring")
async def test_scoring():
    try:
        # Get a few jobs for testing
        sample_jobs = list(jobs_collection.find({}).limit(3))
        if not sample_jobs:
            return {"error": "No jobs found in database"}
        
        results = []
        for job in sample_jobs:
            job = convert_objectid_to_str(job)
            
            # Test quality scoring
            quality_score = generate_job_quality_score(job)
            
            # Test search scoring with a sample query
            search_score = generate_smart_search_match(job, "software engineer")
            
            results.append({
                "job": {
                    "title": job.get("title"),
                    "company": job.get("company"),
                    "location": job.get("location")
                },
                "quality_score": quality_score,
                "search_score": search_score
            })
        
        return {
            "results": results,
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }