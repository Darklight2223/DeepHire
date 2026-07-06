from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pymongo
import fitz 
import os

from google import genai
from google.genai import types

import json
from bson import ObjectId

from dotenv import load_dotenv

load_dotenv()  


client_ai = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY")
)

MODEL = "gemini-2.5-flash"

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["deephire"]
jobs_collection = db["jobs"]
resumes_collection = db["resumes"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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

def extract_text_from_pdf(file: UploadFile):
    content = file.file.read()
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
    text = extract_text_from_pdf(resume)
    print(text)
    parsed = prompt_resume_parser(text)
    print(parsed)
    return parsed

@app.post("/improve")
async def improve_section(req: ImproveRequest):
    suggestions = prompt_section_improvement(req.section, req.items)
    return {"suggestions": suggestions}


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
        return f"❌ Gemini error: {str(e)}"

@app.post("/analyze/github")
async def analyze_github(data: GitHubAnalysisRequest):
    feedback = prompt_github_analysis(data.profile, data.repos)
    return {"feedback": feedback}

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
        return {"score": 0, "reason": "Gemini failed", "error": str(e)}

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
        return f"❌ Gemini failed: {str(e)}"

def generate_smart_search_match(job: dict, search_query: str):
    """Use Gemini to intelligently match search query against job"""
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
    """Use Gemini to evaluate job quality and attractiveness"""
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

    return {
        "total": len(jobs_sorted),
        "page": page,
        "jobs": jobs_sorted[start:end],
    }

@app.post("/suggest-improvements")
async def suggest_improvements(req: SuggestRequest):
    suggestions = generate_improvement_prompt(req.resume, req.job)
    return {"suggestions": suggestions}

@app.post("/resume-score")
async def get_resume_score(req: ResumeScoreRequest):
    score_data = generate_resume_score_prompt(req.resume, req.job)
    return score_data

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