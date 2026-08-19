import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'AI Simplified Academy';

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>
          Terms of Service
        </h1>
        <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.7' }}>
          By accessing {platformName}, you agree to abide by our terms. Course content is provided for personal educational use only. Unauthorized distribution or copying of course videos is strictly prohibited.
        </p>
      </div>
      <Footer />
    </div>
  );
}
