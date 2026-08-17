'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatEmbedUrl } from '@/lib/video-utils';

interface Video {
  id: string;
  title: string;
  description?: string | null;
  source_type: string; // self_hosted or embed
  file_path?: string | null;
  embed_url?: string | null;
  thumbnail_path?: string | null;
  format?: string | null;
  is_free: boolean;
  downloadable: boolean;
  duration_seconds?: number | null;
}

interface Lesson {
  id: string;
  name: string;
  description?: string | null;
  position: number;
  videos: Video[];
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  cover_image_path?: string | null;
  lessons: Lesson[];
}

interface CourseViewClientProps {
  category: Category;
  userAccessStatus: 'purchased' | 'pending' | 'none';
  cbeAccountName: string;
  cbeAccountNumber: string;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '03:29';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function CourseViewClient({
  category,
  userAccessStatus: initialAccessStatus,
  cbeAccountName,
  cbeAccountNumber,
}: CourseViewClientProps) {
  const [accessStatus, setAccessStatus] = useState<'purchased' | 'pending' | 'none'>(initialAccessStatus);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Active playable stream info
  const [streamInfo, setStreamInfo] = useState<{
    url?: string;
    embedUrl?: string;
    format?: string;
    downloadable?: boolean;
  } | null>(null);

  const [loadingStream, setLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Accordion state (first lesson open by default)
  const [openLessons, setOpenLessons] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (category.lessons && category.lessons.length > 0) {
      initial[category.lessons[0].id] = true;
    }
    return initial;
  });

  // Slide-over purchase panel state
  const [showPurchaseSlideOver, setShowPurchaseSlideOver] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState<string>(category.price.toString());
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const toggleLesson = (lessonId: string) => {
    setOpenLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  // Select video & fetch playable presigned URL / embed URL
  const handleSelectVideo = async (video: Video) => {
    setSelectedVideo(video);
    setStreamInfo(null);
    setStreamError(null);

    const isUnlocked = video.is_free || accessStatus === 'purchased';
    if (!isUnlocked) {
      // Locked video -> display locked state in right panel
      return;
    }

    setLoadingStream(true);
    try {
      const res = await fetch(`/api/student/videos/${video.id}/play`);
      const data = await res.json();

      if (!res.ok) {
        setStreamError(data.error || 'Failed to load video source.');
        return;
      }

      setStreamInfo({
        url: data.url,
        embedUrl: data.embedUrl,
        format: data.format,
        downloadable: data.downloadable,
      });
    } catch (err) {
      console.error('Error playing video:', err);
      setStreamError('Network error while loading video stream.');
    } finally {
      setLoadingStream(false);
    }
  };

  // Auto select first free or playable video if none selected
  useEffect(() => {
    if (!selectedVideo && category.lessons?.length > 0) {
      const firstVid = category.lessons[0]?.videos?.[0];
      if (firstVid) {
        handleSelectVideo(firstVid);
      }
    }
  }, []);

  // Submit Purchase Reference
  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNumber.trim()) {
      setPurchaseError('Reference number is required.');
      return;
    }

    setSubmittingPurchase(true);
    setPurchaseError(null);

