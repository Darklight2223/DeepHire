'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaExternalLinkAlt, FaTimes, FaStar, FaRegStar } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import withAuth from '../lib/withAuth';
import { useAuth } from '../lib/useAuth';

const SuggestButton = ({ job }) => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userResume, setUserResume] = useState(null);
  const { user, isLoggedIn } = useAuth();

  // Fetch user's resume data
  useEffect(() => {
    const fetchUserResume = async () => {
      if (!isLoggedIn) return;
      
      try {
        const res = await fetch('/api/userinfo');
        if (res.ok) {
          const resumeData = await res.json();
          setUserResume(resumeData);
        }
      } catch (error) {
        console.error('Error fetching user resume:', error);
      }
    };

    fetchUserResume();
  }, [isLoggedIn]);

  
  useEffect(() => {
    setTips([]);
  }, [job.title, job.company, job.location]); 

  const getSuggestions = async () => {
    setLoading(true);
    try {
      if (!userResume) {
        setTips(['❌ Resume not found. Please upload your resume first to get personalized tips for this role.']);
        setLoading(false);
        return;
      }

      const res = await fetch('http://127.0.0.1:8000/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume: userResume,
          job: job 
        }),
      });
      const data = await res.json();
      
      // Parse the suggestions text and split by lines
      const suggestionsText = data.suggestions || '';
      const parsedTips = suggestionsText
        .split('\n')
        .filter(tip => tip.trim() && (tip.includes('👉') || tip.trim().length > 10))
        .map(tip => tip.replace(/👉\s*/, '').trim())
        .filter(tip => tip.length > 0);
      
      setTips(parsedTips.length > 0 ? parsedTips : ['No specific suggestions available for this role']);
    } catch (e) {
      console.error('Error getting suggestions:', e);
      setTips(['Error getting suggestions. Please try again.']);
    }
    setLoading(false);
  };

  return (
    <div className="mt-3">
      <button
        onClick={getSuggestions}
        className="text-green-400 text-sm hover:underline hover:text-green-300 transition-colors"
      >
        {loading ? '🤖 Getting AI tips...' : userResume ? '💡 Get Personalized Tips' : '💡 Get Job-Specific Tips (Resume Required)'}
      </button>
      {tips.length > 0 && (
        <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-green-500/20">
          <div className="text-green-400 text-sm font-medium mb-2">
            {userResume ? '🎯 AI Tips for this role (Based on your resume):' : '⚠️ Resume Required:'}
          </div>
          <ul className="text-sm text-zinc-300 space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400 mt-1 text-xs">▶</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ResumeScoreButton = ({ job }) => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userResume, setUserResume] = useState(null);
  const { user, isLoggedIn } = useAuth();

  // Fetch user's  resume data
  useEffect(() => {
    const fetchUserResume = async () => {
      if (!isLoggedIn) return;
      
      try {
        const res = await fetch('/api/userinfo');
        if (res.ok) {
          const resumeData = await res.json();
          setUserResume(resumeData);
        }
      } catch (error) {
        console.error('Error fetching user resume:', error);
      }
    };

    fetchUserResume();
  }, [isLoggedIn]);

  useEffect(() => {
    setScoreData(null);
  }, [job.title, job.company, job.location]);

  const getResumeScore = async () => {
    if (!userResume) {
      setScoreData({ 
        score: 0, 
        reason: "Please upload your resume to get a personalized score",
        strengths: [],
        gaps: ["Resume not found"]
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/resume-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume: userResume,
          job: job 
        }),
      });
      const data = await res.json();
      setScoreData(data);
    } catch (e) {
      console.error('Error getting resume score:', e);
      setScoreData({ 
        score: 0, 
        reason: "Error calculating score. Please try again.",
        strengths: [],
        gaps: ["Technical error occurred"]
      });
    }
    setLoading(false);
  };

  return (
    <div className="mt-3">
      <button
        onClick={getResumeScore}
        className="text-blue-400 text-sm hover:underline hover:text-blue-300 transition-colors"
      >
        {loading ? '🤖 Calculating score...' : scoreData ? '🔄 Recalculate Resume Score' : userResume ? '📊 Get Resume Score' : '📊 Get Resume Score (Resume Required)'}
      </button>
      {scoreData && (
        <div className="mt-3 p-4 bg-zinc-800/50 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-bold text-blue-400">{scoreData.score}%</span>
            <span className="text-blue-400 text-sm font-medium">Resume Match Score</span>
          </div>
          
          <p className="text-sm text-zinc-300 mb-3 leading-relaxed">{scoreData.reason}</p>
          
          {scoreData.strengths && scoreData.strengths.length > 0 && (
            <div className="mb-3">
              <div className="text-green-400 text-xs font-medium mb-1">✅ Strengths:</div>
              <ul className="text-xs text-zinc-300 space-y-1">
                {scoreData.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {scoreData.gaps && scoreData.gaps.length > 0 && (
            <div>
              <div className="text-orange-400 text-xs font-medium mb-1">⚠️ Areas to improve:</div>
              <ul className="text-xs text-zinc-300 space-y-1">
                {scoreData.gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BookmarkButton = ({ job }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();

  // Check if job is already saved when component mounts
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!isLoggedIn || !job._id) return;
      
      try {
        const res = await fetch(`/api/my-saved-jobs?jobId=${job._id}`);
        if (res.ok) {
          const data = await res.json();
          setIsSaved(data.saved);
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };

    checkIfSaved();
  }, [job._id, isLoggedIn]);

  const toggleSave = async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    try {
      if (isSaved) {
        // Unsave the job
        const res = await fetch(`/api/save-job?jobId=${job._id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          setIsSaved(false);
        }
      } else {
        // Save the job
        const res = await fetch('/api/save-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(job),
        });
        
        if (res.ok) {
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
        isSaved 
          ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-400/10' 
          : 'text-zinc-400 hover:text-yellow-400 hover:bg-yellow-400/10'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isSaved ? 'Remove from saved jobs' : 'Save job'}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isSaved ? (
        <FaStar className="w-5 h-5" />
      ) : (
        <FaRegStar className="w-5 h-5" />
      )}
    </button>
  );
};

const isValidExternalLink = value => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toUpperCase() === 'N/A') return false;
  return /^https?:\/\//i.test(trimmed);
};

const MatchPage = () => {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = async (e, resetPage = true) => {
    if (e) e.preventDefault();
    const newPage = resetPage ? 1 : page + 1;
    if (!resetPage) setPage(newPage);
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/match-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          search: query,
          page: newPage 
        }),
      });
      const data = await res.json();
      
      const jobsArray = data.jobs || [];
      
      if (resetPage) {
        setJobs(jobsArray);
        setPage(1);
      } else {
        setJobs(prev => [...prev, ...jobsArray]);
      }
      setTotal(data.total || 0);
    } catch (error) {
      console.error('❌ Failed to fetch jobs:', error);
      setJobs([]);
    }
    setLoading(false);
  };


  useEffect(() => {
    fetchJobs(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white">
      <Header />

      <main className="pt-24 px-6 max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold mb-10 text-center bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent"
        >
          🚀 Top Job Matches for You
        </motion.h1>

        <form
          onSubmit={(e) => fetchJobs(e, true)}
          className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            type="text"
            placeholder="Search jobs, roles, companies (e.g. SDE-1 Google Bangalore)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white col-span-2"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 transition text-white font-semibold py-2 px-4 rounded-xl"
          >
            {loading ? 'Matching...' : 'Find Matches'}
          </button>
        </form>

        <div className="flex flex-col gap-8">
          {jobs.map((job, idx) => (
            <motion.div
              key={`${job._id || job.title}-${job.company}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 p-6 rounded-3xl shadow-2xl hover:shadow-indigo-700/50 transition-all w-full"
            >
              {/* Bookmark Button */}
              <BookmarkButton job={job} />
              
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={job.logo || '/default-logo.png'}
                  alt="logo"
                  className="w-12 h-12 rounded-full bg-white p-1"
                />
                <div>
                  <h2 className="text-2xl font-bold text-white/90">{job.title}</h2>
                  <p className="text-zinc-400 text-sm">{job.company}</p>
                </div>
              </div>

              <div className="text-zinc-300 text-sm mb-2 flex items-center gap-2">
                <FaMapMarkerAlt className="text-indigo-400" /> {job.location}
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-white mb-3">
                {job.skills?.map((skill, i) => (
                  <span
                    key={i}
                    className="bg-indigo-700/20 border border-indigo-400 px-2 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                {isValidExternalLink(job.applyLink) ? (
                  <a
                    href={job.applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-400 hover:underline text-sm"
                  >
                    Apply via LinkedIn <FaExternalLinkAlt className="text-xs" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 text-zinc-500 text-sm">
                    Apply link not available
                  </span>
                )}

                <button
                  onClick={() => setSelectedJob(job)}
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1 text-sm rounded-xl text-white"
                >
                  View Details
                </button>
              </div>

              {/* AI Suggestions Component */}
              <SuggestButton job={job} />
              
              {/* Resume Score Component */}
              <ResumeScoreButton job={job} />
            </motion.div>
          ))}
        </div>

        {jobs.length < total && (
          <div className="mt-10 text-center">
            <button
              onClick={(e) => fetchJobs(e, false)}
              className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl text-white"
            >
              {loading ? 'Loading...' : 'See More'}
            </button>
          </div>
        )}
      </main>

      {/* Popup Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
          <div className="relative bg-zinc-900 p-6 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-red-500"
            >
              <FaTimes size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-2 text-white">{selectedJob.title}</h2>
            <p className="text-indigo-400 mb-4">
              {selectedJob.company} — {selectedJob.location}
            </p>
            <pre className="text-sm text-zinc-300 whitespace-pre-wrap">
              {selectedJob.description || 'No detailed description available.'}
            </pre>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default withAuth(MatchPage);
