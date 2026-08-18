'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatEmbedUrl } from '@/lib/video-utils';
import { Lock, Play, ArrowLeft, Check, Clock, X } from 'lucide-react';

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
  completed?: boolean;
  in_progress?: boolean;
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
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#FFFFFF', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      {/* LEFT PANEL (~40%, Scrollable) */}
      <div
        style={{
          width: '40%',
          minWidth: '340px',
          maxWidth: '520px',
          borderRight: '1px solid rgba(25, 21, 16, 0.14)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          zIndex: 10,
        }}
      >
        {/* Header Bar */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(25, 21, 16, 0.14)' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#191510',
              fontSize: '0.85rem',
              fontWeight: '500',
              textDecoration: 'none',
              fontFamily: "'IBM Plex Sans', sans-serif",
              marginBottom: '0.75rem',
            }}
          >
            <ArrowLeft width={14} height={14} color="#191510" />
            <span>Back to Dashboard</span>
          </Link>
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: '700',
              color: '#191510',
              margin: '0 0 0.25rem 0',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            {category.name}
          </h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#9A9284', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {totalLessons} lessons • {totalVideos} videos
          </p>
        </div>

        {/* Purchase Banner Status */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(25, 21, 16, 0.14)', backgroundColor: '#F7F3EA' }}>
          {accessStatus === 'purchased' && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#F7F3EA',
                border: '1.5px solid #191510',
                borderRadius: '0px',
                color: '#191510',
                fontWeight: '500',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <Check width={16} height={16} color="#191510" strokeWidth={2} />
              <span>You have full lifetime access to this category</span>
            </div>
          )}

          {accessStatus === 'pending' && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#F7F3EA',
                border: '1.5px solid #A63A2C',
                borderRadius: '0px',
                color: '#A63A2C',
                fontWeight: '500',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <Clock width={16} height={16} color="#A63A2C" strokeWidth={2} />
              <span>Payment Under Review - Verification Pending</span>
            </div>
          )}

          {accessStatus === 'none' && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: '#F7F3EA',
                border: '1px solid rgba(25, 21, 16, 0.14)',
                borderRadius: '0px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9A9284', textTransform: 'uppercase', fontWeight: '600', fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.05em' }}>
                  Full Access
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {category.price} ETB
                </div>
              </div>
              <button
                onClick={() => setShowPurchaseSlideOver(true)}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#191510',
                  color: '#F7F3EA',
                  border: 'none',
                  borderRadius: '0px',
                  fontWeight: '500',
                  fontSize: '0.85rem',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
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
                  border: '1px solid rgba(25, 21, 16, 0.14)',
                  borderRadius: '0px',
                  backgroundColor: '#F7F3EA',
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
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif" }}>{idx + 1}.</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>{lesson.name}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#191510' }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Lesson Videos */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(25, 21, 16, 0.14)' }}>
                    {lesson.videos?.map((vid, vIdx) => {
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
                            backgroundColor: isSelected ? '#191510' : '#F7F3EA',
                            color: isSelected ? '#F7F3EA' : '#191510',
                            borderBottom: vIdx < lesson.videos.length - 1 ? '1px solid rgba(25, 21, 16, 0.1)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                            {vid.completed ? (
                              <Check width={15} height={15} color={isSelected ? '#F7F3EA' : '#3F6B4A'} strokeWidth={2} style={{ flexShrink: 0 }} />
                            ) : isSelected || vid.in_progress ? (
                              <Play width={15} height={15} color={isSelected ? '#F7F3EA' : '#C98A2E'} strokeWidth={2} style={{ flexShrink: 0 }} />
                            ) : isUnlocked ? (
                              <Play width={15} height={15} color="#191510" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                            ) : (
                              <Lock width={15} height={15} color="#191510" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  color: isSelected ? '#F7F3EA' : '#191510',
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {vid.title}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: isSelected ? 'rgba(247, 243, 234, 0.7)' : '#9A9284', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                                {formatDuration(vid.duration_seconds)}
                              </div>
                            </div>
                          </div>

                          <div>
                            {vid.completed ? (
                              <span
                                style={{
                                  padding: '0.15rem 0.45rem',
                                  border: '1px solid #3F6B4A',
                                  color: isSelected ? '#F7F3EA' : '#3F6B4A',
                                  borderRadius: '0px',
                                  fontSize: '0.68rem',
                                  fontWeight: '600',
                                  fontFamily: "'IBM Plex Sans', sans-serif",
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                Completed
                              </span>
                            ) : isSelected || vid.in_progress ? (
                              <span
                                style={{
                                  padding: '0.15rem 0.45rem',
                                  border: '1px solid #C98A2E',
                                  color: isSelected ? '#F7F3EA' : '#C98A2E',
                                  borderRadius: '0px',
                                  fontSize: '0.68rem',
                                  fontWeight: '600',
                                  fontFamily: "'IBM Plex Sans', sans-serif",
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                In progress
                              </span>
                            ) : vid.is_free ? (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: '600',
                                  color: isSelected ? '#191510' : '#F7F3EA',
                                  backgroundColor: isSelected ? '#F7F3EA' : '#A63A2C',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '0px',
                                  fontFamily: "'IBM Plex Sans', sans-serif",
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                FREE
                              </span>
                            ) : null}
                          </div>
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
          backgroundColor: '#191510',
          color: '#F7F3EA',
          overflowY: 'auto',
        }}
      >
        {/* Player Container */}
        <div style={{ width: '100%', backgroundColor: '#000000', position: 'relative', aspectRatio: '16/9' }}>
          {!selectedVideo && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F7F3EA',
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: '#191510',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '1px solid #F7F3EA',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '1px solid rgba(247, 243, 234, 0.3)' }} />
                <Play width={22} height={22} color="#F7F3EA" strokeWidth={1.5} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>Select a lesson to start watching</h3>
            </div>
          )}

          {selectedVideo && (
            <>
              {/* Case 1: Unlocked Video & Stream Ready */}
              {(selectedVideo.is_free || accessStatus === 'purchased') && (
                <>
                  {loadingStream ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F7F3EA', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      Loading video stream...
                    </div>
                  ) : streamError ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A63A2C', padding: '2rem', textAlign: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
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
                    backgroundColor: '#191510',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F7F3EA',
                    padding: '2rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      border: '1px solid #F7F3EA',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '1px solid rgba(247, 243, 234, 0.3)' }} />
                    <Lock width={22} height={22} color="#F7F3EA" strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.5rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
                    This video module is locked
                  </h3>
                  <p style={{ color: '#9A9284', fontSize: '0.95rem', maxWidth: '420px', margin: '0 0 1.75rem 0', lineHeight: '1.6', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    Purchase lifetime access to unlock all premium video tutorials and course materials.
                  </p>
                  <button
                    onClick={() => setShowPurchaseSlideOver(true)}
                    style={{
                      padding: '0.9rem 2rem',
                      backgroundColor: '#A63A2C',
                      color: '#F7F3EA',
                      border: 'none',
                      borderRadius: '0px',
                      fontWeight: '500',
                      fontSize: '0.95rem',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
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
          <div style={{ padding: '2.5rem 2rem', color: '#F7F3EA' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '700', margin: '0 0 0.5rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
              {selectedVideo.title}
            </h2>
            {selectedVideo.description && (
              <p style={{ color: '#9A9284', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.75rem 0', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {selectedVideo.description}
              </p>
            )}

            <hr style={{ borderColor: 'rgba(247, 243, 234, 0.14)', margin: '1.75rem 0' }} />

            <div style={{ color: '#9A9284', fontSize: '0.9rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              <strong style={{ color: '#F7F3EA', fontFamily: "'Space Grotesk', sans-serif" }}>Category:</strong> {category.name}
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
            backgroundColor: 'rgba(25, 21, 16, 0.85)',
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
              backgroundColor: '#F7F3EA',
              color: '#191510',
              borderLeft: '1px solid rgba(25, 21, 16, 0.2)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
              boxSizing: 'border-box',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#191510', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                  Complete Bank Transfer
                </h2>
                <button
                  onClick={() => setShowPurchaseSlideOver(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#191510' }}
                >
                  <X width={20} height={20} color="#191510" />
                </button>
              </div>

              {/* CBE Bank Account Details Box */}
              <div
                style={{
                  backgroundColor: '#F7F3EA',
                  padding: '1.25rem',
                  borderRadius: '0px',
                  border: '1.5px solid #191510',
                  marginBottom: '1.75rem',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#A63A2C', textTransform: 'uppercase', marginBottom: '0.5rem', fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.05em' }}>
                  Commercial Bank of Ethiopia (CBE)
                </div>
                <div style={{ fontSize: '0.9rem', color: '#191510', marginBottom: '0.35rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  <strong>Account Name:</strong> {cbeAccountName}
                </div>
                <div style={{ fontSize: '1rem', color: '#191510', fontFamily: 'monospace', fontWeight: '700' }}>
                  <strong>Account No:</strong> {cbeAccountNumber}
                </div>
              </div>

              <form onSubmit={handleSubmitPurchase}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      padding: '0.85rem 1rem',
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

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Amount Paid (ETB) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
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

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Receipt Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    style={{
                      width: '100%',
                      fontSize: '0.85rem',
                      fontFamily: "'IBM Plex Sans', sans-serif",
                    }}
                  />
                </div>

                {purchaseError && (
                  <div style={{ padding: '0.85rem', backgroundColor: '#F7F3EA', border: '1.5px solid #A63A2C', borderRadius: '0px', color: '#A63A2C', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '500' }}>
                    {purchaseError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingPurchase}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    backgroundColor: '#191510',
                    color: '#F7F3EA',
                    border: 'none',
                    borderRadius: '0px',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: submittingPurchase ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s ease',
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
