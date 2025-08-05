'use client';

import React, { useEffect, useState } from 'react';
import {
    FaGithub, FaCodeBranch, FaStar, FaUsers, FaLink,
} from 'react-icons/fa';
import Footer from '../components/Footer';
import Header from '../components/Header';
import withAuth from '../lib/withAuth';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GitHubPage = () => {
    const [username, setUsername] = useState('');
    const [profile, setProfile] = useState(null);
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [score, setScore] = useState(null);
    const [languageData, setLanguageData] = useState([]);
    const [showSyncPopup, setShowSyncPopup] = useState(false);


    const fetchGitHubData = async () => {
        setLoading(true);
        setFeedback('');
        setScore(null);
        try {
            const resProfile = await fetch(`https://api.github.com/users/${username}`);
            const profileData = await resProfile.json();

            const resRepos = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
            const reposData = await resRepos.json();

            if (!Array.isArray(reposData)) {
                throw new Error(`GitHub API error: ${reposData.message || 'Unexpected response'}`);
            }

            const sortedRepos = reposData
                .filter(repo => !repo.fork)
                .sort((a, b) => b.stargazers_count - a.stargazers_count)
                .slice(0, 6);

            setProfile(profileData);
            setRepos(sortedRepos);

        } catch (error) {
            console.error('GitHub fetch error:', error);
        }
        setLoading(false);
    };

    const handleSyncNow = async () => {
        if (!profile) return;
        try {
            await fetch('/api/save-github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: profile.login,
                    publicRepoCount: profile.public_repos,
                }),
            });
            setShowSyncPopup(true);
        } catch (err) {
            console.error('Failed to sync GitHub data:', err);
            alert('Failed to sync GitHub data.');
        }
    };

    const handleRateGithub = async () => {
        setAnalyzing(true);
        setFeedback('');
        try {
            const res = await fetch('http://127.0.0.1:8000/analyze/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile, repos }),
            });

            const data = await res.json();
            setFeedback(data.feedback);

            const scoreMatch = data.feedback.match(/score.*?(\d{1,3})\%?/i);
            if (scoreMatch) {
                setScore(Number(scoreMatch[1]));
            }
        } catch (err) {
            console.error(err);
            setFeedback('Error analyzing GitHub profile.');
        }
        setAnalyzing(false);
    };

    useEffect(() => {
        const fetchLanguages = async () => {
            const languageTotals = {};

            await Promise.all(repos.map(async (repo) => {
                try {
                    const res = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/languages`);
                    const data = await res.json();

                    for (const [lang, bytes] of Object.entries(data)) {
                        languageTotals[lang] = (languageTotals[lang] || 0) + bytes;
                    }
                } catch (err) {
                    console.error(`Error fetching languages for ${repo.name}:`, err);
                }
            }));

            const languageArray = Object.entries(languageTotals).map(([name, value]) => ({
                name,
                value,
            }));

            const filtered = languageArray.filter(lang => lang.value > 0);
            setLanguageData(filtered);
        };

        if (repos.length > 0) {
            fetchLanguages();
        }
    }, [repos]);

    const COLORS = [
        '#7c3aed', '#6366f1', '#4f46e5', '#8b5cf6', '#a78bfa',
        '#c084fc', '#e879f9', '#ec4899', '#f43f5e', '#f97316',
        '#facc15', '#4ade80', '#22d3ee', '#38bdf8', '#06b6d4',
    ];

    const IGNORED_LANGUAGES = ['HTML', 'CSS', 'Shell', 'Batchfile', 'Makefile', 'SCSS'];

    const topLanguages = languageData
        .filter(lang => !IGNORED_LANGUAGES.includes(lang.name))
        .sort((a, b) => b.value - a.value);

    const top5 = topLanguages.slice(0, 5);
    const others = topLanguages.slice(5);
    const othersValue = others.reduce((acc, cur) => acc + cur.value, 0);

    if (othersValue > 0) {
        top5.push({ name: 'Others', value: othersValue });
    }

    const totalBytes = top5.reduce((acc, cur) => acc + cur.value, 0);

    const pieData = top5.map(({ name, value }) => ({
        name,
        value,
        percent: ((value / totalBytes) * 100).toFixed(1),
    }));

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white">
            <Header />
            <main className="pt-24 flex-1 p-6">
                <div className="max-w-6xl mx-auto space-y-10">
                    <h1 className="text-3xl font-bold">🔍 Analyze Your GitHub</h1>

                    {/* Input Field */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your GitHub username"
                            className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg w-full text-white placeholder:text-zinc-400"
                        />
                        <button
                            onClick={fetchGitHubData}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition rounded-lg text-sm font-medium"
                        >
                            Sync GitHub
                        </button>
                    </div>

                    {loading && <p className="text-zinc-400">Fetching GitHub data...</p>}

                    {profile && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
                            {/* Profile Card */}
                            <div className="flex items-center gap-6">
                                <img
                                    src={profile.avatar_url}
                                    alt="avatar"
                                    className="w-20 h-20 rounded-full border-4 border-indigo-500"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold">{profile.name || profile.login}</h2>
                                    <p className="text-zinc-400">{profile.bio}</p>
                                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
                                        <span><FaUsers className="inline mr-1" /> {profile.followers} Followers</span>
                                        <span><FaCodeBranch className="inline mr-1" /> {profile.public_repos} Repos</span>
                                        <a href={profile.html_url} target="_blank" rel="noreferrer" className="hover:underline text-indigo-400">
                                            <FaLink className="inline mr-1" /> View on GitHub
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Section */}
                            {pieData.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-semibold mt-8 mb-2">📊 Languages Used</h3>
                                    <div className="w-full h-64">
                                        <ResponsiveContainer>
                                            <PieChart width={400} height={300}>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={90}
                                                    dataKey="value"
                                                    label={false}
                                                    labelLine={false}
                                                >
                                                    {pieData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value, name) => {
                                                        const percent = ((value / totalBytes) * 100).toFixed(1);
                                                        return [`${percent}%`, name];
                                                    }}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Top Repositories */}
                            <h3 className="text-xl font-semibold mt-6">🔥 Top Repositories</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                {repos.map(repo => (
                                    <div
                                        key={repo.id}
                                        className="p-4 bg-white/10 border border-white/10 rounded-lg shadow-md"
                                    >
                                        <h4 className="text-lg font-bold">{repo.name}</h4>
                                        <p className="text-zinc-400 text-sm">{repo.description}</p>
                                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-300">
                                            <span><FaStar className="inline mr-1" /> {repo.stargazers_count} Stars</span>
                                            <span><FaCodeBranch className="inline mr-1" /> {repo.forks_count} Forks</span>
                                            <span>🛠 {repo.language}</span>
                                        </div>
                                        <a
                                            href={repo.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block mt-2 text-indigo-400 text-sm hover:underline"
                                        >
                                            Visit Repo →
                                        </a>
                                    </div>
                                ))}
                            </div>

                            {/* Gemini AI Feedback */}
                            <div className="mt-10 text-center">
                                <button
                                    onClick={handleRateGithub}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-lg font-semibold transition"
                                >
                                    {analyzing ? 'Analyzing...' : '✨ Rate My GitHub (AI)'}
                                </button>
                            </div>

                            {score && (
                                <div className="mt-4 text-center text-lg font-bold text-green-400">
                                    🚀 Gemini AI Score: {score}/100
                                </div>
                            )}

                            {feedback && (
                                <div className="mt-8 bg-white/10 p-6 rounded-lg border border-white/10 shadow-inner">
                                    <h4 className="text-xl font-bold mb-2 text-indigo-400">💡 Gemini Feedback</h4>
                                    <pre className="whitespace-pre-wrap text-sm text-zinc-300">{feedback}</pre>
                                </div>
                            )}

                            {showSyncPopup && (
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                                    <div className="bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl p-6 max-w-sm text-center space-y-4">
                                        <h2 className="text-xl font-semibold text-green-400">✅ Synced Successfully!</h2>
                                        <p className="text-zinc-300 text-sm">Your GitHub data has been saved to the database.</p>
                                        <button
                                            onClick={() => setShowSyncPopup(false)}
                                            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium"
                                        >
                                            Okay
                                        </button>
                                    </div>
                                </div>
                            )}


                            <div className="mt-4 text-center">
                                <button
                                    onClick={handleSyncNow}
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-semibold transition"
                                >
                                    💾 Sync Now to DB
                                </button>
                            </div>

                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default withAuth(GitHubPage);
