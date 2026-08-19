'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CourseCardProps {
  id: string;
  name: string;
  description?: string | null;
  coverImagePath?: string | null;
  price: number;
  lessonCount?: number;
  videoCount?: number;
  completedVideos?: number;
  totalVideosCount?: number;
  progressStatus?: 'locked' | 'in_progress' | 'completed';
  position?: number;
  comingSoon?: boolean;
  isPurchased?: boolean;
  isPending?: boolean;
  targetUrl?: string;
}

export default function CourseCard({
  id,
  name,
  description,
  coverImagePath,
  price,
  lessonCount = 0,
  videoCount = 0,
  completedVideos = 0,
  totalVideosCount = 0,
  progressStatus,
  position = 1,
  comingSoon = false,
  isPurchased = false,
  isPending = false,
  targetUrl,
}: CourseCardProps) {
  const href = targetUrl || (comingSoon ? '#' : `/preview/${id}`);

  // Determine effective status
  let effectiveStatus: 'locked' | 'in_progress' | 'completed' | 'none' = 'none';
  if (progressStatus) {
    effectiveStatus = progressStatus;
  } else if (isPurchased) {
    if (completedVideos > 0 && totalVideosCount > 0 && completedVideos >= totalVideosCount) {
      effectiveStatus = 'completed';
    } else if (completedVideos > 0) {
      effectiveStatus = 'in_progress';
    }
  } else if (!isPending && !comingSoon) {
    effectiveStatus = 'locked';
  }

  const isCompleted = effectiveStatus === 'completed';
  const isInProgress = effectiveStatus === 'in_progress';
  const isLocked = effectiveStatus === 'locked';

  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        height: '100%',
        pointerEvents: comingSoon && !targetUrl ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          borderRadius: '0px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(25, 21, 16, 0.2)',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          height: '340px',
          position: 'relative',
          cursor: comingSoon && !targetUrl ? 'default' : 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!comingSoon || targetUrl) {
            e.currentTarget.style.borderColor = '#191510';
            const arrow = e.currentTarget.querySelector('.card-arrow') as HTMLElement;
            if (arrow) {
              if (isCompleted) {
                arrow.style.backgroundColor = '#3F6B4A';
                arrow.style.color = '#F7F3EA';
                arrow.style.borderColor = '#3F6B4A';
              } else if (isInProgress) {
                arrow.style.backgroundColor = '#C98A2E';
                arrow.style.color = '#F7F3EA';
                arrow.style.borderColor = '#C98A2E';
              } else {
                arrow.style.backgroundColor = '#A63A2C';
                arrow.style.color = '#F7F3EA';
                arrow.style.borderColor = '#A63A2C';
              }
            }
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(25, 21, 16, 0.2)';
          const arrow = e.currentTarget.querySelector('.card-arrow') as HTMLElement;
          if (arrow) {
            if (isCompleted) {
              arrow.style.backgroundColor = '#F7F3EA';
              arrow.style.color = '#3F6B4A';
              arrow.style.borderColor = '#3F6B4A';
            } else if (isInProgress) {
              arrow.style.backgroundColor = '#F7F3EA';
              arrow.style.color = '#C98A2E';
              arrow.style.borderColor = '#C98A2E';
            } else {
              arrow.style.backgroundColor = '#F7F3EA';
              arrow.style.color = '#191510';
              arrow.style.borderColor = 'rgba(25, 21, 16, 0.3)';
            }
          }
        }}
      >
        {/* Cover Image / Art Area (~55% height) */}
        <div
          style={{
            height: '55%',
            position: 'relative',
            backgroundColor: '#F7F3EA',
            borderBottom: '1px solid rgba(25, 21, 16, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {coverImagePath ? (
            <Image
              src={coverImagePath.startsWith('http') || coverImagePath.startsWith('/') ? coverImagePath : `/api/storage/presigned?path=${encodeURIComponent(coverImagePath)}`}
              alt={name}
              fill
              unoptimized
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                border: '1px solid #191510',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F7F3EA',
              }}
            >
              <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '1px solid rgba(25, 21, 16, 0.14)' }} />
              {isCompleted ? (
                <span style={{ fontSize: '1.1rem', color: '#191510' }}>✓</span>
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#191510' }}>▶</span>
              )}
            </div>
          )}

          {/* Status Badges Overlay (Top-Left) */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', zIndex: 2 }}>
            {comingSoon && (
              <span
                style={{
                  backgroundColor: '#191510',
                  color: '#F7F3EA',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '0px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Coming Soon
              </span>
            )}

            {isCompleted && (
              <span
                style={{
                  backgroundColor: '#3F6B4A',
                  color: '#F7F3EA',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '0px',
                  letterSpacing: '0.05em',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  textTransform: 'uppercase',
                }}
              >
                Completed
              </span>
            )}

            {isInProgress && (
              <span
                style={{
                  color: '#C98A2E',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: '-0.01em',
                }}
              >
                {completedVideos} / {totalVideosCount || videoCount} videos
              </span>
            )}

            {isPending && !isCompleted && !isInProgress && (
              <span
                style={{
                  backgroundColor: '#A63A2C',
                  color: '#F7F3EA',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '0px',
                  letterSpacing: '0.05em',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Pending
              </span>
            )}

            {isLocked && !comingSoon && (
              <span
                style={{
                  backgroundColor: '#191510',
                  color: '#F7F3EA',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
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

        {/* Bottom Panel (~45% height) */}
        <div
          style={{
            height: '45%',
            padding: '1.25rem 1.4rem',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <h3
              style={{
                margin: '0 0 0.35rem 0',
                fontSize: '1.2rem',
                fontWeight: '700',
                color: '#191510',
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: '1.25',
                letterSpacing: '-0.01em',
              }}
            >
              {name}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#9A9284', fontWeight: '400', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
              {videoCount > 0 ? ` • ${videoCount} videos` : ''}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid rgba(25, 21, 16, 0.12)',
            }}
          >
            {/* Clean Price or Progress Link */}
            {isCompleted ? (
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: '#3F6B4A',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Review →
              </span>
            ) : isInProgress ? (
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: '#C98A2E',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Continue →
              </span>
            ) : (
              <span
                style={{
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  color: '#A63A2C',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {price} ETB
              </span>
            )}

            {/* Square Arrow Button */}
            <div
              className="card-arrow"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '0px',
                border: isCompleted
                  ? '1px solid #3F6B4A'
                  : isInProgress
                  ? '1px solid #C98A2E'
                  : '1px solid rgba(25, 21, 16, 0.3)',
                backgroundColor: '#F7F3EA',
                color: isCompleted ? '#3F6B4A' : isInProgress ? '#C98A2E' : '#191510',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
