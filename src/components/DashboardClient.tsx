'use client';

import React, { useState } from 'react';
import CourseCard from '@/components/CourseCard';
import { Search } from 'lucide-react';

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
    <main style={{ padding: '3.5rem 2.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      {/* Header Greeting & Search Bar */}
      <header style={{ marginBottom: '3rem' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            color: '#191510',
            margin: '0 0 0.6rem 0',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: '700',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome back, {userName}!
        </h1>
        <p style={{ color: '#55503F', margin: '0 0 2rem 0', fontSize: '1.05rem', fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: '1.5' }}>
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
              color: '#9A9284',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Search width={18} height={18} color="#9A9284" strokeWidth={1.75} />
          </span>
          <input
            type="text"
            placeholder="Search categories by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.8rem',
              borderRadius: '0px',
              border: '1px solid rgba(25, 21, 16, 0.2)',
              fontSize: '0.95rem',
              outline: 'none',
              backgroundColor: '#F7F3EA',
              color: '#191510',
              fontFamily: "'IBM Plex Sans', sans-serif",
              boxSizing: 'border-box',
            }}
          />
        </div>
      </header>

      {/* Grid of Course Cards */}
      {filteredCategories.length === 0 ? (
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#F7F3EA', borderRadius: '0px', border: '1px solid rgba(25, 21, 16, 0.14)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Search width={32} height={32} color="#9A9284" strokeWidth={1.5} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#191510', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>No matching courses</h3>
          <p style={{ color: '#55503F', margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>Try clearing your search query.</p>
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
