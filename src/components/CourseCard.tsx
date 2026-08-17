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
  position?: number;
  comingSoon?: boolean;
  isPurchased?: boolean;
  isPending?: boolean;
  targetUrl?: string;
}

// Soft pastel tints cycling pink/mint/yellow presets for category covers
const COVER_STYLES = [
  {
    bg: '#fde8eb', // soft pastel pink
    iconColor: '#e94f6b',
    icon: '🤖',
  },
  {
    bg: '#e6f8f3', // soft pastel mint
    iconColor: '#05b98a',
    icon: '⚡',
  },
  {
    bg: '#fff7e6', // soft pastel yellow
    iconColor: '#b45309',
    icon: '🧠',
  },
  {
    bg: '#fde8eb', // soft pastel pink
    iconColor: '#e94f6b',
    icon: '✨',
  },
];

export default function CourseCard({
  id,
  name,
  description,
  coverImagePath,
  price,
  lessonCount = 0,
  videoCount = 0,
  position = 1,
  comingSoon = false,
  isPurchased = false,
  isPending = false,
  targetUrl,
}: CourseCardProps) {
  const stylePreset = COVER_STYLES[(position - 1) % COVER_STYLES.length];
  const href = targetUrl || (comingSoon ? '#' : `/preview/${id}`);

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
          borderRadius: '14px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          border: '1px solid #ecdfc4',
          boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
          transition: 'all 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          height: '340px',
          position: 'relative',
          cursor: comingSoon && !targetUrl ? 'default' : 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!comingSoon || targetUrl) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(36, 32, 26, 0.08)';
            const arrow = e.currentTarget.querySelector('.card-arrow') as HTMLElement;
            if (arrow) {
              arrow.style.transform = 'translateX(3px)';
              arrow.style.backgroundColor = '#e94f6b';
              arrow.style.color = '#ffffff';
            }
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(36, 32, 26, 0.04)';
          const arrow = e.currentTarget.querySelector('.card-arrow') as HTMLElement;
          if (arrow) {
            arrow.style.transform = 'translateX(0)';
            arrow.style.backgroundColor = '#fdf9f2';
            arrow.style.color = '#24201a';
          }
        }}
      >
        {/* Cover Image / Art Area (~60% height) */}
        <div
          style={{
            height: '60%',
            position: 'relative',
            backgroundColor: stylePreset.bg,
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
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                border: '1px solid rgba(236, 223, 196, 0.8)',
              }}
            >
              {stylePreset.icon}
            </div>
          )}

          {/* Status Badges Overlay (Top-Left) */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', zIndex: 2 }}>
            {comingSoon && (
              <span
                style={{
                  backgroundColor: '#ffd166',
                  color: '#24201a',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Coming Soon
              </span>
            )}

            {isPurchased && (
              <span
                style={{
                  backgroundColor: '#05b98a',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  letterSpacing: '0.4px',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                ✓ Purchased
              </span>
            )}

            {isPending && (
              <span
                style={{
                  backgroundColor: '#e94f6b',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  letterSpacing: '0.4px',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                ⏳ Pending
              </span>
            )}

            {!isPurchased && !isPending && !comingSoon && (
              <span
                style={{
                  backgroundColor: 'rgba(36, 32, 26, 0.7)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🔒 Locked
              </span>
            )}
          </div>
        </div>

        {/* Bottom Panel (~40% height) */}
        <div
          style={{
            height: '40%',
            padding: '1.25rem 1.4rem',
            backgroundColor: '#ffffff',
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
                fontSize: '1.15rem',
                fontWeight: '700',
                color: '#24201a',
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: '1.25',
              }}
            >
              {name}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b6151', fontWeight: '500', fontFamily: "'Inter', sans-serif" }}>
              {lessonCount} {lessonCount === 1 ? 'Lesson' : 'Lessons'}
              {videoCount > 0 ? ` • ${videoCount} Videos` : ''}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid #ecdfc4',
            }}
          >
            {/* Clean Price */}
            <span
              style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#e94f6b',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {price} ETB
            </span>

            {/* Circular Arrow Button */}
            <div
              className="card-arrow"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #ecdfc4',
                backgroundColor: '#fdf9f2',
                color: '#24201a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
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