    try {
      let receiptPath: string | undefined = undefined;

      // Optional receipt file upload via presigned URL
      if (receiptFile) {
        const presignedRes = await fetch('/api/admin/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: receiptFile.name,
            fileType: receiptFile.type,
            prefix: 'receipts',
          }),
        });

        if (presignedRes.ok) {
          const { uploadUrl, key } = await presignedRes.json();
          const uploadResult = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': receiptFile.type },
            body: receiptFile,
          });
          if (uploadResult.ok) {
            receiptPath = key;
          }
        }
      }

      const res = await fetch(`/api/student/courses/${category.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference_number: refNumber.trim(),
          amount_paid: amountPaid,
          receipt_image_path: receiptPath,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAccessStatus('pending');
        setShowPurchaseSlideOver(false);
      } else {
        setPurchaseError(data.error || 'Failed to submit purchase.');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setPurchaseError('Error submitting purchase reference.');
    } finally {
      setSubmittingPurchase(false);
    }
  };

  const totalLessons = category.lessons?.length || 0;
  const totalVideos = category.lessons?.reduce((acc, l) => acc + (l.videos?.length || 0), 0) || 0;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#fdf9f2', fontFamily: "'Inter', sans-serif", color: '#24201a' }}>
      {/* LEFT PANEL (~40%, Scrollable) */}
      <div
        style={{
          width: '40%',
          minWidth: '340px',
          maxWidth: '520px',
          borderRight: '1px solid #ecdfc4',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          zIndex: 10,
        }}
      >
        {/* Header Bar */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #ecdfc4' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#e94f6b',
              fontSize: '0.85rem',
              fontWeight: '700',
              textDecoration: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              marginBottom: '0.75rem',
            }}
          >
            ← Back to Dashboard
          </Link>
          <h1
            style={{
              fontSize: '1.35rem',
              fontWeight: '700',
              color: '#24201a',
              margin: '0 0 0.25rem 0',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {category.name}
          </h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b6151' }}>
            {totalLessons} lessons • {totalVideos} videos
          </p>
        </div>

        {/* Purchase Banner Status */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #ecdfc4', backgroundColor: '#fdf9f2' }}>
          {accessStatus === 'purchased' && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#e6f8f3',
                border: '1px solid #05b98a',
                borderRadius: '8px',
                color: '#05b98a',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <span>✓</span> You have full lifetime access to this category
            </div>
          )}

          {accessStatus === 'pending' && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fff7e6',
                border: '1px solid #ffd166',
                borderRadius: '8px',
                color: '#b45309',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <span>⏳</span> Payment Under Review - Verification Pending
            </div>
          )}

          {accessStatus === 'none' && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #ecdfc4',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9a8e73', textTransform: 'uppercase', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Full Access
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#e94f6b', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {category.price} ETB
                </div>
              </div>
              <button
                onClick={() => setShowPurchaseSlideOver(true)}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#e94f6b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                }}
              >
                Purchase
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Lesson Accordion List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {category.lessons?.map((lesson, idx) => {
            const isOpen = Boolean(openLessons[lesson.id]);
            return (
              <div
                key={lesson.id}
                style={{
                  marginBottom: '0.75rem',
                  border: '1px solid #ecdfc4',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                }}
              >
                {/* Lesson Header */}
                <button
                  onClick={() => toggleLesson(lesson.id)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isOpen ? '#fdf9f2' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#e94f6b', fontFamily: "'Space Grotesk', sans-serif" }}>{idx + 1}.</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#24201a', fontFamily: "'Space Grotesk', sans-serif" }}>{lesson.name}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#9a8e73' }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Lesson Videos */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #ecdfc4' }}>
                    {lesson.videos?.map((vid) => {
                      const isSelected = selectedVideo?.id === vid.id;
                      const isUnlocked = vid.is_free || accessStatus === 'purchased';

                      return (
                        <div
                          key={vid.id}
                          onClick={() => handleSelectVideo(vid)}
                          style={{
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#fde8eb' : '#ffffff',
                            borderLeft: isSelected ? '4px solid #e94f6b' : '4px solid transparent',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '1rem' }}>{isUnlocked ? (isSelected ? '▶️' : '🎬') : '🔒'}</span>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: isSelected ? '700' : '600',
                                  color: isSelected ? '#e94f6b' : '#24201a',
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {vid.title}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b6151' }}>
                                {formatDuration(vid.duration_seconds)}
                              </div>
                            </div>
                          </div>

                          {vid.is_free && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: '700',
                                color: '#05b98a',
                                backgroundColor: '#e6f8f3',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontFamily: "'Space Grotesk', sans-serif",
                              }}
                            >
                              FREE
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL (~60%): Main Video Player Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#24201a',
          overflowY: 'auto',
        }}
      >
        {/* Player Container */}
        <div style={{ width: '100%', backgroundColor: '#1c1914', position: 'relative', aspectRatio: '16/9' }}>
          {!selectedVideo && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                textAlign: 'center',
                padding: '2rem',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎓</div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>Select a lesson to start watching</h3>
            </div>
          )}

          {selectedVideo && (
            <>
              {/* Case 1: Unlocked Video & Stream Ready */}
              {(selectedVideo.is_free || accessStatus === 'purchased') && (
                <>
                  {loadingStream ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                      ⏳ Loading video stream...
                    </div>
                  ) : streamError ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e94f6b', padding: '2rem', textAlign: 'center' }}>
                      {streamError}
                    </div>
                  ) : selectedVideo.source_type === 'embed' ? (
                    <iframe
                      src={formatEmbedUrl(streamInfo?.embedUrl || selectedVideo.embed_url)}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={streamInfo?.url}
                      controls
                      autoPlay
                      controlsList={selectedVideo.downloadable ? undefined : 'nodownload'}
                      onContextMenu={(e) => (!selectedVideo.downloadable ? e.preventDefault() : null)}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}
                </>
              )}

              {/* Case 2: Locked Video */}
              {!selectedVideo.is_free && accessStatus !== 'purchased' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(36, 32, 26, 0.94)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    padding: '2rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔒</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 0.5rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
                    This video module is locked
                  </h3>
                  <p style={{ color: '#9a8e73', fontSize: '0.95rem', maxWidth: '420px', margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
                    Purchase lifetime access to unlock all premium video tutorials and course materials.
                  </p>
                  <button
                    onClick={() => setShowPurchaseSlideOver(true)}
                    style={{
                      padding: '0.85rem 2rem',
                      backgroundColor: '#e94f6b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      fontFamily: "'Space Grotesk', sans-serif",
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                    }}
                  >
                    Purchase Course ({category.price} ETB)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Video Description & Course Meta Below Player */}
        {selectedVideo && (
          <div style={{ padding: '2rem', color: '#ffffff' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 0.5rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              {selectedVideo.title}
            </h2>
            {selectedVideo.description && (
              <p style={{ color: '#9a8e73', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
                {selectedVideo.description}
              </p>
            )}

            <hr style={{ borderColor: '#332d25', margin: '1.5rem 0' }} />

            <div style={{ color: '#9a8e73', fontSize: '0.9rem' }}>
              <strong style={{ color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif" }}>Category:</strong> {category.name}
            </div>
          </div>
        )}
      </div>

      {/* PURCHASE SLIDE-OVER DRAWER */}
      {showPurchaseSlideOver && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            backgroundColor: 'rgba(36, 32, 26, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowPurchaseSlideOver(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '-10px 0 25px rgba(0,0,0,0.15)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#24201a', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                  Complete Bank Transfer
                </h2>
                <button
                  onClick={() => setShowPurchaseSlideOver(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6b6151' }}
                >
                  ✕
                </button>
              </div>

              {/* CBE Bank Account Details Box */}
              <div
                style={{
                  backgroundColor: '#fdf9f2',
                  padding: '1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #ecdfc4',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#e94f6b', textTransform: 'uppercase', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Commercial Bank of Ethiopia (CBE)
                </div>
                <div style={{ fontSize: '0.9rem', color: '#24201a', marginBottom: '0.35rem' }}>
                  <strong>Account Name:</strong> {cbeAccountName}
                </div>
                <div style={{ fontSize: '1rem', color: '#24201a', fontFamily: 'monospace', fontWeight: '700' }}>
                  <strong>Account No:</strong> {cbeAccountNumber}
                </div>
              </div>

              <form onSubmit={handleSubmitPurchase}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                    Reference / Transaction Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FT240813XXXX"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #ecdfc4',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                    Amount Paid (ETB) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #ecdfc4',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                    Receipt Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    style={{
                      width: '100%',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                {purchaseError && (
                  <div style={{ padding: '0.85rem', backgroundColor: '#fde8eb', border: '1px solid #e94f6b', borderRadius: '8px', color: '#e94f6b', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '600' }}>
                    {purchaseError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingPurchase}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    backgroundColor: '#e94f6b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '1rem',
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: submittingPurchase ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                  }}
                >
                  {submittingPurchase ? 'Submitting...' : 'Submit Payment Reference'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

