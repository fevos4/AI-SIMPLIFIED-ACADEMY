'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { Lock, Play, ChevronDown } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description?: string | null;
  source_type: string;
  thumbnail_path?: string | null;
  is_free: boolean;
  duration_seconds?: number | null;
  status?: 'locked' | 'in-progress' | 'completed';
}

interface Lesson {
  id: string;
  name: string;
  description?: string | null;
  position: number;
  videos: Video[];
}

interface CategoryPreviewClientProps {
  category: {
    id: string;
    name: string;
    description?: string | null;
    price: any;
    coming_soon: boolean;
    lessons: Lesson[];
  };
  isLoggedIn: boolean;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '03:29';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function CategoryPreviewClient({ category, isLoggedIn }: CategoryPreviewClientProps) {
  // Accordion state: open lesson IDs (first lesson open by default)
  const [openLessons, setOpenLessons] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (category.lessons && category.lessons.length > 0) {
      initial[category.lessons[0].id] = true;
    }
    return initial;
  });

  // Free video modal state
  const [previewVideo, setPreviewVideo] = useState<{
    id: string;
    title: string;
    url?: string;
    embedUrl?: string;
    sourceType: string;
  } | null>(null);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const toggleLesson = (lessonId: string) => {
    setOpenLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  const totalLessons = category.lessons?.length || 0;
  const totalVideos = category.lessons?.reduce((acc, l) => acc + (l.videos?.length || 0), 0) || 0;

  const handlePlayFreeVideo = async (video: Video) => {
    if (!video.is_free) return;
    setLoadingVideoId(video.id);
    setVideoError(null);

    try {
      const res = await fetch(`/api/student/videos/${video.id}/play`);
      const data = await res.json();

      if (!res.ok) {
        setVideoError(data.error || 'Failed to load video sample');
        setLoadingVideoId(null);
        return;
      }

      setPreviewVideo({
        id: video.id,
        title: video.title,
        url: data.url,
        embedUrl: data.embedUrl,
        sourceType: video.source_type,
      });
    } catch (err) {
      console.error('Error fetching preview video:', err);
      setVideoError('Failed to load video preview');
    } finally {
      setLoadingVideoId(null);
    }
  };

  const purchaseHref = isLoggedIn
    ? `/courses/${category.id}`
    : `/signup?callbackUrl=${encodeURIComponent(`/courses/${category.id}`)}`;

  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/courses/${category.id}`)}`;

  return (
    <div style={{ backgroundColor: '#F7F3EA', minHeight: '100vh', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <PublicNavbar />

      <main style={{ padding: '4rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Back Link */}
        <div style={{ marginBottom: '2rem' }}>
          <Link
            href="/preview"
            style={{
              color: '#191510',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <span>←</span>
            <span>Back to courses</span>
          </Link>
        </div>

        {/* 2-Column Split Layout */}
        <div
          style={{
            display: 'flex',
            gap: '3.5rem',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {/* Left Column — Course Overview (~45%) */}
          <div style={{ flex: '1 1 440px', maxWidth: '540px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.65rem',
                border: '1px solid #191510',
                backgroundColor: 'transparent',
                color: '#191510',
                borderRadius: '0px',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1.25rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Course overview
            </span>

            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#191510',
                margin: '0 0 1.25rem 0',
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: '1.15',
                letterSpacing: '-0.02em',
              }}
            >
              {category.name}
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#55503F', lineHeight: '1.6', marginBottom: '2rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {category.description || 'Master core Artificial Intelligence concepts, Large Language Models, capabilities, and everyday applications.'}
            </p>

            {/* "What you'll learn" Box */}
            <div
              style={{
                backgroundColor: '#F7F3EA',
                padding: '1.75rem',
                borderRadius: '0px',
                border: '1px solid rgba(25, 21, 16, 0.14)',
                marginBottom: '2.25rem',
              }}
            >
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: '700', color: '#191510', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
                What you'll learn
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#191510', lineHeight: '1.7', fontSize: '0.95rem', fontFamily: "'IBM Plex Sans', sans-serif", listStyleType: 'disc' }}>
                {category.lessons && category.lessons.length > 0 ? (
                  category.lessons.map((lesson) => (
                    <li key={lesson.id} style={{ marginBottom: '0.5rem', color: '#191510' }}>
                      <span style={{ color: '#191510' }}>{lesson.name}</span>
                    </li>
                  ))
                ) : (
                  <li style={{ marginBottom: '0.5rem' }}>Comprehensive foundational principles and hands-on workflow execution</li>
                )}
              </ul>
            </div>

            {/* Stats & Price Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '1.5rem',
                marginBottom: '1.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', color: '#9A9284', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: '0.25rem' }}>
                  Total lifetime access
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
                  {Number(category.price)} ETB
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', borderLeft: '1px solid rgba(25, 21, 16, 0.14)', paddingLeft: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>{totalLessons}</div>
                  <div style={{ fontSize: '0.82rem', color: '#9A9284', fontFamily: "'IBM Plex Sans', sans-serif" }}>Lessons</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>{totalVideos}</div>
                  <div style={{ fontSize: '0.82rem', color: '#9A9284', fontFamily: "'IBM Plex Sans', sans-serif" }}>Videos</div>
                </div>
              </div>
            </div>

            {/* Primary Action CTA Button */}
            <Link
              href={purchaseHref}
              style={{
                display: 'block',
                width: '100%',
                padding: '1rem',
                backgroundColor: '#191510',
                color: '#F7F3EA',
                textAlign: 'center',
                borderRadius: '0px',
                fontWeight: '500',
                fontSize: '1rem',
                textDecoration: 'none',
                fontFamily: "'IBM Plex Sans', sans-serif",
                marginBottom: '1rem',
                boxSizing: 'border-box',
                transition: 'background-color 0.15s ease',
              }}
            >
              Purchase this course
            </Link>

            {/* Secondary Link */}
            {!isLoggedIn && (
              <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#55503F', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Already purchased?{' '}
                <Link href={loginHref} style={{ color: '#191510', fontWeight: '600', textDecoration: 'underline' }}>
                  Log in
                </Link>
              </div>
            )}
          </div>

          {/* Right Column (~55%) — Course Content Accordion */}
          <div style={{ flex: '1 1 500px' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#191510',
                margin: '0 0 1.5rem 0',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Course Content</span>
              <span style={{ fontSize: '0.85rem', color: '#9A9284', fontWeight: '400', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {totalLessons} lessons • {totalVideos} videos
              </span>
            </h2>

            {category.lessons && category.lessons.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {category.lessons.map((lesson, idx) => {
                  const isOpen = Boolean(openLessons[lesson.id]);
                  return (
                    <div
                      key={lesson.id}
                      style={{
                        borderRadius: '0px',
                        border: '1px solid rgba(25, 21, 16, 0.14)',
                        backgroundColor: '#F7F3EA',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Module Header Row */}
                      <button
                        onClick={() => toggleLesson(lesson.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1.2rem 1.4rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <span
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              border: '1px solid #191510',
                              backgroundColor: 'transparent',
                              color: '#191510',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: "'Space Grotesk', sans-serif",
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>
                              {lesson.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#9A9284', marginTop: '0.1rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                              {lesson.videos?.length || 0} {lesson.videos?.length === 1 ? 'video' : 'videos'}
                            </div>
                          </div>
                        </div>

                        <ChevronDown
                          width={18}
                          height={18}
                          color="#191510"
                          style={{
                            transition: 'transform 0.2s ease',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      </button>

                      {/* Accordion Body — Plain List Rows */}
                      {isOpen && (
                        <div style={{ borderTop: '1px solid rgba(25, 21, 16, 0.14)' }}>
                          {lesson.videos && lesson.videos.length > 0 ? (
                            <div>
                              {lesson.videos.map((vid, vIdx) => (
                                <div
                                  key={vid.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.9rem 1.4rem',
                                    backgroundColor: '#F7F3EA',
                                    borderBottom: vIdx < lesson.videos.length - 1 ? '1px solid rgba(25, 21, 16, 0.1)' : 'none',
                                    gap: '1rem',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                                    {vid.is_free ? (
                                      <Play width={16} height={16} color="#A63A2C" strokeWidth={2} style={{ flexShrink: 0 }} />
                                    ) : (
                                      <Lock width={16} height={16} color="#191510" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                                    )}
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#191510', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {vid.title}
                                      </div>
                                      <div style={{ fontSize: '0.8rem', color: '#9A9284', marginTop: '0.15rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                                        {formatDuration(vid.duration_seconds)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action / Badge */}
                                  <div>
                                    {vid.is_free ? (
                                      <button
                                        onClick={() => handlePlayFreeVideo(vid)}
                                        disabled={loadingVideoId === vid.id}
                                        style={{
                                          padding: '0.35rem 0.85rem',
                                          backgroundColor: '#A63A2C',
                                          color: '#F7F3EA',
                                          border: 'none',
                                          borderRadius: '0px',
                                          fontWeight: '500',
                                          fontSize: '0.8rem',
                                          fontFamily: "'IBM Plex Sans', sans-serif",
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}
                                      >
                                        {loadingVideoId === vid.id ? 'Loading...' : 'Preview'}
                                      </button>
                                    ) : vid.status === 'completed' ? (
                                      <span style={{ padding: '0.2rem 0.55rem', border: '1px solid #2D5A27', color: '#2D5A27', borderRadius: '0px', fontSize: '0.7rem', fontWeight: '600', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Completed
                                      </span>
                                    ) : vid.status === 'in-progress' ? (
                                      <span style={{ padding: '0.2rem 0.55rem', border: '1px solid #D4A017', color: '#D4A017', borderRadius: '0px', fontSize: '0.7rem', fontWeight: '600', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        In progress
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          padding: '0.2rem 0.55rem',
                                          backgroundColor: '#191510',
                                          color: '#F7F3EA',
                                          borderRadius: '0px',
                                          fontSize: '0.7rem',
                                          fontWeight: '500',
                                          fontFamily: "'IBM Plex Sans', sans-serif",
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.05em',
                                        }}
                                      >
                                        Locked
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: '#9A9284', fontSize: '0.85rem', padding: '1rem 1.4rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                              No video lessons available in this module yet.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#F7F3EA', border: '1px solid rgba(25, 21, 16, 0.14)', borderRadius: '0px', color: '#9A9284', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Curriculum structure is being uploaded.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Free Video Sample Modal */}
      {previewVideo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            backgroundColor: 'rgba(25, 21, 16, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setPreviewVideo(null)}
        >
          <div
            style={{
              backgroundColor: '#191510',
              borderRadius: '0px',
              border: '1px solid rgba(247, 243, 234, 0.2)',
              width: '100%',
              maxWidth: '850px',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: '#191510',
                color: '#F7F3EA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(247, 243, 234, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ backgroundColor: '#A63A2C', color: '#F7F3EA', fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '0px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  FREE PREVIEW
                </span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {previewVideo.title}
                </h3>
              </div>

              <button
                onClick={() => setPreviewVideo(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#F7F3EA',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div style={{ backgroundColor: '#000000', position: 'relative', width: '100%', aspectRatio: '16/9' }}>
              {previewVideo.sourceType === 'embed' ? (
                <iframe
                  src={previewVideo.embedUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewVideo.url}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
