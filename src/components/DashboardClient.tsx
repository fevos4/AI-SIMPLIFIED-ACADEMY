'use client';

import React, { useState } from 'react';
import CourseCard from '@/components/CourseCard';

interface CategoryCard {
  id: string;
  name: string;
  description: string | null;
  cover_image_path?: string | null;
  price: number;
  coming_soon: boolean;
  lessonCount: number;
  isPurchased: boolean;
  isPending: boolean;
}

interface DashboardClientProps {
  categories: CategoryCard[];
  userName: string;
}

export default function DashboardClient({ categories, userName }: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main style={{ padding: '2.5rem 2rem', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      {/* Header Greeting & Search Bar */}
      <header style={{ marginBottom: '2.5rem' }}>
        <h1
          style={{
            fontSize: '2.2rem',
            color: '#24201a',
            margin: '0 0 0.5rem 0',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: '700',
            letterSpacing: '-0.3px',
          }}
        >
          Welcome back, {userName}! 👋
        </h1>
        <p style={{ color: '#6b6151', margin: '0 0 1.75rem 0', fontSize: '1.05rem' }}>
          Explore course categories, manage purchases, and continue your AI learning journey.
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: '480px', position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9a8e73',
              fontSize: '1rem',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search categories by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.8rem',
              borderRadius: '8px',
              border: '1px solid #ecdfc4',
              fontSize: '0.95rem',
              outline: 'none',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </header>

      {/* Grid of Course Cards */}
      {filteredCategories.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #ecdfc4', boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔎</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#24201a', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>No matching courses</h3>
          <p style={{ color: '#6b6151', margin: 0 }}>Try clearing your search query.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {filteredCategories.map((cat, index) => (
            <CourseCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              description={cat.description}
              coverImagePath={cat.cover_image_path}
              price={cat.price}
              lessonCount={cat.lessonCount}
              position={index + 1}
              comingSoon={cat.coming_soon}
              isPurchased={cat.isPurchased}
              isPending={cat.isPending}
              targetUrl={`/courses/${cat.id}`}
            />
          ))}
        </div>
      )}
    </main>
  );
}
