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
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <PublicNavbar />

      {/* HERO SECTION - FIDEL RING DESIGN */}
      <section
        style={{
          position: 'relative',
          paddingTop: '6rem',
          paddingBottom: '6rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        {/* Background Concentric Circles & Fidel Tiles Ring */}
        <div
          className="fidel-ring-container"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '1200px',
            height: '1200px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {/* Inner ring 280px radius (560px diameter) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '560px',
              height: '560px',
              marginTop: '-280px',
              marginLeft: '-280px',
              borderRadius: '50%',
              border: '1px solid rgba(25, 21, 16, 0.1)',
            }}
          />
          {/* Middle ring 440px radius (880px diameter) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '880px',
              height: '880px',
              marginTop: '-440px',
              marginLeft: '-440px',
              borderRadius: '50%',
              border: '1px solid rgba(25, 21, 16, 0.1)',
            }}
          />
          {/* Outer ring 560px radius (1120px diameter) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '1120px',
              height: '1120px',
              marginTop: '-560px',
              marginLeft: '-560px',
              borderRadius: '50%',
              border: '1px solid rgba(25, 21, 16, 0.1)',
            }}
          />

          {/* 8 Fidel Tiles on the outer ring (radius 560px) */}
          {['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ'].map((char, index) => {
            const angle = index * 45; // 0, 45, 90, 135, 180, 225, 270, 315
            const rad = (angle * Math.PI) / 180;
            const radius = 560;
            const x = radius * Math.cos(rad);
            const y = radius * Math.sin(rad);

            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: `calc(50% + ${y}px)`,
                  left: `calc(50% + ${x}px)`,
                  width: '34px',
                  height: '34px',
                  marginTop: '-17px',
                  marginLeft: '-17px',
                  borderRadius: '50%',
                  border: '1px solid rgba(25, 21, 16, 0.2)',
                  backgroundColor: '#F7F3EA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#191510',
                  fontFamily: "'Space Grotesk', sans-serif",
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                {char}
              </div>
            );
          })}
        </div>

        {/* Hero Content Container - Centered Alignment */}
        <div
          style={{
            maxWidth: '820px',
            width: '100%',
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Eyebrow Label */}
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#A63A2C',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: "'IBM Plex Sans', sans-serif",
              marginBottom: '1.25rem',
            }}
          >
            Twenty-six letters. One idea each.
          </div>

          {/* Headline */}
          <h1
            className="fidel-hero-headline"
            style={{
              fontSize: '66px',
              fontWeight: '700',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              margin: '0 0 1.5rem 0',
              fontFamily: "'Space Grotesk', sans-serif",
              color: '#191510',
            }}
          >
            Learn AI, <span style={{ color: '#A63A2C' }}>character</span> by character.
          </h1>

          {/* Subheading */}
          <p
            style={{
              fontSize: '1.125rem',
              color: '#55503F',
              margin: '0 0 2.5rem 0',
              fontWeight: '400',
              lineHeight: '1.6',
              maxWidth: '640px',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            Each course is a clear, closed system — one concept fully built before the next begins. No filler, no jumping ahead.
          </p>

          {/* Email Input + CTA Button Form */}
          <form
            onSubmit={handleHeroGetStarted}
            style={{
              display: 'flex',
              maxWidth: '460px',
              width: '100%',
              marginBottom: '3.5rem',
            }}
          >
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={heroEmail}
              onChange={(e) => setHeroEmail(e.target.value)}
              style={{
                flex: '1',
                padding: '0.85rem 1.25rem',
                borderRadius: '0px',
                border: '1.5px solid #191510',
                borderRight: 'none',
                backgroundColor: '#F7F3EA',
                color: '#191510',
                fontSize: '0.95rem',
                outline: 'none',
                fontWeight: '400',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            />
            <button
              type="submit"
              disabled={heroLoading}
              style={{
                padding: '0.85rem 1.75rem',
                backgroundColor: '#A63A2C',
                color: '#F7F3EA',
                border: '1.5px solid #A63A2C',
                borderRadius: '0px',
                fontWeight: '500',
                fontSize: '0.95rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: heroLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.15s ease',
              }}
            >
              {heroLoading ? 'Initiating...' : 'Get started'}
            </button>
          </form>

          {heroError && (
            <div style={{ marginTop: '-2.5rem', marginBottom: '2.5rem', color: '#A63A2C', fontSize: '0.9rem', fontWeight: '500' }}>
              {heroError}{' '}
              {heroError.includes('Account exists') && (
                <Link href="/login" style={{ color: '#191510', textDecoration: 'underline', fontWeight: '500' }}>
                  Log in
                </Link>
              )}
            </div>
          )}

          {/* Row of 3 Bordered Info Cards */}
          <div
            className="fidel-info-cards"
            style={{
              display: 'flex',
              gap: '1.25rem',
              justifyContent: 'center',
              width: '100%',
              flexWrap: 'nowrap',
            }}
          >
            {/* Stat Card */}
            <div
              style={{
                flex: '1 1 0px',
                minWidth: 0,
                padding: '1.25rem 0.75rem',
                border: '1px solid rgba(25, 21, 16, 0.2)',
                backgroundColor: '#F7F3EA',
                borderRadius: '0px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: '#191510',
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: '-0.02em',
                  marginBottom: '0.25rem',
                }}
              >
                12,400
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#9A9284',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  lineHeight: '1.4',
                }}
              >
                learners enrolled across 40+ countries
              </div>
            </div>

            {/* Testimonial Card */}
            <div
              style={{
                flex: '1 1 0px',
                minWidth: 0,
                padding: '1.25rem 0.75rem',
                border: '1px solid rgba(25, 21, 16, 0.2)',
                backgroundColor: '#F7F3EA',
                borderRadius: '0px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: '#191510',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  lineHeight: '1.4',
                  marginBottom: '0.35rem',
                  fontStyle: 'italic',
                }}
              >
                "Finally clicked for me."
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#9A9284',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                — Rediet T., Product Designer
              </div>
            </div>

            {/* Rating Card */}
            <div
              style={{
                flex: '1 1 0px',
                minWidth: 0,
                padding: '1.25rem 0.75rem',
                border: '1px solid rgba(25, 21, 16, 0.2)',
                backgroundColor: '#F7F3EA',
                borderRadius: '0px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: '#191510',
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: '-0.02em',
                  marginBottom: '0.25rem',
                }}
              >
                4.9/5
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#9A9284',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  lineHeight: '1.4',
                }}
              >
                rated by learners after course completion
              </div>
            </div>
          </div>
        </div>

        {/* Responsive CSS for Mobile */}
        <style jsx>{`
          @media (max-width: 768px) {
            .fidel-ring-container {
              display: none !important;
            }
            .fidel-hero-headline {
              font-size: 40px !important;
            }
            .fidel-info-cards {
              flex-direction: column !important;
              align-items: center !important;
            }
            .fidel-info-cards > div {
              width: 100% !important;
              max-width: 300px !important;
            }
          }
        `}</style>
      </section>

      {/* COURSE CARDS SECTION ("Explore Our Courses") */}
      <section style={{ padding: '5rem 1.5rem 4rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: '700',
                color: '#A63A2C',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: "'IBM Plex Sans', sans-serif",
                marginBottom: '0.5rem',
              }}
            >
              COURSE LIBRARY
            </div>
            <h2
              style={{
                fontSize: '2.25rem',
                fontWeight: '700',
                color: '#191510',
                margin: '0 0 0.5rem 0',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              Explore our courses
            </h2>
            <p style={{ color: '#55503F', fontSize: '1rem', margin: 0, fontWeight: '400', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Select a category to view full curriculum details and free lesson previews.
            </p>
          </div>

          {previewCategories.length > 3 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={prevSlide}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '0px',
                  border: '1px solid rgba(25, 21, 16, 0.3)',
                  backgroundColor: '#F7F3EA',
                  color: '#191510',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                ←
              </button>
              <button
                onClick={nextSlide}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '0px',
                  border: '1px solid rgba(25, 21, 16, 0.3)',
                  backgroundColor: '#F7F3EA',
                  color: '#191510',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.75rem',
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

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link
            href="/preview"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 2rem',
              backgroundColor: '#A63A2C',
              color: '#F7F3EA',
              borderRadius: '0px',
              fontWeight: '500',
              fontSize: '0.95rem',
              textDecoration: 'none',
              fontFamily: "'IBM Plex Sans', sans-serif",
              transition: 'all 0.15s ease',
            }}
          >
            <span>See all courses</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* SECTION 1: "WHY IT WORKS" — 3 Feature Cards with Double-Ring Icon Motif */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '6rem 1.5rem', borderTop: '1px solid rgba(25, 21, 16, 0.14)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ color: '#A63A2C', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              PROVEN METHODOLOGY
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#191510', margin: '0.5rem 0 0 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              Why it works
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                backgroundColor: '#F7F3EA',
                padding: '2.5rem 2rem',
                borderRadius: '0px',
                border: '1px solid rgba(25, 21, 16, 0.14)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              {/* Double Ring Motif */}
              <div
                style={{
                  position: 'relative',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '1px solid #191510',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '50%',
                    border: '1px solid rgba(25, 21, 16, 0.25)',
                    pointerEvents: 'none',
                  }}
                />
                <Play width={20} height={20} color="#191510" strokeWidth={1.5} style={{ marginLeft: '2px' }} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#191510', margin: '0 0 0.75rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
                Expert Video Lessons
              </h3>
              <p style={{ color: '#55503F', fontSize: '0.95rem', lineHeight: '1.6', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                High-quality video content taught by subject experts, making complex topics simple and engaging.
              </p>
            </div>

            {/* Card 2 */}
            <div
              style={{
                backgroundColor: '#F7F3EA',
                padding: '2.5rem 2rem',
                borderRadius: '0px',
                border: '1px solid rgba(25, 21, 16, 0.14)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              {/* Double Ring Motif */}
              <div
                style={{
                  position: 'relative',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '1px solid #191510',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '50%',
                    border: '1px solid rgba(25, 21, 16, 0.25)',
                    pointerEvents: 'none',
                  }}
                />
                <GraduationCap width={20} height={20} color="#191510" strokeWidth={1.5} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#191510', margin: '0 0 0.75rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
                Learn at Your Own Pace
              </h3>
              <p style={{ color: '#55503F', fontSize: '0.95rem', lineHeight: '1.6', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Access your courses anytime, anywhere. Pause, rewind, and rewatch as many times as you need.
              </p>
            </div>

            {/* Card 3 */}
            <div
              style={{
                backgroundColor: '#F7F3EA',
                padding: '2.5rem 2rem',
                borderRadius: '0px',
                border: '1px solid rgba(25, 21, 16, 0.14)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              {/* Double Ring Motif */}
              <div
                style={{
                  position: 'relative',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '1px solid #191510',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '50%',
                    border: '1px solid rgba(25, 21, 16, 0.25)',
                    pointerEvents: 'none',
                  }}
                />
                <Download width={20} height={20} color="#191510" strokeWidth={1.5} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#191510', margin: '0 0 0.75rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
                Lifetime Access, Pay Once
              </h3>
              <p style={{ color: '#55503F', fontSize: '0.95rem', lineHeight: '1.6', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Purchase a course once and own it forever. No subscriptions, no recurring fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: STATS BAND (Full-width Solid Ink Band with 1px Ivory Hairline Dividers) */}
      <section style={{ backgroundColor: '#191510', color: '#F7F3EA', padding: '4rem 1.5rem', borderTop: '1px solid rgba(25, 21, 16, 0.14)', borderBottom: '1px solid rgba(25, 21, 16, 0.14)' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            textAlign: 'center',
          }}
        >
          {/* Stat Item 1 */}
          <div style={{ padding: '1rem', borderRight: '1px solid rgba(247, 243, 234, 0.1)' }}>
            <div style={{ fontSize: '3.25rem', fontWeight: '700', color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              500+
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '500', color: 'rgba(247, 243, 234, 0.7)', marginTop: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Students Enrolled
            </div>
          </div>

          {/* Stat Item 2 */}
          <div style={{ padding: '1rem', borderRight: '1px solid rgba(247, 243, 234, 0.1)' }}>
            <div style={{ fontSize: '3.25rem', fontWeight: '700', color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              50+
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '500', color: 'rgba(247, 243, 234, 0.7)', marginTop: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Video Lessons
            </div>
          </div>

          {/* Stat Item 3 */}
          <div style={{ padding: '1rem', borderRight: '1px solid rgba(247, 243, 234, 0.1)' }}>
            <div style={{ fontSize: '3.25rem', fontWeight: '700', color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              10+
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '500', color: 'rgba(247, 243, 234, 0.7)', marginTop: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Course Categories
            </div>
          </div>

          {/* Stat Item 4 */}
          <div style={{ padding: '1rem' }}>
            <div style={{ fontSize: '3.25rem', fontWeight: '700', color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              100%
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '500', color: 'rgba(247, 243, 234, 0.7)', marginTop: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Lifetime Access
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: "THE SMARTER WAY TO LEARN" — Accordion + Restyled Video Mockup */}
      <section style={{ backgroundColor: '#FFFFFF', color: '#191510', padding: '6rem 1.5rem', borderBottom: '1px solid rgba(25, 21, 16, 0.14)' }}>
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
          {/* Left Column: Accordion */}
          <div style={{ flex: '1 1 500px', maxWidth: '620px' }}>
            <span style={{ color: '#A63A2C', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              HOW IT WORKS
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#191510', margin: '0.5rem 0 1rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              The Smarter Way to Learn
            </h2>
            <p style={{ color: '#55503F', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Our structured e-learning platform combines step-by-step video tutorials with flexible self-paced studying and effortless local payment options.
            </p>

            {/* Accordion Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {accordionData.map((item, idx) => {
                const isOpen = openAccordion === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#F7F3EA',
                      border: `1px solid ${isOpen ? '#191510' : 'rgba(25, 21, 16, 0.14)'}`,
                      borderRadius: '0px',
                      overflow: 'hidden',
                      transition: 'all 0.15s ease',
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
                        color: '#191510',
                        fontSize: '1.05rem',
                        fontWeight: '600',
                        fontFamily: "'Space Grotesk', sans-serif",
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{item.title}</span>
                      <ChevronDown
                        width={18}
                        height={18}
                        color="#191510"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 1.4rem 1.25rem 1.4rem', color: '#55503F', fontSize: '0.95rem', lineHeight: '1.6', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        {item.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dark Browser-Chrome Card with Vermilion Highlights */}
          <div style={{ flex: '1 1 480px', maxWidth: '540px', width: '100%' }}>
            <div
              style={{
                position: 'relative',
                backgroundColor: '#191510',
                borderRadius: '0px',
                border: '1px solid rgba(25, 21, 16, 0.3)',
                padding: '2rem',
              }}
            >
              {/* Window Controls */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#A63A2C' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(247, 243, 234, 0.4)' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(247, 243, 234, 0.2)' }}></div>
              </div>

              {/* Video Frame */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '220px',
                  backgroundColor: '#110e0b',
                  borderRadius: '0px',
                  border: '1px solid rgba(247, 243, 234, 0.1)',
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
                    backgroundColor: '#A63A2C',
                    color: '#F7F3EA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play width={22} height={22} fill="#F7F3EA" style={{ marginLeft: '3px' }} />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '14px',
                    backgroundColor: '#191510',
                    border: '1px solid rgba(247, 243, 234, 0.2)',
                    padding: '4px 10px',
                    borderRadius: '0px',
                    fontSize: '0.78rem',
                    color: '#F7F3EA',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                >
                  Lesson 01: Core Concepts
                </div>
              </div>

              {/* Modules List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', backgroundColor: '#110e0b', borderRadius: '0px', border: '1px solid rgba(247, 243, 234, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 width={16} height={16} color="#F7F3EA" />
                    <span style={{ fontSize: '0.88rem', fontWeight: '500', color: '#F7F3EA', fontFamily: "'IBM Plex Sans', sans-serif" }}>Module 1: Introduction</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#F7F3EA', fontWeight: '500', fontFamily: "'IBM Plex Sans', sans-serif", border: '1px solid rgba(247, 243, 234, 0.3)', padding: '0.15rem 0.45rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Completed
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', backgroundColor: '#110e0b', borderRadius: '0px', border: '1px solid #A63A2C' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Play width={16} height={16} color="#A63A2C" />
                    <span style={{ fontSize: '0.88rem', fontWeight: '500', color: '#F7F3EA', fontFamily: "'IBM Plex Sans', sans-serif" }}>Module 2: Practical Exercises</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#F7F3EA', fontWeight: '500', fontFamily: "'IBM Plex Sans', sans-serif", border: '1px solid #A63A2C', backgroundColor: '#A63A2C', padding: '0.15rem 0.45rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    In Progress
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: "WHAT OUR STUDENTS SAY" — Testimonials */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '6rem 1.5rem', borderBottom: '1px solid rgba(25, 21, 16, 0.14)' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ color: '#A63A2C', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            STUDENT SUCCESS
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#191510', margin: '0.5rem 0 3.5rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
            What Our Students Say
          </h2>

          {/* Testimonial Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                backgroundColor: '#F7F3EA',
                padding: '3rem 2.5rem',
                borderRadius: '0px',
                border: '1px solid rgba(25, 21, 16, 0.2)',
                width: '100%',
                maxWidth: '760px',
              }}
            >
              {/* Star Rating in Meskel Gold Icons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.5rem' }}>
                {[...Array(testimonials[testimonialIndex].rating)].map((_, i) => (
                  <Star key={i} width={18} height={18} fill="#C98A2E" color="#C98A2E" strokeWidth={1.75} />
                ))}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontSize: '1.15rem',
                  color: '#191510',
                  lineHeight: '1.65',
                  fontStyle: 'italic',
                  marginBottom: '2rem',
                  fontWeight: '400',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                "{testimonials[testimonialIndex].quote}"
              </p>

              {/* Author */}
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {testimonials[testimonialIndex].name}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#9A9284', fontWeight: '400', marginTop: '0.2rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {testimonials[testimonialIndex].role}
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '2.5rem' }}>
            <button
              onClick={() => setTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0px',
                border: '1px solid rgba(25, 21, 16, 0.3)',
                backgroundColor: '#F7F3EA',
                color: '#191510',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              aria-label="Previous Testimonial"
            >
              <ChevronLeft width={18} height={18} color="#191510" />
            </button>

            {/* Short 1px Underline Indicators */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  style={{
                    width: i === testimonialIndex ? '28px' : '16px',
                    height: '2px',
                    backgroundColor: i === testimonialIndex ? '#C98A2E' : 'rgba(25, 21, 16, 0.2)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
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
                borderRadius: '0px',
                border: '1px solid rgba(25, 21, 16, 0.3)',
                backgroundColor: '#F7F3EA',
                color: '#191510',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              aria-label="Next Testimonial"
            >
              <ChevronRight width={18} height={18} color="#191510" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 5: FINAL CTA BANNER (Full-width Vermilion Fill) */}
      <section
        style={{
          backgroundColor: '#A63A2C',
          color: '#F7F3EA',
          padding: '6rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0 0 1rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
            Ready to Start Learning?
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#F7F3EA', opacity: 0.9, margin: '0 0 2.5rem 0', fontWeight: '400', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Join hundreds of students already improving their grades.
          </p>

          <form
            onSubmit={handleCtaGetStarted}
            style={{
              display: 'flex',
              maxWidth: '460px',
              margin: '0 auto',
            }}
          >
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              style={{
                flex: '1',
                padding: '0.85rem 1.25rem',
                borderRadius: '0px',
                border: '1.5px solid #191510',
                borderRight: 'none',
                backgroundColor: '#F7F3EA',
                color: '#191510',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            />
            <button
              type="submit"
              disabled={ctaLoading}
              style={{
                padding: '0.85rem 1.75rem',
                backgroundColor: '#191510',
                color: '#F7F3EA',
                border: '1.5px solid #191510',
                borderRadius: '0px',
                fontWeight: '500',
                fontSize: '0.95rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: ctaLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.15s ease',
              }}
            >
              {ctaLoading ? 'Initiating...' : 'Get Started'}
            </button>
          </form>

          {ctaError && (
            <div style={{ marginTop: '1.25rem', color: '#F7F3EA', fontSize: '0.9rem', fontWeight: '500' }}>
              {ctaError}{' '}
              {ctaError.includes('Account exists') && (
                <Link href="/login" style={{ color: '#F7F3EA', textDecoration: 'underline', fontWeight: '500' }}>
                  Log in
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 6: CONTACT SECTION */}
      <section id="contact" style={{ backgroundColor: '#FFFFFF', padding: '6rem 1.5rem' }}>
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
            <span style={{ color: '#A63A2C', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              NEED HELP?
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#191510', margin: '0.5rem 0 1rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              Get in Touch
            </h2>
            <p style={{ color: '#55503F', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Have questions? We're here to help. Reach out to our support team and we'll get back to you promptly.
            </p>

            {/* Email Card Chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: '#F7F3EA', padding: '1.4rem', borderRadius: '0px', border: '1px solid rgba(25, 21, 16, 0.2)' }}>
              <div
                style={{
                  position: 'relative',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: '1px solid #191510',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Mail width={20} height={20} color="#191510" strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#9A9284', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.05em' }}>
                  Email Support
                </div>
                <a href={`mailto:${contactEmailDisplay}`} style={{ fontSize: '1rem', fontWeight: '600', color: '#A63A2C', textDecoration: 'none', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {contactEmailDisplay}
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div style={{ flex: '1 1 500px', maxWidth: '620px', width: '100%' }}>
            <div
              style={{
                backgroundColor: '#F7F3EA',
                padding: '2.5rem',
                borderRadius: '0px',
                border: '1px solid rgba(25, 21, 16, 0.2)',
              }}
            >
              {contactSubmitted ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      border: '1.5px solid #191510',
                      color: '#191510',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem auto',
                    }}
                  >
                    <CheckCircle2 width={32} height={32} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#191510', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                    Message Sent!
                  </h3>
                  <p style={{ color: '#55503F', fontSize: '1rem', lineHeight: '1.6', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    Thank you for contacting us. Our support team will get back to you shortly.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    style={{
                      marginTop: '2rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#A63A2C',
                      color: '#F7F3EA',
                      border: 'none',
                      borderRadius: '0px',
                      fontWeight: '500',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      cursor: 'pointer',
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
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
                        borderRadius: '0px',
                        border: '1.5px solid #191510',
                        backgroundColor: '#F7F3EA',
                        color: '#191510',
                        fontSize: '0.95rem',
                        outline: 'none',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
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
                        borderRadius: '0px',
                        border: '1.5px solid #191510',
                        backgroundColor: '#F7F3EA',
                        color: '#191510',
                        fontSize: '0.95rem',
                        outline: 'none',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
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
                        borderRadius: '0px',
                        border: '1.5px solid #191510',
                        backgroundColor: '#F7F3EA',
                        color: '#191510',
                        fontSize: '0.95rem',
                        outline: 'none',
                        fontFamily: "'IBM Plex Sans', sans-serif",
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
                      backgroundColor: '#191510',
                      color: '#F7F3EA',
                      border: 'none',
                      borderRadius: '0px',
                      fontWeight: '500',
                      fontSize: '0.95rem',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      cursor: contactLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
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
