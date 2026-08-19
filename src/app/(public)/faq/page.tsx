import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { HelpCircle, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function FAQPage() {
  const faqs = [
    {
      q: 'How do I purchase a course category using CBE?',
      a: 'Select any course category on the platform, click "Enroll" or "Purchase", and you will receive our official Commercial Bank of Ethiopia (CBE) account name and account number. Transfer the required amount via CBE Birr or Mobile Banking, upload your payment receipt or reference number, and submit. Our admin team will verify and grant instant lifetime access.',
    },
    {
      q: 'Is course access permanent?',
      a: 'Yes! Every course purchase grants 100% full lifetime access. There are no recurring monthly subscriptions, hidden fees, or expiration dates.',
    },
    {
      q: 'Can I preview course lessons before purchasing?',
      a: 'Absolutely! Each course category features designated free sample video lessons so you can inspect lesson structure and video quality before enrolling.',
    },
    {
      q: 'What happens if my payment submission is rejected?',
      a: 'If a payment reference or receipt cannot be verified (e.g. incorrect reference number or wrong amount), the admin will reject the request with an explicit reason. You will receive an email notification detailing the reason and can easily resubmit with corrected information.',
    },
    {
      q: 'How long does payment verification take?',
      a: 'Payment verifications are processed promptly by our administration team — usually within 15 to 60 minutes during standard operating hours.',
    },
    {
      q: 'Can I watch courses on my mobile device or phone?',
      a: 'Yes! The entire platform is 100% responsive and optimized for seamless video playback across mobile phones, tablets, laptops, and desktop computers.',
    },
  ];

  return (
    <div style={{ backgroundColor: '#F7F3EA', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <PublicNavbar />

      <main style={{ flex: 1, maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '4rem 1.5rem 6rem', boxSizing: 'border-box' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#A63A2C', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510', margin: '0.5rem 0 1rem', letterSpacing: '-0.02em' }}>
            Got Questions? We Have Answers.
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#55503F', lineHeight: '1.65', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Everything you need to know about course categories, CBE payment verification, lifetime access, and video playback.
          </p>
        </div>

        {/* FAQ Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '4rem' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                padding: '2rem',
                border: '1.5px solid #191510',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 6px 20px rgba(25, 21, 16, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.4rem', backgroundColor: '#F7F3EA', border: '1px solid #191510', flexShrink: 0, marginTop: '2px' }}>
                  <HelpCircle width={18} height={18} color="#A63A2C" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510', lineHeight: '1.3' }}>
                  {faq.q}
                </h3>
              </div>
              <p style={{ color: '#55503F', fontSize: '0.96rem', lineHeight: '1.65', margin: 0, paddingLeft: '2.5rem' }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        {/* Still Have Questions Box */}
        <div style={{ padding: '2.5rem 2rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', textAlign: 'center', boxShadow: '0 8px 24px rgba(25, 21, 16, 0.08)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510', margin: '0 0 0.5rem 0' }}>
            Still Have Questions?
          </h3>
          <p style={{ color: '#55503F', fontSize: '0.95rem', margin: '0 0 1.5rem 0' }}>
            Can't find the answer you're looking for? Reach out to our support team directly.
          </p>
          <Link
            href="/contact"
            style={{
              padding: '0.85rem 1.5rem',
              backgroundColor: '#191510',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.92rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <span>Contact Support</span>
            <ArrowRight width={16} height={16} />
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
