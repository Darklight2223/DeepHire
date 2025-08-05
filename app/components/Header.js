'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { signOut } from 'next-auth/react';

const Header = () => {
  const { isLoggedIn, loading } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo Link */}
          <button
            onClick={() => window.location.href = isLoggedIn ? '/dashboard' : '/'}
            className="text-2xl font-bold text-white tracking-tight hover:opacity-80 transition-opacity"
          >
            Deep<span className="text-indigo-400">Hire</span>
          </button>

          {/* Navigation */}
          <nav className="flex items-center space-x-4 text-sm font-medium text-zinc-300">
            <button
              onClick={() => window.location.href = isLoggedIn ? '/dashboard' : '/'}
              className="px-4 py-2 hover:text-white transition-all inline-flex items-center"
            >
              Home
            </button>

            {!loading && isLoggedIn ? (
              <>
                <button
                  onClick={() => window.location.href = '/match'}
                  className="px-4 py-2 hover:text-white transition-all inline-flex items-center"
                >
                  Get Job
                </button>
                <button
                  onClick={() => window.location.href = '/seejob'}
                  className="px-4 py-2 hover:text-white transition-all inline-flex items-center"
                >
                  Post Job
                </button>
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="px-4 py-2 hover:text-white transition-all inline-flex items-center"
                >
                  Profile
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium rounded-md shadow-sm transition-all inline-flex items-center"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => window.location.href = '/about'}
                  className="px-4 py-2 hover:text-white transition-all inline-flex items-center"
                >
                  About
                </button>
                <button
                  onClick={() => window.location.href = '/contact'}
                  className="px-4 py-2 hover:text-white transition-all inline-flex items-center"
                >
                  Contact
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Confirm Logout Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl w-[90%] max-w-md text-center text-zinc-200">
            <h2 className="text-xl font-bold mb-4 text-white">Confirm Logout</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to log out? You’ll be returned to the homepage.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-md bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-md transition-all"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2 rounded-md bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
