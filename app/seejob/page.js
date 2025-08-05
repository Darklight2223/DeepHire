'use client';

import { useEffect, useState } from 'react';
import {
  FaTrashAlt, FaPlus, FaBuilding, FaMapMarkerAlt,
  FaSuitcase, FaCalendarAlt, FaEye, FaTimes
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import withAuth from '../lib/withAuth';

const SeeJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/myjobs');
        const data = await res.json();
        setJobs(data.jobs);
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleDelete = async () => {
    if (!jobToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/job/${jobToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs(jobs.filter(job => job._id !== jobToDelete));
        setShowConfirm(false);
        setJobToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete job:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white">
      <Header />
      <main className="pt-24 flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Your Posted Jobs</h1>
            <button
              onClick={() => window.location.href = '/postjob'}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition shadow"
            >
              <FaPlus /> Post Job
            </button>
          </div>

          {loading ? (
            <p className="text-zinc-400">Loading your jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-zinc-400">You haven’t posted any jobs yet.</p>
          ) : (
            <div className="space-y-6">
              {jobs.map(job => (
                <div
                  key={job._id}
                  className="p-5 rounded-xl bg-white/5 backdrop-blur border border-white/10 shadow-md hover:bg-white/10 transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-white">{job.title}</h2>
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="text-indigo-400 hover:text-indigo-500"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setJobToDelete(job._id);
                          setShowConfirm(true);
                        }}
                        className="text-red-400 hover:text-red-600"
                        title="Delete"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>

                  <p className="flex items-center gap-2 text-sm text-zinc-300">
                    <FaBuilding /> {job.company}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-zinc-300">
                    <FaMapMarkerAlt /> {job.location}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-zinc-300">
                    <FaSuitcase /> {job.jobType} • {job.workType}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-zinc-300">
                    <FaCalendarAlt /> Posted on {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Delete Modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 max-w-sm w-full shadow-xl">
              <h2 className="text-xl font-semibold mb-3">Confirm Deletion</h2>
              <p className="text-zinc-400 mb-5">Are you sure you want to delete this job? This action cannot be undone.</p>

              {deleting ? (
                <div className="flex justify-center items-center gap-3 text-zinc-300 text-sm">
                  Deleting...
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Job Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 max-w-2xl w-full shadow-xl overflow-y-auto max-h-[90vh] relative">
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-3 right-3 text-white/50 hover:text-white"
              >
                <FaTimes className="text-xl" />
              </button>
              <h2 className="text-2xl font-semibold mb-3 text-white">{selectedJob.title}</h2>
              <div className="text-zinc-300 text-sm space-y-2">
                <p><FaBuilding className="inline mr-2" />Company: {selectedJob.company}</p>
                <p><FaMapMarkerAlt className="inline mr-2" />Location: {selectedJob.location}</p>
                <p><FaSuitcase className="inline mr-2" />Type: {selectedJob.jobType} • {selectedJob.workType}</p>
                {selectedJob.duration && <p>Duration: {selectedJob.duration}</p>}
                <p>Category: {selectedJob.category}</p>
                <p>Experience: {selectedJob.experience}</p>
                <p>Salary: {selectedJob.salary}</p>
                <p>Apply Link: <a href={selectedJob.applyLink} className="text-indigo-400 underline" target="_blank">{selectedJob.applyLink}</a></p>
                <p>Posted on: {new Date(selectedJob.createdAt).toLocaleDateString()}</p>
                <hr className="my-3 border-white/10" />
                <div>
                  <p className="text-white font-semibold mb-1">Job Description:</p>
                  <div className="prose prose-invert text-zinc-300 max-w-none whitespace-pre-wrap">{selectedJob.description}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default withAuth(SeeJobs);
