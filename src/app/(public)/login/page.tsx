'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
export const dynamic = 'force-dynamic';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push(callbackUrl);
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
    <div style={{ backgroundColor: '#fdf9f2', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", color: '#24201a' }}>
      <PublicNavbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1.5rem' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #ecdfc4',
            boxShadow: '0 8px 24px rgba(36, 32, 26, 0.06)',
            padding: '2.5rem 2rem',
          }}
        >
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: '700', color: '#24201a', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
            Welcome Back
          </h2>
          <p style={{ color: '#6b6151', fontSize: '0.92rem', margin: '0 0 1.75rem 0' }}>
            Log in to access your purchased courses and learning dashboard.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #ecdfc4',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#24201a', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                  Password *
                </label>
                <span style={{ fontSize: '0.78rem', color: '#6b6151' }}>
                  Forgot? <span style={{ color: '#9a8e73', fontStyle: 'italic' }}>Contact support</span>
                </span>
              </div>
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #ecdfc4',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{ padding: '0.85rem', backgroundColor: '#fde8eb', border: '1px solid #e94f6b', borderRadius: '8px', color: '#e94f6b', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '600' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.9rem',
                backgroundColor: '#e94f6b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.95rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                marginBottom: '1.5rem',
              }}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#6b6151' }}>
              Don't have an account?{' '}
              <Link href={`/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} style={{ color: '#e94f6b', fontWeight: '700', textDecoration: 'none' }}>
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading login form...</div>}>
      <LoginForm />
    </Suspense>
  );
}
