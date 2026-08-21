'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginFormClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Invalid email or password.');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        boxSizing: 'border-box',
        fontFamily: "'IBM Plex Sans', sans-serif",
        color: '#191510',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#F7F3EA',
          borderRadius: '0px',
          border: '1px solid rgba(25, 21, 16, 0.14)',
          padding: '2.5rem 2rem',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: '700',
            color: '#A63A2C',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          ADMINISTRATION ACCESS
        </div>

        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.85rem', fontWeight: '700', color: '#191510', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
          Admin Portal
        </h2>
        <p style={{ color: '#55503F', fontSize: '0.95rem', margin: '0 0 2rem 0', lineHeight: '1.5', fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Sign in with administrator credentials to manage courses and system settings.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '0px',
                border: '1.5px solid #191510',
                backgroundColor: '#FFFFFF',
                color: '#191510',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: "'IBM Plex Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password *
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 2.75rem 0.85rem 1rem',
                  borderRadius: '0px',
                  border: '1.5px solid #191510',
                  backgroundColor: '#FFFFFF',
                  color: '#191510',
                  fontSize: '0.95rem',
                  outline: 'none',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#191510',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '0.85rem', backgroundColor: '#FFFFFF', border: '1.5px solid #A63A2C', borderRadius: '0px', color: '#A63A2C', fontSize: '0.88rem', marginBottom: '1.5rem', fontWeight: '500' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9rem',
              backgroundColor: '#191510',
              color: '#F7F3EA',
              border: 'none',
              borderRadius: '0px',
              fontWeight: '500',
              fontSize: '0.95rem',
              fontFamily: "'IBM Plex Sans', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
