'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PublicNavbar() {
  const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'AI SIMPLIFIED ACADEMY';
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2.5rem',
        backgroundColor: 'rgba(253, 249, 242, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #ecdfc4',
      }}
    >
      {/* Left: Brand Logo & Wordmark */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            backgroundColor: '#e94f6b',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '1.25rem',
          }}
        >
          🎓
        </div>
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#24201a',
            letterSpacing: '-0.3px',
            fontFamily: "'Space Grotesk', sans-serif",
            textTransform: 'uppercase',
          }}
        >
          {platformName}
        </span>
      </Link>

      {/* Center: Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontFamily: "'Space Grotesk', sans-serif" }}>
        <Link
          href="/"
          style={{
            color: '#6b6151',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'color 0.2s ease',
          }}
        >
          Home
        </Link>
        <Link
          href="/preview"
          style={{
            color: '#6b6151',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'color 0.2s ease',
          }}
        >
          Courses
        </Link>
        <Link
          href="/about"
          style={{
            color: '#6b6151',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'color 0.2s ease',
          }}
        >
          About
        </Link>
        <a
          href="#contact"
          style={{
            color: '#6b6151',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'color 0.2s ease',
          }}
        >
          Contact
        </a>
      </nav>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: "'Space Grotesk', sans-serif" }}>
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          style={{
            background: '#ffffff',
            border: '1px solid #ecdfc4',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease',
          }}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? '🌙' : '☀️'}
        </button>

        <Link
          href="/login"
          style={{
            color: '#6b6151',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.95rem',
          }}
        >
          Log In
        </Link>
        <Link
          href="/signup"
          style={{
            padding: '0.6rem 1.4rem',
            backgroundColor: '#e94f6b',
            color: '#ffffff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(36,32,26,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          Sign Up
        </Link>
      </div>
    </header>
  );
}
