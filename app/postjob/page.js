'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostJobPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    workType: '',
    jobType: '',
    duration: '',
    category: '',
    experience: '',
    salary: '',
    applyLink: '',
    logo: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPosted, setIsPosted] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/post-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setIsPosted(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        alert('❌ Error: ' + data.error);
        setIsSubmitting(false);
      }
    } catch (err) {
      alert('❌ Unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white p-6 relative"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Posting Modal */}
      <AnimatePresence>
        {(isSubmitting || isPosted) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-zinc-900 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 border border-zinc-700 shadow-2xl"
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
            >
              {!isPosted ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 border-opacity-50"></div>
                  <p className="text-lg text-gray-300">Posting your job...</p>
                </>
              ) : (
                <>
                  <div className="text-4xl">✅</div>
                  <p className="text-lg font-semibold text-green-400">Job Posted Successfully!</p>
                  <p className="text-sm text-gray-400">Redirecting to Dashboard...</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Form */}
      <div className="max-w-3xl mx-auto bg-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-indigo-400 mb-6 text-center">🚀 Post a New Job</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          {[
            ['title', 'Job Title'], ['company', 'Company Name'], ['location', 'Location'],
            ['category', 'Job Category'], ['experience', 'Experience (e.g. 0-1 years)'],
            ['salary', 'CTC / Stipend'], ['duration', 'Duration (for interns)'],
            ['applyLink', 'Application Link'], ['logo', 'Company Logo URL']
          ].map(([name, placeholder]) => (
            <input
              key={name}
              name={name}
              value={form[name]}
              onChange={handleChange}
              placeholder={placeholder}
              className="px-4 py-2 rounded-xl bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-300"
              required={name !== 'duration' && name !== 'logo'}
              disabled={isSubmitting}
            />
          ))}

          <div className="flex flex-col md:flex-row gap-4">
            <select
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
              className="bg-zinc-700 p-2 rounded-xl focus:ring-2 focus:ring-indigo-500"
              required
              disabled={isSubmitting}
            >
              <option value="">Select Job Type</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Internship">Internship</option>
            </select>

            <select
              name="workType"
              value={form.workType}
              onChange={handleChange}
              className="bg-zinc-700 p-2 rounded-xl focus:ring-2 focus:ring-indigo-500"
              required
              disabled={isSubmitting}
            >
              <option value="">Work Mode</option>
              <option value="Onsite">Onsite</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Job Description (Markdown supported)"
            className="p-4 min-h-[120px] rounded-xl bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-300"
            required
            disabled={isSubmitting}
          />

          <button
            type="submit"
            className={`w-full mt-4 transition p-3 rounded-xl text-white text-lg font-semibold ${
              isSubmitting
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            disabled={isSubmitting}
          >
            ✅ Post Job
          </button>
        </form>
      </div>
    </motion.div>
  );
}
