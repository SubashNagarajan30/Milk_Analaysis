import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import Card from './ui/Card';

const LoginSelector: React.FC = () => {
  const { login } = useAuth();
  const { users, isOffline } = useData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isOffline) {
      // Offline client-side authentication fallback
      const foundUser = users.find(u => u.username === username && u.password === password);
      if (foundUser) {
        login(foundUser);
        setError('');
      } else {
        setError('Invalid username or password');
      }
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const user = await res.json();
        login(user);
        setError('');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      // If server becomes unreachable, try client-side authentication fallback
      const foundUser = users.find(u => u.username === username && u.password === password);
      if (foundUser) {
        login(foundUser);
        setError('');
      } else {
        setError('Failed to connect to authentication server');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-3d-ambient">
      {/* 3D background elements */}
      <div className="grid-overlay-3d"></div>
      <div className="orb-3d orb-indigo"></div>
      <div className="orb-3d orb-teal"></div>
      
      <Card className="w-full max-w-md card-3d p-8 rounded-2xl relative z-10">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome to MilkHub</h1>
          <p className="mt-2 text-indigo-200/80 text-sm">Sign in to access your analytics dashboard</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="w-full input-3d"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full input-3d"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-200 text-sm rounded-xl">
              <p className="font-semibold text-center">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition duration-200"
            >
              Sign In
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LoginSelector;