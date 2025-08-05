'use client';

import React, { useState } from 'react';
import { FaGoogle, FaGithub, FaEnvelope, FaLinkedin } from 'react-icons/fa';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!isLogin) {
      
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');

        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.ok) {
          router.push('/dashboard');
        } else {
          setError('Login failed after signup');
        }
      } catch (err) {
        setError(err.message);
      }
    } else {
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    }
  };

  const handleOAuthSignIn = async (provider) => {
    try {
      const result = await signIn(provider, {
        callbackUrl: '/dashboard',
        redirect: true,
      });
    } catch (error) {
      setError('OAuth sign in failed');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-800 px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">
          {isLogin ? 'Welcome Back' : 'Join DeepHire'}
        </h1>
        <p className="text-zinc-400 mb-6">
          {isLogin ? 'Log in to continue' : 'Create your account'}
        </p>

        <div className="flex flex-col gap-3 text-sm">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-800 text-white px-4 py-2 rounded-md border border-white/10 focus:outline-none"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-zinc-800 text-white px-4 py-2 rounded-md border border-white/10 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-zinc-800 text-white px-4 py-2 rounded-md border border-white/10 focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition-all"
          >
            {isLogin ? 'Login' : 'Sign up'}
          </button>
        </div>

        <div className="my-4 text-zinc-400 text-sm">or</div>

        <div className="flex flex-col gap-3 text-sm">
          <AuthButton 
            icon={<FaGoogle />} 
            text={`${isLogin ? 'Log in' : 'Sign up'} with Google`} 
            onClick={() => handleOAuthSignIn('google')} 
          />
          <AuthButton 
            icon={<FaLinkedin />} 
            text={`${isLogin ? 'Log in' : 'Sign up'} with LinkedIn`} 
            onClick={() => handleOAuthSignIn('linkedin')} 
          />
          <AuthButton 
            icon={<FaGithub />} 
            text={`${isLogin ? 'Log in' : 'Sign up'} with GitHub`} 
            onClick={() => handleOAuthSignIn('github')} 
          />
        </div>

        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

        <p className="mt-6 text-xs text-zinc-500">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>

        <div className="mt-6 text-sm text-zinc-400">
          {isLogin ? (
            <>
              Don’t have an account?{' '}
              <button
                className="text-indigo-400 hover:underline"
                onClick={() => setIsLogin(false)}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                className="text-indigo-400 hover:underline"
                onClick={() => setIsLogin(true)}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

const AuthButton = ({ icon, text, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-white py-3 rounded-md hover:bg-zinc-700 transition-all border border-white/10"
  >
    <span className="text-lg">{icon}</span>
    {text}
  </button>
);

export default LoginPage;
