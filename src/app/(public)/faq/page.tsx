import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export default function FAQPage() {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>
          Frequently Asked Questions (FAQ)
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '3rem' }}>
          Find answers to common questions about courses, access, and payments.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>How do I purchase a course?</h3>
            <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>
              Select any course category, click Enroll / Purchase, and follow the instructions to transfer funds via Commercial Bank of Ethiopia (CBE). Once you submit your transaction reference number and receipt, our admin team will verify and grant instant access.
            </p>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>Is access permanent?</h3>
            <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>
              Yes! All course purchases grant 100% lifetime access with no monthly subscription or recurring fees.
            </p>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>Can I preview courses before purchasing?</h3>
            <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>
              Yes, all course categories have designated free sample video lessons so you can inspect lesson quality before enrolling.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
