'use client';

import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaUpload, FaSpinner, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import withAuth from '../lib/withAuth';

const ResumePage = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [loadingSuggestions, setLoadingSuggestions] = useState({});
  const [popup, setPopup] = useState({ show: false, success: false, message: '' });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setLoading(true);

    const formData = new FormData();
    formData.append('resume', file);

    const res = await fetch('http://127.0.0.1:8000/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setExtractedData(data);
    setLoading(false);
  };

  const handleImprove = async (sectionName, items) => {
    setLoadingSuggestions((prev) => ({ ...prev, [sectionName]: true }));

    // Convert items to array of strings if they're objects
    const itemStrings = items?.map(item =>
      typeof item === 'string' ? item :
        item.title ? `${item.title}: ${item.description || item.work?.join(', ') || ''}` :
          JSON.stringify(item)
    ) || [];

    const res = await fetch('http://127.0.0.1:8000/improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: sectionName, items: itemStrings }),
    });

    const data = await res.json();
    setSuggestions((prev) => ({ ...prev, [sectionName]: data.suggestions }));
    setLoadingSuggestions((prev) => ({ ...prev, [sectionName]: false }));
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent animate-fade-in">
            Upload Your Resume
          </h1>
          <p className="text-zinc-400 mb-10 animate-fade-in delay-100">
            We'll analyze your resume and extract skills, experience, education, and more.
          </p>

          {/* Upload Box */}
          <label
            htmlFor="resume-upload"
            className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 px-6 py-4 rounded-xl inline-flex items-center gap-3 shadow-md transition-all backdrop-blur-lg"
          >
            <FaUpload className="text-lg" />
            {uploadedFile ? uploadedFile.name : 'Choose a PDF file'}
            <input
              id="resume-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
            />
          </label>

          {loading && (
            <div className="mt-10 flex justify-center">
              <FaSpinner className="animate-spin text-3xl text-indigo-400" />
            </div>
          )}

          {extractedData && !loading && (
            <div className="mt-12 text-left space-y-10 bg-white/5 p-6 rounded-2xl shadow-lg border border-white/10 backdrop-blur-xl animate-fade-in">
              <Section title="Basic Info" color="text-indigo-400">
                <p><strong>Name:</strong> {extractedData.name}</p>
                <p><strong>Email:</strong> {extractedData.email}</p>
                <p><strong>Phone:</strong> {extractedData.phone}</p>
              </Section>

              <Section title="Skills" color="text-purple-400">
                <div className="flex flex-wrap gap-2 mb-2">
                  {extractedData.skills?.length > 0 ? (
                    extractedData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-600/40"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-zinc-400">No skills found.</p>
                  )}
                </div>
                <ImproveButton section="skills" items={extractedData.skills} loading={loadingSuggestions.skills} onClick={handleImprove} />
                <SuggestionBox data={suggestions.skills} />
              </Section>

              <Section title="Experience" color="text-green-400">
                <ExperienceList items={extractedData.experience} />
                <ImproveButton section="experience" items={extractedData.experience} loading={loadingSuggestions.experience} onClick={handleImprove} />
                <SuggestionBox data={suggestions.experience} />
              </Section>

              <Section title="Education" color="text-yellow-400">
                <BulletList items={extractedData.education} />
                <ImproveButton section="education" items={extractedData.education} loading={loadingSuggestions.education} onClick={handleImprove} />
                <SuggestionBox data={suggestions.education} />
              </Section>

              <Section title="Projects" color="text-cyan-400">
                <ProjectsList items={extractedData.projects} />
                <ImproveButton section="projects" items={extractedData.projects} loading={loadingSuggestions.projects} onClick={handleImprove} />
                <SuggestionBox data={suggestions.projects} />
              </Section>

              <Section title="Achievements" color="text-pink-400">
                <BulletList items={extractedData.achievements} />
                <ImproveButton section="achievements" items={extractedData.achievements} loading={loadingSuggestions.achievements} onClick={handleImprove} />
                <SuggestionBox data={suggestions.achievements} />
              </Section>

              {extractedData.curricular && (
                <Section title="Curricular Activities" color="text-orange-400">
                  <BulletList items={extractedData.curricular} />
                  <ImproveButton section="curricular" items={extractedData.curricular} loading={loadingSuggestions.curricular} onClick={handleImprove} />
                  <SuggestionBox data={suggestions.curricular} />
                </Section>
              )}

              {/* SAVE BUTTON */}
              <div className="text-center mt-10">
  <button
    onClick={async () => {
      try {
        const parseIfString = (data) => {
          if (typeof data === 'string') {
            try {
              return JSON.parse(data);
            } catch {
              return []; 
            }
          }
          return data;
        };

        const experienceRaw = parseIfString(extractedData.experience || []);
        const projectsRaw = parseIfString(extractedData.projects || []);

        const res = await fetch('/api/saveresume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: extractedData.name,
            email: extractedData.email,
            phone: extractedData.phone,
            skills: extractedData.skills || [],
            education: extractedData.education || [],
            achievements: extractedData.achievements || [],
            curricular: extractedData.curricular || [],
            experience: (experienceRaw || []).map(exp => ({
              title: exp.title || '',
              company: exp.company || '',
              duration: exp.duration || '',
              bullets: Array.isArray(exp.bullets)
                ? exp.bullets
                : typeof exp.bullets === 'string'
                ? [exp.bullets]
                : (typeof exp === 'string' ? [exp] : [])
            })),
            projects: (projectsRaw || []).map(proj => ({
              title: proj.title || '',
              description: proj.description || '',
              work: Array.isArray(proj.work)
                ? proj.work
                : typeof proj.work === 'string'
                ? [proj.work]
                : (typeof proj === 'string' ? [proj] : [])
            }))
          })
        });

        const data = await res.json();
        if (data.success) {
          setPopup({ show: true, success: true, message: '✅ Resume saved to database!' });
        } else {
          setPopup({ show: true, success: false, message: '❌ Failed to save. ' + (data.error || 'Try again.') });
        }
      } catch (error) {
        setPopup({ show: true, success: false, message: '❌ Error saving resume. Please try again.' });
        console.error(error);
      }
    }}
    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition"
  >
    📥 Save Resume to Database
  </button>
