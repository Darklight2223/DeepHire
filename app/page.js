'use client';

import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { useAuth } from './lib/useAuth';

const HomePage = () => {
  const { isLoggedIn } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      window.location.href = '/dashboard';
    } else {
      setChecked(true);
    }
  }, [isLoggedIn]);

  if (!checked) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-800 pt-24">
        <div className="text-center max-w-3xl px-6 py-12 rounded-2xl shadow-xl bg-white/5 backdrop-blur-md border border-white/10">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent animate-fade-in">
            DeepHire
          </h1>
          <p className="mt-6 text-lg text-zinc-300">
            Your all-in-one AI hiring assistant. Analyze resumes, GitHub profiles, and match top jobs in seconds.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-6 py-3 rounded-full bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all shadow-md"
            >
              Get Started
            </button>
            <button 
              onClick={() => window.location.href = '/about'}
              className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-all"
            >
              Learn More
            </button>
          </div>

          <div className="mt-10 text-sm text-zinc-500">
            Made with ❤️ for next-gen hiring
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 1s ease-out;
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
