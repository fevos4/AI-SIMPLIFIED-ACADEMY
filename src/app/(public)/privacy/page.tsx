import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'AI Simplified Academy';

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.7' }}>
          At {platformName}, we take your privacy seriously. We collect essential information such as email address and payment proof only to manage your account and course enrollments. Your personal data is stored securely and never shared with third parties.
        </p>
      </div>
      <Footer />
    </div>
  );
}