</div>

            </div>
          )}
        </div>

        {/* MODAL POPUP */}
        {popup.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-white/10">
              <div className="flex flex-col items-center gap-4">
                <div className={`text-4xl ${popup.success ? 'text-green-400' : 'text-red-400'}`}>
                  {popup.success ? '✅' : '❌'}
                </div>
                <h2 className="text-xl font-semibold">
                  {popup.success ? 'Success' : 'Error'}
                </h2>
                <p className="text-center text-zinc-300">{popup.message}</p>
                <button
                  onClick={() => setPopup({ show: false, success: false, message: '' })}
                  className="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}


        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
};


const Section = ({ title, children, color }) => (
  <div>
    <h2 className={`text-2xl font-semibold mb-2 ${color}`}>{title}</h2>
    <div>{children}</div>
  </div>
);

const BulletList = ({ items }) =>
  items?.length > 0 ? (
    <ul className="list-disc pl-6 space-y-1 text-zinc-300">
      {items.map((item, idx) => <li key={idx}>{item}</li>)}
    </ul>
  ) : (
    <p className="text-zinc-400">None found.</p>
  );

const ExperienceList = ({ items }) => {
  if (!items || items.length === 0) {
    return <p className="text-zinc-400">No experience found.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((exp, idx) => (
        <div key={idx} className="bg-white/5 p-4 rounded-lg border border-white/10">
          <h4 className="font-semibold text-green-300">
            {exp.title || exp}
          </h4>
          {exp.company && (
            <p className="text-zinc-400 text-sm">{exp.company}</p>
          )}
          {exp.duration && (
            <p className="text-zinc-400 text-sm mb-2">{exp.duration}</p>
          )}
          {exp.bullets && exp.bullets.length > 0 && (
            <ul className="list-disc pl-4 text-zinc-300 text-sm space-y-1">
              {exp.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

const ProjectsList = ({ items }) => {
  if (!items || items.length === 0) {
    return <p className="text-zinc-400">No projects found.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((proj, idx) => (
        <div key={idx} className="bg-white/5 p-4 rounded-lg border border-white/10">
          <h4 className="font-semibold text-cyan-300">
            {proj.title || proj}
          </h4>
          {proj.description && (
            <p className="text-zinc-400 text-sm mb-2">{proj.description}</p>
          )}
          {proj.work && proj.work.length > 0 && (
            <ul className="list-disc pl-4 text-zinc-300 text-sm space-y-1">
              {proj.work.map((work, i) => (
                <li key={i}>{work}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

const ImproveButton = ({ section, items, loading, onClick }) => (
  <button
    disabled={loading || !items || items.length === 0}
    onClick={() => onClick(section, items)}
    className="mt-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
  >
    {loading ? 'Improving...' : `💡 Suggest Improvements`}
  </button>
);

const SuggestionBox = ({ data }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [lastDataHash, setLastDataHash] = useState(null);

  useEffect(() => {
    const hash = JSON.stringify(data);
    if (hash !== lastDataHash && data?.length > 0) {
      setCollapsed(false);
      setLastDataHash(hash);
    }
  }, [data, lastDataHash]);

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-4 p-4 rounded-lg bg-black/20 border border-white/10 text-zinc-300 leading-relaxed">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-white">Suggestions</h3>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-400 hover:text-indigo-300 transition-all duration-200 font-medium cursor-pointer shadow-sm hover:shadow-indigo-500/20"
        >
          {collapsed ? (
            <>
              <FaChevronDown className="text-indigo-300 transition-transform duration-200" />
              Unfold Suggestions
            </>
          ) : (
            <>
              <FaChevronUp className="text-indigo-300 transition-transform duration-200" />
              Fold Suggestions
            </>
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-2">
          {data.map((sug, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: formatBold(sug) }} />
          ))}
        </div>
      )}
    </div>
  );
};

function formatBold(text) {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*/g, '');
}

export default withAuth(ResumePage);