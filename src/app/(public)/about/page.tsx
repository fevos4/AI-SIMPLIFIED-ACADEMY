import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Target, ShieldCheck, Zap, BookOpen, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AboutPage() {
  const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'AI Simplified Academy';

  return (
    <div style={{ backgroundColor: '#F7F3EA', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <PublicNavbar />

      <main style={{ flex: 1, maxWidth: '1140px', width: '100%', margin: '0 auto', padding: '4rem 1.5rem 6rem', boxSizing: 'border-box' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '740px', margin: '0 auto 4rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#A63A2C', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            OUR MISSION & VISION
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510', margin: '0.5rem 0 1rem', letterSpacing: '-0.02em' }}>
            About {platformName}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#55503F', lineHeight: '1.7', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Demystifying Artificial Intelligence concept by concept. We build practical, clear, step-by-step video courses designed for students and professionals.
          </p>
        </div>

        {/* 3 Pillar Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          
          <div style={{ padding: '2rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', boxShadow: '0 6px 20px rgba(25, 21, 16, 0.06)' }}>
            <div style={{ width: '44px', height: '44px', backgroundColor: '#F7F3EA', border: '1px solid #191510', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <BookOpen width={22} height={22} color="#A63A2C" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510', margin: '0 0 0.75rem 0' }}>
              Closed Systems
            </h3>
            <p style={{ color: '#55503F', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              Each course is a clear, closed system — one concept fully built before the next begins. No filler content, no unnecessary jargon, and no jumping ahead.
            </p>
          </div>

          <div style={{ padding: '2rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', boxShadow: '0 6px 20px rgba(25, 21, 16, 0.06)' }}>
            <div style={{ width: '44px', height: '44px', backgroundColor: '#F7F3EA', border: '1px solid #191510', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Zap width={22} height={22} color="#A63A2C" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510', margin: '0 0 0.75rem 0' }}>
              Hands-On Learning
            </h3>
            <p style={{ color: '#55503F', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              Learn by observing practical demonstrations. Our video modules range from AI fundamentals to advanced prompt engineering and workplace automation.
            </p>
          </div>

          <div style={{ padding: '2rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', boxShadow: '0 6px 20px rgba(25, 21, 16, 0.06)' }}>
            <div style={{ width: '44px', height: '44px', backgroundColor: '#F7F3EA', border: '1px solid #191510', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <ShieldCheck width={22} height={22} color="#A63A2C" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510', margin: '0 0 0.75rem 0' }}>
              Local CBE Payments
            </h3>
            <p style={{ color: '#55503F', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              We eliminate international payment barriers by integrating Commercial Bank of Ethiopia (CBE) transfer verification for instant, seamless course access.
            </p>
          </div>

        </div>

        {/* Story Section Card */}
        <div style={{ padding: '3rem 2.5rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', boxShadow: '0 8px 24px rgba(25, 21, 16, 0.08)', marginBottom: '4rem' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
              Why We Started
            </h2>
            <p style={{ color: '#55503F', fontSize: '1.02rem', lineHeight: '1.75', marginBottom: '1.5rem' }}>
              Artificial Intelligence is reshaping every industry, but traditional educational content is often bloated, overly theoretical, or locked behind international credit card paywalls.
            </p>
            <p style={{ color: '#55503F', fontSize: '1.02rem', lineHeight: '1.75', margin: 0 }}>
              At <strong>{platformName}</strong>, we solved this by producing tight, modular video lessons paired with straightforward local payment options. Every student gets lifetime access to high-impact skills they can apply immediately.
            </p>
          </div>
        </div>

        {/* CTA Box */}
        <div style={{ padding: '3rem 2rem', backgroundColor: '#191510', color: '#F7F3EA', textAlign: 'center', border: '1.5px solid #191510' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", margin: '0 0 0.75rem 0', color: '#F7F3EA' }}>
            Ready to Master AI?
          </h3>
          <p style={{ fontSize: '1rem', color: '#9A9284', margin: '0 0 2rem 0', maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto' }}>
            Explore our course categories and start learning today with free video lesson previews.
          </p>
          <Link
            href="/preview"
            style={{
              padding: '0.85rem 1.75rem',
              backgroundColor: '#A63A2C',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <span>Browse Courses</span>
            <ArrowRight width={18} height={18} />
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
