import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'AI Simplified Academy';

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>
          About {platformName}
        </h1>
        <p style={{ color: '#475569', fontSize: '1.15rem', lineHeight: '1.7', marginBottom: '2rem' }}>
          {platformName} is a premiere online learning platform dedicated to providing high-quality, expert-led video courses tailored for students.
        </p>
        <div style={{ padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Our Mission</h2>
          <p style={{ color: '#475569', lineHeight: '1.7' }}>
            We empower students to learn at their own pace with structured video modules, clear step-by-step guidance, and straightforward local payment methods.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
