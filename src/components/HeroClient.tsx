'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import CourseCard from '@/components/CourseCard';
import Footer from '@/components/Footer';
import {
  Play,
  GraduationCap,
  Download,
  ChevronDown,
  ChevronUp,
  Star,
  Mail,
  User,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Send
} from 'lucide-react';

interface HeroClientProps {
  categories: any[];
}

export default function HeroClient({ categories }: HeroClientProps) {
  const router = useRouter();
  
  // Hero Signup Form State
  const [heroEmail, setHeroEmail] = useState('');
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroError, setHeroError] = useState('');

  // CTA Banner Signup Form State
  const [ctaEmail, setCtaEmail] = useState('');
  const [ctaLoading, setCtaLoading] = useState(false);
  const [ctaError, setCtaError] = useState('');

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Accordion state for Section 3
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  // Testimonials Carousel State for Section 4
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Course Cards Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);

  const contactEmailDisplay =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@aisimplifiedacademy.com';

  // Handler for Hero Signup
  const handleHeroGetStarted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroEmail.trim()) return;

    setHeroLoading(true);
    setHeroError('');

    try {
      const res = await fetch('/api/auth/signup/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: heroEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.toLowerCase().includes('already exists')) {
          setHeroError('Account exists. Log in instead?');
        } else {
          setHeroError(data.error || 'Failed to initiate signup. Please try again.');
        }
        setHeroLoading(false);
        return;
      }

      router.push(`/signup?email=${encodeURIComponent(heroEmail.trim())}`);
    } catch (err) {
      console.error('Error initiating signup:', err);
      setHeroError('Network error. Please try again.');
      setHeroLoading(false);
    }
  };

  // Handler for CTA Banner Signup
  const handleCtaGetStarted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctaEmail.trim()) return;

    setCtaLoading(true);
    setCtaError('');

    try {
      const res = await fetch('/api/auth/signup/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ctaEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.toLowerCase().includes('already exists')) {
          setCtaError('Account exists. Log in instead?');
        } else {
          setCtaError(data.error || 'Failed to initiate signup. Please try again.');
        }
        setCtaLoading(false);
        return;
      }

      router.push(`/signup?email=${encodeURIComponent(ctaEmail.trim())}`);
    } catch (err) {
      console.error('Error initiating signup:', err);
      setCtaError('Network error. Please try again.');
      setCtaLoading(false);
    }
  };

  // Handler for Contact Form
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSubmitted(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 600);
  };

  const previewCategories = categories.slice(0, 6);

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev + 3 >= previewCategories.length ? 0 : prev + 3));
  };

  const prevSlide = () => {
    setCarouselIndex((prev) => (prev - 3 < 0 ? Math.max(0, previewCategories.length - 3) : prev - 3));
  };

  // Section 3 Accordion Data
  const accordionData = [
    {
      title: 'Expert-Created Content',
      content: 'All courses are designed and recorded by qualified subject matter experts.',
    },
    {
      title: 'Structured Learning Path',
      content: 'Each category is broken into lessons and videos, giving you a clear progression from start to finish.',
    },
    {
      title: 'Free Previews Before You Buy',
      content: 'Watch free sample videos in any course before deciding to purchase.',
    },
    {
      title: 'CBE Bank Payment',
      content: 'Pay easily and securely via Commercial Bank of Ethiopia transfer.',
    },
  ];

  // Section 4 Testimonials Data
  const testimonials = [
    {
      quote:
        'The videos made Chemistry so much easier to understand. I went from failing to passing my exams in just one month.',
      name: 'Kalkidan T.',
      role: 'Grade 11 Student',
      rating: 5,
    },
    {
      quote:
        'I loved being able to watch lessons at my own pace. The Biology course helped me prepare for my university entrance exam.',
      name: 'Biruk M.',
      role: 'Grade 12 Student',
      rating: 5,
    },
    {
      quote:
        'Finally a platform that teaches in a way that makes sense. The Physics lessons are the best I have ever seen.',
      name: 'Hana A.',
      role: 'Grade 10 Student',
      rating: 5,
    },
  ];

  return (
    <div style={{ backgroundColor: '#fdf9f2', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#24201a' }}>
      <PublicNavbar />

      {/* HERO SECTION */}
      <section
        style={{
          position: 'relative',
          paddingTop: '3rem',
          paddingBottom: '4rem',
          paddingLeft: '2.5rem',
          paddingRight: '2.5rem',
          backgroundColor: '#fdf9f2',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(255, 209, 102, 0.28) 0%, rgba(5, 185, 138, 0.06) 45%, transparent 70%)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          minHeight: '560px',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '3.5rem',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Left Column (Hero Content) */}
          <div style={{ flex: '1 1 500px', maxWidth: '620px', padding: '1rem 0' }}>
            {/* Eyebrow Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                border: '1px solid #ecdfc4',
                borderRadius: '8px',
                padding: '0.35rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#24201a',
                fontFamily: "'Space Grotesk', sans-serif",
                marginBottom: '1.25rem',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
              }}
            >
              <span>👋</span>
              <span>Start learning today</span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.8rem, 5vw, 4.2rem)',
                fontWeight: '700',
                lineHeight: '1.1',
                letterSpacing: '-0.5px',
                margin: '0 0 1.25rem 0',
                fontFamily: "'Space Grotesk', sans-serif",
                color: '#24201a',
              }}
            >
              Learn AI, one fun step at a <span style={{ color: '#e94f6b' }}>time</span>
            </h1>

            {/* Subheading */}
            <p
              style={{
                fontSize: '1.1rem',
                color: '#6b6151',
                margin: '0 0 2rem 0',
                fontWeight: '500',
                lineHeight: '1.6',
                maxWidth: '420px',
              }}
            >
              Bite-sized expert-led courses, lifetime access, pay once — no overwhelm, just progress.
            </p>

            {/* Email Input + CTA Button Row */}
            <form onSubmit={handleHeroGetStarted} style={{ display: 'flex', gap: '0.75rem', maxWidth: '480px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={heroEmail}
                onChange={(e) => setHeroEmail(e.target.value)}
                style={{
                  flex: '1 1 220px',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #ecdfc4',
                  backgroundColor: '#ffffff',
                  color: '#24201a',
                  fontSize: '0.95rem',
                  outline: 'none',
                  fontWeight: '500',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                }}
              />
              <button
                type="submit"
                disabled={heroLoading}
                style={{
                  padding: '0.85rem 1.75rem',
                  backgroundColor: '#05b98a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: heroLoading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                {heroLoading ? 'Initiating...' : 'Get started'}
              </button>
            </form>

            {heroError && (
              <div style={{ marginBottom: '0.75rem', color: '#dc2626', fontSize: '0.9rem', fontWeight: '700' }}>
                {heroError}{' '}
                {heroError.includes('Account exists') && (
                  <Link href="/login" style={{ color: '#e94f6b', textDecoration: 'underline', fontWeight: '700' }}>
                    Log in
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right Column (Hero Visual with De-Rotated Proof Card) */}
          <div
            style={{
              flex: '1 1 480px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              maxWidth: '580px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '460px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                src="/imgs/Hero.png"
                alt="AI Learning Platform"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'contain', objectPosition: 'center' }}
                priority
              />

              {/* Anchored Proof Card (De-rotated, soft shadow) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '0px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #ecdfc4',
                  borderRadius: '14px',
                  boxShadow: '0 8px 24px rgba(36, 32, 26, 0.08)',
                  padding: '1.1rem 1.4rem',
                  maxWidth: '230px',
                  zIndex: 3,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#e94f6b',
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#24201a', fontFamily: "'Space Grotesk', sans-serif" }}>
                    Verified Review
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#24201a', lineHeight: '1.35' }}>
                  "Finally clicked for me"
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9a8e73', marginTop: '0.3rem', fontWeight: '500' }}>
                  — Sara, Product Designer
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COURSE CARDS SECTION ("Explore Our Courses") */}
      <section style={{ padding: '5rem 2.5rem 3rem 2.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#24201a',
                margin: '0 0 0.4rem 0',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.3px',
              }}
            >
              Explore Our Courses
            </h2>
            <p style={{ color: '#6b6151', fontSize: '1rem', margin: 0, fontWeight: '500' }}>
              Select a category to view full curriculum details & free lesson previews.
            </p>
          </div>

          {previewCategories.length > 3 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={prevSlide}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #ecdfc4',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                }}
              >
                ←
              </button>
              <button
                onClick={nextSlide}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #ecdfc4',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                }}
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* Category Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem',
          }}
        >
          {previewCategories.slice(carouselIndex, carouselIndex + 3).map((cat, index) => (
            <CourseCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              description={cat.description}
              coverImagePath={cat.cover_image_path}
              price={Number(cat.price)}
              lessonCount={cat._count?.lessons || 0}
              position={carouselIndex + index + 1}
              comingSoon={cat.coming_soon}
              targetUrl={`/preview/${cat.id}`}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Link
            href="/preview"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 2rem',
              backgroundColor: '#e94f6b',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.95rem',
              textDecoration: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>See All Courses</span>
            <span>➔</span>
          </Link>
        </div>
      </section>

      {/* SECTION 1: "Why It Works" (Feature Highlights) */}
      <section style={{ backgroundColor: '#fdf9f2', padding: '5rem 2.5rem', borderTop: '1px solid #ecdfc4', borderBottom: '1px solid #ecdfc4' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ color: '#e94f6b', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
              PROVEN METHODOLOGY
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#24201a', margin: '0.5rem 0 0 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              Why It Works
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '2.25rem 2rem',
                borderRadius: '14px',
                border: '1px solid #ecdfc4',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '10px',
                  backgroundColor: '#fde8eb',
                  color: '#e94f6b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Play width={24} height={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#24201a', margin: '0 0 0.75rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
                Expert Video Lessons
              </h3>
              <p style={{ color: '#6b6151', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                High-quality video content taught by subject experts, making complex topics simple and engaging.
              </p>
            </div>

            {/* Card 2 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '2.25rem 2rem',
                borderRadius: '14px',
                border: '1px solid #ecdfc4',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '10px',
                  backgroundColor: '#e6f8f3',
                  color: '#05b98a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <GraduationCap width={24} height={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#24201a', margin: '0 0 0.75rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
                Learn at Your Own Pace
              </h3>
              <p style={{ color: '#6b6151', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                Access your courses anytime, anywhere. Pause, rewind, and rewatch as many times as you need.
              </p>
            </div>

            {/* Card 3 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '2.25rem 2rem',
                borderRadius: '14px',
                border: '1px solid #ecdfc4',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '10px',
                  backgroundColor: '#fff7e6',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Download width={24} height={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#24201a', margin: '0 0 0.75rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
                Lifetime Access, Pay Once
              </h3>
              <p style={{ color: '#6b6151', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                Purchase a course once and own it forever. No subscriptions, no recurring fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: STATS BAND (Solid Ink Background) */}
      <section style={{ backgroundColor: '#24201a', color: '#ffffff', padding: '3.5rem 2.5rem' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '3rem', fontWeight: '700', color: '#ffd166', fontFamily: "'Space Grotesk', sans-serif" }}>
              500+
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#9a8e73', marginTop: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>
              Students Enrolled
            </div>
          </div>

          <div>
            <div style={{ fontSize: '3rem', fontWeight: '700', color: '#ffd166', fontFamily: "'Space Grotesk', sans-serif" }}>
              50+
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#9a8e73', marginTop: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>
              Video Lessons
            </div>
          </div>

          <div>
            <div style={{ fontSize: '3rem', fontWeight: '700', color: '#ffd166', fontFamily: "'Space Grotesk', sans-serif" }}>
              10+
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#9a8e73', marginTop: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>
              Course Categories
            </div>
          </div>

          <div>
            <div style={{ fontSize: '3rem', fontWeight: '700', color: '#ffd166', fontFamily: "'Space Grotesk', sans-serif" }}>
              100%
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#9a8e73', marginTop: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>
              Lifetime Access
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS (White Background) */}
      <section style={{ backgroundColor: '#ffffff', color: '#24201a', padding: '5.5rem 2.5rem' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Left Column */}
          <div style={{ flex: '1 1 500px', maxWidth: '620px' }}>
            <span style={{ color: '#e94f6b', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
              HOW IT WORKS
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#24201a', margin: '0.5rem 0 1rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              The Smarter Way to Learn
            </h2>
            <p style={{ color: '#6b6151', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Our structured e-learning platform combines step-by-step video tutorials with flexible self-paced studying and effortless local payment options.
            </p>

            {/* Accordion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {accordionData.map((item, idx) => {
                const isOpen = openAccordion === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: isOpen ? '#ffffff' : '#fdf9f2',
                      border: `1px solid ${isOpen ? '#e94f6b' : '#ecdfc4'}`,
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: isOpen ? '0 8px 24px rgba(36, 32, 26, 0.06)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <button
                      onClick={() => setOpenAccordion(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '1.1rem 1.4rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#24201a',
                        fontSize: '1rem',
                        fontWeight: '700',
                        fontFamily: "'Space Grotesk', sans-serif",
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{item.title}</span>
                      {isOpen ? <ChevronUp width={18} height={18} color="#e94f6b" /> : <ChevronDown width={18} height={18} color="#6b6151" />}
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 1.4rem 1.1rem 1.4rem', color: '#6b6151', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {item.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Clean Dark Video Preview Panel */}
          <div style={{ flex: '1 1 480px', maxWidth: '540px', width: '100%' }}>
            <div
              style={{
                position: 'relative',
                backgroundColor: '#24201a',
                borderRadius: '14px',
                border: '1px solid #332d25',
                padding: '2rem',
                boxShadow: '0 8px 24px rgba(36, 32, 26, 0.08)',
              }}
            >
              {/* Window Controls */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#e94f6b' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffd166' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#05b98a' }}></div>
              </div>

              {/* Video Frame */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '220px',
                  backgroundColor: '#1c1914',
                  borderRadius: '10px',
                  border: '1px solid #332d25',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#e94f6b',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(233, 79, 107, 0.4)',
                  }}
                >
                  <Play width={24} height={24} fill="#ffffff" style={{ marginLeft: '3px' }} />
                </div>
                <div style={{ position: 'absolute', bottom: '12px', left: '14px', backgroundColor: 'rgba(36, 32, 26, 0.85)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#ecdfc4' }}>
                  Lesson 01: Core Concepts
                </div>
              </div>

              {/* Modules List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', backgroundColor: '#1c1914', borderRadius: '8px', border: '1px solid #332d25' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 width={16} height={16} color="#05b98a" />
                    <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif" }}>Module 1: Introduction</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#05b98a', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>Completed</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', backgroundColor: '#1c1914', borderRadius: '8px', border: '1px solid #e94f6b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Play width={16} height={16} color="#e94f6b" />
                    <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif" }}>Module 2: Practical Exercises</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#e94f6b', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>In Progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: TESTIMONIALS (Single Centered Card) */}
      <section style={{ backgroundColor: '#fdf9f2', padding: '5.5rem 2.5rem', borderBottom: '1px solid #ecdfc4' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ color: '#e94f6b', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
            STUDENT SUCCESS
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#24201a', margin: '0.5rem 0 3rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
            What Our Students Say
          </h2>

          {/* Testimonial Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '3rem 2.5rem',
                borderRadius: '14px',
                border: '1px solid #ecdfc4',
                width: '100%',
                maxWidth: '760px',
                boxShadow: '0 8px 24px rgba(36, 32, 26, 0.06)',
              }}
            >
              {/* Star Rating */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '1.25rem' }}>
                {[...Array(testimonials[testimonialIndex].rating)].map((_, i) => (
                  <Star key={i} width={18} height={18} fill="#ffd166" color="#ffd166" />
                ))}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontSize: '1.15rem',
                  color: '#24201a',
                  lineHeight: '1.65',
                  fontStyle: 'italic',
                  marginBottom: '1.75rem',
                  fontWeight: '500',
                }}
              >
                "{testimonials[testimonialIndex].quote}"
              </p>

              {/* Author */}
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#24201a', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {testimonials[testimonialIndex].name}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#6b6151', fontWeight: '500', marginTop: '0.2rem' }}>
                  {testimonials[testimonialIndex].role}
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', marginTop: '2rem' }}>
            <button
              onClick={() => setTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #ecdfc4',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
              }}
              aria-label="Previous Testimonial"
            >
              <ChevronLeft width={18} height={18} color="#24201a" />
            </button>

            {/* Dots */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  style={{
                    width: i === testimonialIndex ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: i === testimonialIndex ? '#e94f6b' : '#ecdfc4',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #ecdfc4',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
              }}
              aria-label="Next Testimonial"
            >
              <ChevronRight width={18} height={18} color="#24201a" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 5: CTA BAND (Solid Pink Background) */}
      <section
        style={{
          backgroundColor: '#e94f6b',
          color: '#ffffff',
          padding: '5rem 2.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0 0 1rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to Start Learning?
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#fce8ec', margin: '0 0 2.5rem 0', fontWeight: '500' }}>
            Join hundreds of students already improving their grades.
          </p>

          <form
            onSubmit={handleCtaGetStarted}
            style={{
              display: 'flex',
              gap: '0.75rem',
              maxWidth: '480px',
              margin: '0 auto',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              style={{
                flex: '1 1 220px',
                padding: '0.85rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.95rem',
                outline: 'none',
                color: '#24201a',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
              }}
            />
            <button
              type="submit"
              disabled={ctaLoading}
              style={{
                padding: '0.85rem 1.75rem',
                backgroundColor: '#24201a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.95rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: ctaLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                opacity: ctaLoading ? 0.8 : 1,
              }}
            >
              {ctaLoading ? 'Initiating...' : 'Get Started'}
            </button>
          </form>

          {ctaError && (
            <div style={{ marginTop: '1rem', color: '#ffffff', fontSize: '0.95rem', fontWeight: '600' }}>
              {ctaError}{' '}
              {ctaError.includes('Account exists') && (
                <Link href="/login" style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: '700' }}>
                  Log in
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 6: CONTACT SECTION */}
      <section id="contact" style={{ backgroundColor: '#fdf9f2', padding: '5.5rem 2.5rem' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '4rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Left Column */}
          <div style={{ flex: '1 1 400px', maxWidth: '500px' }}>
            <span style={{ color: '#e94f6b', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
              NEED HELP?
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#24201a', margin: '0.5rem 0 1rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              Get in Touch
            </h2>
            <p style={{ color: '#6b6151', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
              Have questions? We're here to help. Reach out to our support team and we'll get back to you promptly.
            </p>

            {/* Email Card Chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: '#ffffff', padding: '1.4rem', borderRadius: '14px', border: '1px solid #ecdfc4', boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#fde8eb',
                  color: '#e94f6b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Mail width={22} height={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#9a8e73', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Email Support
                </div>
                <a href={`mailto:${contactEmailDisplay}`} style={{ fontSize: '1rem', fontWeight: '700', color: '#e94f6b', textDecoration: 'none', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {contactEmailDisplay}
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div style={{ flex: '1 1 500px', maxWidth: '620px', width: '100%' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '2.5rem',
                borderRadius: '14px',
                border: '1px solid #ecdfc4',
                boxShadow: '0 8px 24px rgba(36, 32, 26, 0.06)',
              }}
            >
              {contactSubmitted ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#e6f8f3',
                      color: '#05b98a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem auto',
                    }}
                  >
                    <CheckCircle2 width={32} height={32} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#24201a', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                    Message Sent!
                  </h3>
                  <p style={{ color: '#6b6151', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>
                    Thank you for contacting us. Our support team will get back to you shortly.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    style={{
                      marginTop: '2rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#e94f6b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontFamily: "'Space Grotesk', sans-serif",
                      cursor: 'pointer',
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#24201a', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abebe Bikila"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #ecdfc4',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#24201a', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #ecdfc4',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#24201a', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="How can we help you?"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #ecdfc4',
                        fontSize: '0.95rem',
                        outline: 'none',
                        fontFamily: "'Inter', sans-serif",
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    style={{
                      padding: '0.9rem 1.5rem',
                      backgroundColor: '#e94f6b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      fontFamily: "'Space Grotesk', sans-serif",
                      cursor: contactLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                    }}
                  >
                    {contactLoading ? (
                      'Sending...'
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send width={16} height={16} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
