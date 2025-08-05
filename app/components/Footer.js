'use client';

import React from 'react';
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../lib/useAuth';

const Footer = () => {
  const { isLoggedIn } = useAuth();

  return (
    <footer className="w-full bg-zinc-900 border-t border-white/10 py-10">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-10 text-zinc-400 text-sm">

        {/* Brand Info */}
        <div>
          <h2 className="text-white text-xl font-semibold mb-2">DeepHire</h2>
          <p>Your intelligent career assistant — analyzing resumes, GitHub, and matching you with top jobs.</p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col space-y-2">
          <h3 className="text-white font-medium mb-1">Quick Links</h3>
          {!isLoggedIn ? (
            <>
              <button onClick={() => window.location.href = '/'} className="hover:text-white transition text-left">Home</button>
              <button onClick={() => window.location.href = '/about'} className="hover:text-white transition text-left">About</button>
              <button onClick={() => window.location.href = '/contact'} className="hover:text-white transition text-left">Contact</button>
            </>
          ) : (
            <>
              <button onClick={() => window.location.href = isLoggedIn ? '/dashboard' : '/'} className="hover:text-white transition text-left">Home</button>
              <button onClick={() => window.location.href = '/about'} className="hover:text-white transition text-left">About</button>
              <button onClick={() => window.location.href = '/contact'} className="hover:text-white transition text-left">Contact</button>
              <button onClick={() => window.location.href = '/profile'} className="hover:text-white transition text-left">Profile</button>
            </>
          )}
        </div>

        {/* Social */}
        <div className="flex flex-col space-y-3">
          <h3 className="text-white font-medium mb-1">Connect</h3>
          <div className="flex space-x-4 text-xl">
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              <FaGithub />
            </a>
            <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              <FaLinkedin />
            </a>
            <a href="mailto:hello@deephire.ai" className="hover:text-white">
              <FaEnvelope />
            </a>
          </div>
          <p>hello@deephire.ai</p>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-10 text-center text-zinc-600 text-xs border-t border-white/10 pt-4">
        © {new Date().getFullYear()} DeepHire. Crafted with 💻 by Kanishk Kumar.
      </div>
    </footer>
  );
};

export default Footer;
