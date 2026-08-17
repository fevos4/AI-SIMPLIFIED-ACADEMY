'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavbar from '@/components/PublicNavbar';

interface Video {
  id: string;
  title: string;
  description?: string | null;
  source_type: string;
  thumbnail_path?: string | null;
  is_free: boolean;
  duration_seconds?: number | null;
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
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <PublicNavbar />

      <main style={{ padding: '3.5rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '2rem', fontSize: '0.9rem', color: '#64748b' }}>
          <Link href="/preview" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Courses
          </Link>
        </div>

        {/* 2-Column Split Layout (Image 2 Inspired) */}
        <div
          style={{
            display: 'flex',
            gap: '3.5rem',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {/* Left Column (~45%) */}
          <div style={{ flex: '1 1 440px', maxWidth: '540px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.35rem 0.85rem',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '1rem',
              }}
            >
              Course Overview
            </span>

            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: '900',
                color: '#0f172a',
                margin: '0 0 1rem 0',
                fontFamily: "'Outfit', sans-serif",
                lineHeight: '1.1',
              }}
            >
              {category.name}
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: '1.6', marginBottom: '2rem' }}>
              {category.description || 'Comprehensive curriculum designed for practical skill mastery with hands-on video modules.'}
            </p>

            {/* "What you'll learn" bullet points */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '1.75rem',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                marginBottom: '2rem',
              }}
            >
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                What you'll learn
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', lineHeight: '1.7', fontSize: '0.95rem' }}>
                {category.lessons && category.lessons.length > 0 ? (
                  category.lessons.map((lesson) => <li key={lesson.id} style={{ marginBottom: '0.5rem' }}>{lesson.name}</li>)
                ) : (
                  <li>Comprehensive foundational principles and hands-on workflow execution</li>
                )}
              </ul>
            </div>

            {/* Stats & Price Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                  Total Lifetime Access
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#4F46E5', fontFamily: "'Outfit', sans-serif" }}>
                  {Number(category.price)} ETB
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', borderLeft: '2px solid #e2e8f0', paddingLeft: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>{totalLessons}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Lessons</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>{totalVideos}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Videos</div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={purchaseHref}
              style={{
                display: 'block',
                width: '100%',
                padding: '1rem',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                textAlign: 'center',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '1.05rem',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(79, 70, 229, 0.35)',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
            >
              Purchase This Course
            </Link>

            {/* Secondary link */}
            {!isLoggedIn && (
              <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                Already purchased?{' '}
                <Link href={loginHref} style={{ color: '#4F46E5', fontWeight: '700', textDecoration: 'none' }}>
                  Log in
                </Link>
              </div>
            )}
          </div>

          {/* Right Column (~55%): Lesson Accordion List */}
          <div style={{ flex: '1 1 500px' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: '#0f172a',
                margin: '0 0 1.25rem 0',
                fontFamily: "'Outfit', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Course Content</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
                {totalLessons} lessons • {totalVideos} videos
              </span>
            </h2>

            {category.lessons && category.lessons.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {category.lessons.map((lesson, idx) => {
                  const isOpen = Boolean(openLessons[lesson.id]);
                  return (
                    <div
                      key={lesson.id}
                      style={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      }}
                    >
                      {/* Accordion Header */}
                      <button
                        onClick={() => toggleLesson(lesson.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1.2rem 1.5rem',
                          backgroundColor: isOpen ? '#f8fafc' : '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <span
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: '#EEF2FF',
                              color: '#4F46E5',
                              fontSize: '0.85rem',
                              fontWeight: '800',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>{lesson.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem' }}>
                              {lesson.videos?.length || 0} {lesson.videos?.length === 1 ? 'video' : 'videos'}
                            </div>
                          </div>
                        </div>

                        <span style={{ fontSize: '1.2rem', color: '#64748b', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          ▼
                        </span>
                      </button>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div style={{ padding: '0.75rem 1.5rem 1.25rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
                          {lesson.videos && lesson.videos.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {lesson.videos.map((vid) => (
                                <div
                                  key={vid.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.85rem 1rem',
                                    borderRadius: '10px',
                                    backgroundColor: vid.is_free ? '#EEF2FF' : '#f8fafc',
                                    border: '1px solid',
                                    borderColor: vid.is_free ? '#C7D2FE' : '#e2e8f0',
                                    gap: '1rem',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: '1.1rem' }}>
                                      {vid.is_free ? '🎬' : '🔒'}
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {vid.title}
                                      </div>
                                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                                        Duration: {formatDuration(vid.duration_seconds)}
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
                                          padding: '0.45rem 1rem',
                                          backgroundColor: '#4F46E5',
                                          color: '#ffffff',
                                          border: 'none',
                                          borderRadius: '8px',
                                          fontWeight: '800',
                                          fontSize: '0.8rem',
                                          cursor: 'pointer',
                                          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}
                                      >
                                        {loadingVideoId === vid.id ? 'Loading...' : '▶ Preview'}
                                      </button>
                                    ) : (
                                      <span
                                        style={{
                                          padding: '0.35rem 0.75rem',
                                          backgroundColor: '#e2e8f0',
                                          color: '#475569',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: '700',
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
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '0.5rem 0' }}>
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
              <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
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
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setPreviewVideo(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '850px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ backgroundColor: '#10B981', color: '#ffffff', fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  FREE PREVIEW
                </span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
                  {previewVideo.title}
                </h3>
              </div>

              <button
                onClick={() => setPreviewVideo(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
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
    </div>
  );
}
