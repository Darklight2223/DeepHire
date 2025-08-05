'use client';

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaBrain, FaGithub, FaFileAlt, FaUserCheck } from 'react-icons/fa';

const About = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow pt-28 pb-10 bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent animate-fade-in">
            What is DeepHire?
          </h1>
          <p className="text-zinc-300 text-lg mb-12 animate-fade-in delay-100">
            DeepHire is your intelligent career assistant — seamlessly analyzing resumes, GitHub profiles, and matching you to the best job opportunities using AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {[
            {
              Icon: FaFileAlt,
              title: 'Smart Resume Parser',
              color: 'text-indigo-400',
              desc: 'Upload your resume and let DeepHire extract your skills, experience, and strengths. We provide insights and improvement suggestions too.',
            },
            {
              Icon: FaGithub,
              title: 'GitHub Analyzer',
              color: 'text-purple-400',
              desc: 'Connect your GitHub profile to get a breakdown of your repositories, languages, commit history, and discover how recruiters might view your work.',
            },
            {
              Icon: FaUserCheck,
              title: 'Job Matching Engine',
              color: 'text-green-400',
              desc: 'We use AI to match your profile to relevant job openings based on your resume, projects, and coding profile.',
            },
            {
              Icon: FaBrain,
              title: 'Fully AI-Powered',
              color: 'text-pink-400',
              desc: 'Everything you upload is processed using Google-Gemini models to provide intelligent insights — no manual effort required.',
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:scale-[1.02] transform transition-all duration-300 group"
            >
              <card.Icon className={`text-4xl mb-4 ${card.color} group-hover:scale-110 transition-transform`} />
              <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
              <p className="text-zinc-400">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-24 text-center animate-fade-in delay-200">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            How to Use DeepHire
          </h2>
          <ol className="text-zinc-300 space-y-4 text-left list-decimal list-inside bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg">
            <li>Sign up and complete your profile with resume and GitHub link.</li>
            <li>Analyze your resume and GitHub to get personalized insights.</li>
            <li>Let DeepHire suggest job openings that match your strengths.</li>
            <li>Improve your profile using suggestions and apply directly.</li>
          </ol>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
