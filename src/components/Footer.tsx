'use client';

import React from 'react';
import Link from 'next/link';
import { SOCIAL_LINKS } from '@/lib/social-links';

export default function Footer() {
  const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'AI SIMPLIFIED ACADEMY';
  const tagline = process.env.NEXT_PUBLIC_PLATFORM_TAGLINE || 'Empowering Students with World-Class E-Learning';

  return (
    <footer style={{ backgroundColor: '#24201a', color: '#9a8e73', borderTop: '1px solid #332d25', paddingTop: '4rem', paddingBottom: '2.5rem', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: '3.5rem' }}>
          
          {/* Column 1: Branding & Social */}
          <div>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e94f6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '700', fontSize: '1.1rem' }}>
                  🎓
                </div>
                <span style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                  {platformName}
                </span>
              </div>
            </Link>
            <p style={{ color: '#9a8e73', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem', maxWidth: '280px' }}>
              {tagline}
            </p>
            {/* Social Media Links */}
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #332d25', backgroundColor: '#1c1914', color: '#ecdfc4', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s ease' }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #332d25', backgroundColor: '#1c1914', color: '#ecdfc4', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s ease' }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                </svg>
              </a>
              <a
                href={SOCIAL_LINKS.telegram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #332d25', backgroundColor: '#1c1914', color: '#ecdfc4', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s ease' }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </a>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #332d25', backgroundColor: '#1c1914', color: '#ecdfc4', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.2s ease' }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', margin: '0 0 1.25rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li>
                <Link href="/" style={{ color: '#9a8e73', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#e94f6b'} onMouseLeave={(e) => e.currentTarget.style.color = '#9a8e73'}>Home</Link>
              </li>
              <li>
                <Link href="/preview" style={{ color: '#9a8e73', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#e94f6b'} onMouseLeave={(e) => e.currentTarget.style.color = '#9a8e73'}>Courses</Link>
              </li>
              <li>
                <Link href="/signup" style={{ color: '#9a8e73', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#e94f6b'} onMouseLeave={(e) => e.currentTarget.style.color = '#9a8e73'}>Sign Up</Link>
              </li>
              <li>
                <Link href="/login" style={{ color: '#9a8e73', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#e94f6b'} onMouseLeave={(e) => e.currentTarget.style.color = '#9a8e73'}>Log In</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', margin: '0 0 1.25rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              Support
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li>
                <a href="#contact" style={{ color: '#9a8e73', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#e94f6b'} onMouseLeave={(e) => e.currentTarget.style.color = '#9a8e73'}>Contact Us</a>
              </li>
              <li>
                <Link href="/faq" style={{ color: '#9a8e73', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#e94f6b'} onMouseLeave={(e) => e.currentTarget.style.color = '#9a8e73'}>FAQ</Link>
              </li>
              <li>
                <Link href="/about" style={{ color: '#9a8e73', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#e94f6b'} onMouseLeave={(e) => e.currentTarget.style.color = '#9a8e73'}>About Us</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', margin: '0 0 1.25rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li>
                <Link href="/privacy" style={{ color: '#9a8e73', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#e94f6b'} onMouseLeave={(e) => e.currentTarget.style.color = '#9a8e73'}>Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" style={{ color: '#9a8e73', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#e94f6b'} onMouseLeave={(e) => e.currentTarget.style.color = '#9a8e73'}>Terms of Service</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid #332d25', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: '#7a705b' }}>
          <div>
            © 2026 {platformName}. All rights reserved.
          </div>
          <div>
            Empowering students with interactive e-learning.
          </div>
        </div>
      </div>
    </footer>
  );
}
