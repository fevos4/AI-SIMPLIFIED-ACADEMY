'use client';

import React from 'react';
import Link from 'next/link';

export default function PublicNavbar() {
  const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'AI SIMPLIFIED ACADEMY';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 2.5rem',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid rgba(25, 21, 16, 0.1)',
      }}
    >
      {/* Left: Brand Logo & Wordmark */}
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <img
          src="/imgs/logo.png"
          alt="AI Simplified Academy"
          style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
        />
        <span
          style={{
            fontSize: '1.05rem',
            fontWeight: '700',
            color: '#191510',
            letterSpacing: '-0.01em',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {platformName}
        </span>
      </Link>

      {/* Center: Nav links (Hidden on mobile via CSS style tag) */}
      <nav className="fidel-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <Link
          href="/"
          style={{
            color: '#191510',
            textDecoration: 'none',
            fontWeight: '400',
            fontSize: '0.95rem',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#A63A2C')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#191510')}
        >
          Home
        </Link>
        <Link
          href="/preview"
          style={{
            color: '#191510',
            textDecoration: 'none',
            fontWeight: '400',
            fontSize: '0.95rem',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#A63A2C')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#191510')}
        >
          Courses
        </Link>
        <Link
          href="/about"
          style={{
            color: '#191510',
            textDecoration: 'none',
            fontWeight: '400',
            fontSize: '0.95rem',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#A63A2C')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#191510')}
        >
          About
        </Link>
        <Link
          href="/contact"
          style={{
            color: '#191510',
            textDecoration: 'none',
            fontWeight: '400',
            fontSize: '0.95rem',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#A63A2C')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#191510')}
        >
          Contact
        </Link>
      </nav>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <Link
          href="/login"
          style={{
            color: '#191510',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '0.95rem',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#A63A2C')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#191510')}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: '#191510',
            color: '#F7F3EA',
            borderRadius: '0px',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A63A2C')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#191510')}
        >
          Get started
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 768px) {
            .fidel-nav-links {
              display: none !important;
            }
          }
        `
      }} />
    </header>
  );
}
