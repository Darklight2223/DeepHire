'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import {
  FaGithub,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaBriefcase,
  FaCode,
  FaTrash,
  FaExclamationTriangle,
} from 'react-icons/fa';

export default function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const res = await fetch('/api/userinfo');
      const data = await res.json();
      setUserData(data);
    };
    fetchUserInfo();
  }, []);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/delete-account', {
        method: 'DELETE',
      });

      if (res.ok) {
        // Sign out user and redirect to home
        await signOut({ callbackUrl: '/' });
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!userData) return <div className="text-center mt-20 text-white">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/5 rounded-full border border-white/10 backdrop-blur">
              <FaUser className="text-4xl text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-md">
                {userData.name}
              </h1>
              <p className="text-zinc-400 text-sm mt-1 flex items-center gap-2">
                <FaEnvelope className="inline" /> {userData.email}
              </p>
              {userData.phone && (
                <p className="text-zinc-400 text-sm mt-1 flex items-center gap-2">
                  <FaPhoneAlt className="inline" /> {userData.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-4">
            {/* Delete Account Button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
            >
              <FaTrash className="text-xs" />
              Delete Account
            </button>

            {userData.githubUsername && (
              <div className="text-right">
                <h2 className="text-md font-semibold text-indigo-400">
                  <FaGithub className="inline mr-1" />
                  {userData.githubUsername}
                </h2>
                <p className="text-zinc-400 text-sm">{userData.githubRepos} Public Repos</p>
                <p className="text-zinc-500 text-xs">
                  Last synced: {new Date(userData.githubLastSynced).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Resume Download Button */}
        {userData.resumeUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <a
              href={userData.resumeUrl}
              download
              className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            >
              📄 Download Resume
            </a>
          </motion.div>
        )}

        {/* Sections */}
        <Divider />
        <AnimatedSection title="💼 Experience" items={userData.experience} type="experience" />
        <Divider />
        <AnimatedSection title="🎓 Education" items={userData.education} />
        <Divider />
        <AnimatedSection title="🚀 Projects" items={userData.projects} type="projects" />
        <Divider />
        <AnimatedSection title="🏆 Achievements" items={userData.achievements} />
        <Divider />
        <AnimatedSection title="🎯 Skills" items={userData.skills} type="tag" />
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 rounded-3xl max-w-md w-full border border-red-500/30 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="text-red-400 text-2xl" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Delete Account Permanently?</h3>
              <p className="text-zinc-400 mb-2">This action cannot be undone. This will permanently:</p>
              
              <div className="text-left text-sm text-zinc-300 mb-6 space-y-1">
                <p>• Delete your profile and personal information</p>
                <p>• Remove all your posted jobs</p>
                <p>• Delete all your saved jobs</p>
                <p>• Remove your resume and GitHub data</p>
                <p>• Close your account permanently</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-all duration-200 font-medium"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const Divider = () => (
  <div className="w-full h-px bg-white/10 backdrop-blur-sm shadow-inner" />
);

const AnimatedSection = ({ title, items, type }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
  >
    <Section title={title} items={items} type={type} />
  </motion.div>
);

const Section = ({ title, items, type = 'card' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-semibold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 drop-shadow-sm">
        {title}
      </h2>

      {type === 'tag' ? (
        <div className="flex flex-wrap gap-3">
          {items.map((item, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-indigo-600/20 text-indigo-300 text-sm font-medium rounded-full border border-indigo-500/30 backdrop-blur shadow hover:scale-105 hover:shadow-[0_0_10px_rgba(99,102,241,0.5)] transition"
            >
              {item}
            </span>
          ))}
        </div>
      ) : type === 'experience' ? (
        <div className="grid grid-cols-1 gap-5">
          {items.map((exp, index) => (
            <ExpandableCard
              key={index}
              icon={<FaBriefcase className="text-green-400 text-lg" />}
              title={exp.title || exp}
              subtitle={exp.company}
              duration={exp.duration}
              bullets={exp.bullets}
              color="green"
            />
          ))}
        </div>
      ) : type === 'projects' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {items.map((project, index) => (
            <ExpandableCard
              key={index}
              icon={<FaCode className="text-cyan-400 text-lg" />}
              title={project.title || project}
              subtitle={project.description}
              bullets={project.work}
              color="cyan"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 p-5 rounded-xl backdrop-blur-sm shadow-md hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
            >
              <p className="text-zinc-200">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Expandable experience/project card
const ExpandableCard = ({ icon, title, subtitle, duration, bullets, color = 'green' }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm shadow-md hover:bg-white/10 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className={`text-lg font-semibold text-${color}-300`}>{title}</h3>
        </div>
        {duration && (
          <span className="text-xs text-zinc-400 bg-zinc-700/50 px-2 py-1 rounded">
            {duration}
          </span>
        )}
      </div>

      {subtitle && <p className="text-zinc-400 text-sm mb-3">{subtitle}</p>}

      {bullets?.length > 0 && (
        <>
          <ul className="space-y-2 text-zinc-300 text-sm">
            {(expanded ? bullets : bullets.slice(0, 2)).map((bullet, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`text-${color}-400 mt-1`}>•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          {bullets.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-xs text-indigo-400 hover:underline"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
