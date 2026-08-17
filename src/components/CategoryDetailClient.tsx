'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatEmbedUrl } from '@/lib/video-utils';

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  source_type: string;
  format: string;
  is_free: boolean;
  downloadable: boolean;
  duration_seconds: number | null;
}

interface LessonItem {
  id: string;
  name: string;
  description: string | null;
  videos: VideoItem[];
}

interface CategoryDetailClientProps {
  category: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    lessons: LessonItem[];
  };
  userAccessState: 'a' | 'b' | 'c' | 'd'; // a: logged out, b: logged in non-purchased, c: purchased, d: pending
  isLoggedIn: boolean;
}

export default function CategoryDetailClient({ category, userAccessState, isLoggedIn }: CategoryDetailClientProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [playerState, setPlayerState] = useState<{ loading: boolean; playable: boolean; url?: string; embedUrl?: string; error?: string } | null>(null);
  const [showPurchasePanel, setShowPurchasePanel] = useState(false);
  const [expandedLessonIds, setExpandedLessonIds] = useState<Record<string, boolean>>(
    category.lessons.reduce((acc, l) => ({ ...acc, [l.id]: true }), {})
  );

  // Form Submission State
  const [refNumber, setRefNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '03:29';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSelect = async (video: VideoItem) => {
    setSelectedVideo(video);
    const canAccess = video.is_free || userAccessState === 'c';

    if (!canAccess) {
      setPlayerState({ loading: false, playable: false });
      return;
    }

    setPlayerState({ loading: true, playable: false });

    try {
      const res = await fetch(`/api/student/videos/${video.id}/play`);
      const data = await res.json();

      if (!res.ok) {
        setPlayerState({ loading: false, playable: false, error: data.error || 'Access denied' });
        return;
      }

      setPlayerState({
        loading: false,
        playable: true,
        url: data.streamUrl,
        embedUrl: data.embedUrl,
      });
    } catch {
      setPlayerState({ loading: false, playable: false, error: 'Failed to load video stream.' });
    }
  };

  const toggleLesson = (id: string) => {
    setExpandedLessonIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNumber.trim()) return;

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(`/api/student/courses/${category.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference_number: refNumber.trim(), amount_claimed: category.price }),
      });
      const data = await res.json();

      if (res.ok) {
        setSubmitMessage('Your payment is under review. Our admins will verify your CBE transfer shortly!');
      } else {
        setSubmitMessage(data.error || 'Submission failed. Please check reference number.');
      }
    } catch {
      setSubmitMessage('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#24201a', height: '100vh', width: '100vw', overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. TOP BAR */}
      <header
        style={{
          backgroundColor: '#24201a',
          padding: '0.85rem 2.5rem',
          height: '55px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #332d25',
        }}
      >
        <Link
          href="/preview"
          style={{
            color: '#e94f6b',
            fontWeight: '700',
            fontSize: '0.9rem',
            textDecoration: 'none',
            fontFamily: "'Space Grotesk', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          ← Back to Catalog
        </Link>

        <div style={{ fontSize: '1rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#ffffff' }}>
          {category.name}
        </div>

        <div>
          {userAccessState === 'c' && (
            <span style={{ fontSize: '0.85rem', color: '#05b98a', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>✓ Enrolled</span>
          )}
          {userAccessState === 'd' && (
            <span style={{ fontSize: '0.85rem', color: '#ffd166', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>⏳ Pending Verification</span>
          )}
          {(userAccessState === 'a' || userAccessState === 'b') && (
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  window.location.href = `/login?callbackUrl=${encodeURIComponent(`/preview/${category.id}`)}`;
                } else {
                  setShowPurchasePanel(true);
                }
              }}
              style={{
                backgroundColor: '#e94f6b',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.85rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
              }}
            >
              Enroll Now ({category.price} ETB)
            </button>
          )}
        </div>
      </header>

      {/* MAIN TWO-PANEL CONTENT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT SYLLABUS PANEL (40%) */}
        <div style={{ width: '400px', backgroundColor: '#fdf9f2', borderRight: '1px solid #ecdfc4', display: 'flex', flexDirection: 'column', overflowY: 'auto', color: '#24201a' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #ecdfc4' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 0.5rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              Course Syllabus
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#6b6151', margin: 0 }}>
              {category.description || 'Structured step-by-step video modules.'}
            </p>
          </div>

          <div style={{ padding: '1rem' }}>
            {category.lessons.map((lesson, idx) => (
              <div key={lesson.id} style={{ marginBottom: '0.75rem', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #ecdfc4', overflow: 'hidden' }}>
                <div
                  onClick={() => toggleLesson(lesson.id)}
                  style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem' }}
                >
                  <span>{idx + 1}. {lesson.name}</span>
                  <span>{expandedLessonIds[lesson.id] ? '▲' : '▼'}</span>
                </div>
                {expandedLessonIds[lesson.id] && (
                  <div style={{ borderTop: '1px solid #ecdfc4' }}>
                    {lesson.videos.map((vid) => {
                      const isSelected = selectedVideo?.id === vid.id;
                      const canWatch = vid.is_free || userAccessState === 'c';
                      return (
                        <div
                          key={vid.id}
                          onClick={() => handleVideoSelect(vid)}
                          style={{
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#fde8eb' : '#ffffff',
                            borderLeft: isSelected ? '4px solid #e94f6b' : '4px solid transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{canWatch ? (isSelected ? '▶️' : '🎬') : '🔒'}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#e94f6b' : '#24201a', fontFamily: "'Space Grotesk', sans-serif" }}>
                              {vid.title}
                            </span>
                          </div>
                          {vid.is_free && (
                            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#05b98a', backgroundColor: '#e6f8f3', padding: '0.15rem 0.4rem', borderRadius: '4px', fontFamily: "'Space Grotesk', sans-serif" }}>
                              FREE
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT VIDEO PLAYER (60%) */}
        <div style={{ flex: 1, backgroundColor: '#24201a', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ aspectRatio: '16/9', width: '100%', backgroundColor: '#1c1914', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!selectedVideo ? (
              <div style={{ textAlign: 'center', color: '#9a8e73' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎓</div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Select a video lesson from the left syllabus to begin previewing.</p>
              </div>
            ) : playerState?.loading ? (
              <div style={{ color: '#ffffff' }}>Loading stream...</div>
            ) : playerState?.playable ? (
              playerState.embedUrl ? (
                <iframe src={formatEmbedUrl(playerState.embedUrl)} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
              ) : (
                <video src={playerState.url} controls autoPlay style={{ width: '100%', height: '100%' }} />
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#ffffff' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔒</div>
                <h3 style={{ fontSize: '1.4rem', fontFamily: "'Space Grotesk', sans-serif", margin: '0 0 0.5rem 0' }}>This video is locked</h3>
                <p style={{ color: '#9a8e73', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>Enroll in this category to unlock all video modules.</p>
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      window.location.href = `/login?callbackUrl=${encodeURIComponent(`/preview/${category.id}`)}`;
                    } else {
                      setShowPurchasePanel(true);
                    }
                  }}
                  style={{ backgroundColor: '#e94f6b', color: '#ffffff', border: 'none', padding: '0.8rem 1.75rem', borderRadius: '8px', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }}
                >
                  Enroll Now ({category.price} ETB)
                </button>
              </div>
            )}
          </div>

          {selectedVideo && (
            <div style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 0.5rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
                {selectedVideo.title}
              </h2>
              {selectedVideo.description && (
                <p style={{ color: '#9a8e73', lineHeight: '1.6', margin: 0 }}>{selectedVideo.description}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
