'use client';

import React, { useState } from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { Mail, MapPin, Send, CheckCircle2, Phone } from 'lucide-react';
import { SOCIAL_LINKS } from '@/lib/social-links';

export default function ContactPage() {
  const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'AI Simplified Academy';

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div style={{ backgroundColor: '#F7F3EA', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <PublicNavbar />

      <main style={{ flex: 1, maxWidth: '1140px', width: '100%', margin: '0 auto', padding: '4rem 1.5rem 6rem', boxSizing: 'border-box' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 4rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#A63A2C', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            SUPPORT & INQUIRIES
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510', margin: '0.5rem 0 1rem', letterSpacing: '-0.02em' }}>
            Get in Touch
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#55503F', lineHeight: '1.65', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Have questions about a course, CBE payment verification, or account access? We're here to help you every step of the way.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
          
          {/* Left Column: Contact Details Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Email Support Card */}
            <div style={{ padding: '1.75rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', boxShadow: '0 6px 20px rgba(25, 21, 16, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#F7F3EA', border: '1px solid #191510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail width={20} height={20} color="#A63A2C" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510' }}>
                  Email Support
                </h3>
              </div>
              <p style={{ color: '#55503F', fontSize: '0.92rem', margin: '0 0 0.5rem', lineHeight: '1.5' }}>
                For general inquiries, account assistance, or CBE verification support:
              </p>
              <a href="mailto:support@aisimplified.com" style={{ color: '#A63A2C', fontWeight: '600', textDecoration: 'underline', fontSize: '0.95rem' }}>
                support@aisimplified.com
              </a>
            </div>

            {/* Telegram / Phone Card */}
            <div style={{ padding: '1.75rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', boxShadow: '0 6px 20px rgba(25, 21, 16, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#F7F3EA', border: '1px solid #191510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone width={20} height={20} color="#A63A2C" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510' }}>
                  Telegram & Direct Line
                </h3>
              </div>
              <p style={{ color: '#55503F', fontSize: '0.92rem', margin: '0 0 0.5rem', lineHeight: '1.5' }}>
                Connect directly with our support team on Telegram for rapid assistance:
              </p>
              <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer" style={{ color: '#A63A2C', fontWeight: '600', textDecoration: 'underline', fontSize: '0.95rem' }}>
                @AISimplifiedSupport ↗
              </a>
            </div>

            {/* Location Card */}
            <div style={{ padding: '1.75rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', boxShadow: '0 6px 20px rgba(25, 21, 16, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#F7F3EA', border: '1px solid #191510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin width={20} height={20} color="#A63A2C" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510' }}>
                  Location
                </h3>
              </div>
              <p style={{ color: '#55503F', fontSize: '0.92rem', margin: 0, lineHeight: '1.5' }}>
                Addis Ababa, Ethiopia
              </p>
            </div>
          </div>

          {/* Right Column: Contact Message Form */}
          <div style={{ padding: '2.25rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', boxShadow: '0 8px 24px rgba(25, 21, 16, 0.08)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510' }}>
              Send Us a Message
            </h3>
            <p style={{ color: '#55503F', fontSize: '0.92rem', margin: '0 0 1.75rem 0', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Fill out the form below and our team will get back to you within 24 hours.
            </p>

            {submitted ? (
              <div style={{ padding: '2rem', backgroundColor: '#F7F3EA', border: '1.5px solid #3F6B4A', textAlign: 'center' }}>
                <CheckCircle2 width={48} height={48} color="#3F6B4A" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510' }}>
                  Message Received!
                </h4>
                <p style={{ color: '#55503F', fontSize: '0.92rem', margin: 0 }}>
                  Thank you for reaching out. We have received your message and will reply to <strong>{form.email}</strong> shortly.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  style={{ marginTop: '1.5rem', padding: '0.65rem 1.25rem', backgroundColor: '#191510', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abebe Bikila"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', color: '#191510', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. abebe@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', color: '#191510', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Question about AI Fundamentals Course"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', color: '#191510', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we help you?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '1.5px solid #191510', backgroundColor: '#FFFFFF', color: '#191510', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.9rem 1.5rem',
                    backgroundColor: '#A63A2C',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <Send width={18} height={18} />
                  <span>{loading ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
