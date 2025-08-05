'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Message sent:', form);
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-28 pb-20 bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white px-6">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-zinc-400 mb-8">
            Have a question, suggestion, or just want to say hi? We'd love to hear from you.
          </p>

          {submitted ? (
            <div className="bg-green-600/20 border border-green-500 text-green-400 py-4 px-6 rounded-xl">
              ✅ Thank you! We'll get back to you soon.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg text-left"
            >
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white border border-white/20 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-full text-white font-semibold transition-all"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Contact;