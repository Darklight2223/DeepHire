'use client';

import { useEffect, useState } from 'react';
import {
  FaFileAlt,
  FaGithub,
  FaRocket,
  FaUserCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaCloudUploadAlt,
  FaSync,
  FaSearch,
  FaMapMarkerAlt,
  FaTrash,
  FaExternalLinkAlt,
  FaBriefcase,
  FaTimes,
} from 'react-icons/fa';
import Footer from '../components/Footer';
import Header from '../components/Header';
import withAuth from '../lib/withAuth';

const Dashboard = () => {
  const [resumeUploaded, setResumeUploaded] = useState(null);
  const [githubRepos, setGithubRepos] = useState(0);
  const [userName, setUserName] = useState('');
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showCount, setShowCount] = useState(6);
  const jobsPerBatch = 6;

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/userinfo');
        const data = await res.json();
        setUserName(data.name || 'User');
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    };
    fetchUserInfo();
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboarddata');
        const data = await res.json();
        setResumeUploaded(data.resumeUploaded);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchGithubData = async () => {
      try {
        const res = await fetch('/api/githubdata');
        const data = await res.json();
        setGithubRepos(data.githubRepos);
      } catch (err) {
        console.error('Error fetching GitHub data:', err);
      }
    };
    fetchGithubData();
  }, []);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const res = await fetch('/api/my-saved-jobs');
        const data = await res.json();
        setSavedJobs(data.savedJobs || []);
        setSavedJobsCount(data.totalCount || 0);
        setShowCount(6); 
      } catch (err) {
        console.error('Error fetching saved jobs:', err);
      }
    };
    fetchSavedJobs();
  }, []);

  // Calculate visible jobs
  const visibleJobs = savedJobs.slice(0, showCount);
  const hasMoreJobs = showCount < savedJobs.length;

  const showMoreJobs = () => {
    setShowCount(prev => Math.min(prev + jobsPerBatch, savedJobs.length));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white">
      <Header />
      <main className="pt-24 flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {userName} 👋</h1>
              <p className="text-zinc-400 mt-1">
                Here's what's happening with your profile today.
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/profile'}
              className="hover:scale-105 active:scale-95 transition-all duration-200 p-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur border border-white/10 shadow-md"
              aria-label="Go to Profile"
            >
              <FaUserCircle className="text-5xl text-zinc-300 drop-shadow" />
            </button>

          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              icon={
                resumeUploaded === null ? (
                  <FaFileAlt />
                ) : resumeUploaded ? (
                  <FaCheckCircle className="text-green-500" />
                ) : (
                  <FaTimesCircle className="text-red-500" />
                )
              }
              title="Resume Uploaded"
              value={
                resumeUploaded === null
                  ? 'Loading...'
                  : resumeUploaded
                    ? 'Uploaded'
                    : 'Not Found'
              }
            />

            <Card
              icon={<FaGithub />}
              title="GitHub Synced"
              value={`${githubRepos} Repos`}
            />

            <Card icon={<FaRocket />} title="Saved Jobs" value={`${savedJobsCount} Jobs`} />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <ActionCard
              title="Upload or Re-analyze your Resume"
              icon={<FaCloudUploadAlt />}
              button="Upload Now"
              onClick={() => window.location.href = '/resume'}
            />
            <ActionCard
              title="Sync your GitHub Projects"
              icon={<FaSync />}
              button="Sync GitHub"
              onClick={() => window.location.href = '/github'}
            />
            <ActionCard
              title="Get Smart Job Matches"
              icon={<FaSearch />}
              button="Find Jobs"
              onClick={() => window.location.href = '/match'}
            />
          </div>

          {/* Matches */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Your Saved Jobs</h2>
              {savedJobs.length > 0 && (
                <div className="text-sm text-zinc-400">
                  Showing {visibleJobs.length} of {savedJobs.length} jobs
                </div>
              )}
            </div>
            
            {savedJobs.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-max">
                  {visibleJobs.map((job, idx) => (
                    <SavedJobCard
                      key={job._id}
                      job={job}
                      onDelete={(job) => {
                        setJobToDelete(job);
                        setShowDeleteModal(true);
                      }}
                    />
                  ))}
                </div>

                {/* Show More Button */}
                {hasMoreJobs && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={showMoreJobs}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                    >
                      <span>Show More Jobs ({savedJobs.length - showCount} remaining)</span>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-zinc-400">
                <FaRocket className="text-4xl mx-auto mb-4 opacity-50" />
                <p className="mb-2">No saved jobs yet.</p>
                <p className="text-sm mb-4">Start by bookmarking jobs you're interested in on the match page!</p>
                <button
                  onClick={() => window.location.href = '/match'}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
                >
                  Find Jobs to Save
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && jobToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 rounded-3xl max-w-md w-full border border-zinc-700 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-400 text-2xl" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Remove Saved Job?</h3>
              <p className="text-zinc-400 mb-2">Are you sure you want to remove</p>
              <p className="text-white font-semibold mb-6">"{jobToDelete.title}" at {jobToDelete.company}?</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setJobToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/save-job?jobId=${jobToDelete.jobId}`, {
                        method: 'DELETE',
                      });
                      
                      if (res.ok) {
                        // Remove from local state
                        setSavedJobs(prev => {
                          const newJobs = prev.filter(j => j._id !== jobToDelete._id);
                          // Adjust show count if needed
                          if (showCount > newJobs.length) {
                            setShowCount(newJobs.length);
                          }
                          return newJobs;
                        });
                        setSavedJobsCount(prev => prev - 1);
                      }
                    } catch (error) {
                      console.error('Error removing job:', error);
                    }
                    
                    setShowDeleteModal(false);
                    setJobToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

// Card
const Card = ({ icon, title, value }) => (
  <div className="p-5 rounded-2xl bg-white/5 backdrop-blur border border-white/10 flex flex-col items-start space-y-3 shadow-md transition duration-300 hover:scale-105">
    <div className="text-3xl text-indigo-400">{icon}</div>
    <div className="text-zinc-400">{title}</div>
    <div className="text-xl font-semibold text-white">{value}</div>
  </div>
);

// ActionCard
const ActionCard = ({ title, button, icon, onClick }) => (
  <div className="p-6 rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-md flex flex-col justify-between transition-all duration-300 hover:bg-white/10 hover:scale-105">
    <div className="flex items-center space-x-3 mb-3">
      <div className="text-xl text-indigo-400">{icon}</div>
      <h3 className="text-white text-md font-semibold">{title}</h3>
    </div>
    <button 
      onClick={onClick}
      className="mt-auto px-4 py-2 bg-indigo-500 hover:bg-indigo-600 transition rounded-lg text-sm font-medium w-fit"
    >
      {button}
    </button>
  </div>
);

// MatchCard
const MatchCard = ({ title, match, skills }) => (
  <div className="p-5 rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-md hover:bg-white/10 transition duration-300">
    <div className="flex justify-between items-center mb-2">
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <span className="text-indigo-400 font-bold">{match} Match</span>
    </div>
    <div className="mt-2 flex gap-2 flex-wrap">
      {skills.map(skill => (
        <span
          key={skill}
          className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full shadow-sm"
        >
          {skill}
        </span>
      ))}
    </div>
  </div>
);


const SavedJobCard = ({ job, onDelete }) => {
  return (
    <div className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 backdrop-blur-xl border border-zinc-700/30 rounded-2xl p-5 hover:border-indigo-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 hover:scale-[1.02] hover:-translate-y-1">
      
   
      <button
        onClick={() => onDelete(job)}
        className="absolute top-4 right-4 p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 transition-all duration-300 hover:scale-110"
        title="Remove from saved jobs"
      >
        <FaTrash className="w-3.5 h-3.5" />
      </button>

     
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/25">
            {job.logo ? (
              <img src={job.logo} alt={job.company} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <FaBriefcase className="text-white text-2xl" />
            )}
          </div>
         
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 -z-10"></div>
        </div>

        {/* Job Info */}
        <div className="flex-1 pr-12">
          <h3 className="text-xl font-bold text-white mb-1 leading-tight group-hover:text-indigo-300 transition-colors duration-300">
            {job.title}
          </h3>
          <p className="text-indigo-400 font-semibold text-lg mb-2">
            {job.company}
          </p>
          
          {/* Location */}
          {job.location && (
            <div className="flex items-center gap-2 text-zinc-400 mb-3">
              <div className="p-1 rounded-lg bg-zinc-700/50">
                <FaMapMarkerAlt className="text-xs" />
              </div>
              <span className="text-sm font-medium">{job.location}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-5">
        <div className="flex flex-wrap gap-2">
          {job.skills?.slice(0, 4).map((skill, index) => (
            <span
              key={skill}
              className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 text-xs font-medium px-3 py-1.5 rounded-xl border border-indigo-400/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all duration-300"
            >
              {skill}
            </span>
          ))}
          {job.skills?.length > 4 && (
            <span className="text-zinc-400 text-xs font-medium px-3 py-1.5 rounded-xl bg-zinc-700/30 border border-zinc-600/30">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-700/30">
     
        <a
          href={job.applyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-xl hover:shadow-2xl group/btn overflow-hidden"
        >
        
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 blur-lg opacity-30 group-hover/btn:opacity-50 transition-opacity duration-300"></div>
          <span className="relative z-10">Apply Now</span>
          <FaExternalLinkAlt className="relative z-10 text-sm group-hover/btn:translate-x-1 group-hover/btn:scale-110 transition-all duration-300" />
        </a>

     
        <div className="flex items-center gap-2 text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-xs font-medium">
            Saved {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

  
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </div>
  );
};

export default withAuth(Dashboard);
