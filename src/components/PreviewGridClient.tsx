'use client';

import React, { useState } from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import CourseCard from '@/components/CourseCard';
import Footer from '@/components/Footer';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  cover_image_path?: string | null;
  price: any;
  coming_soon: boolean;
  position: number;
  _count?: {
    lessons: number;
  };
}

interface PreviewGridClientProps {
  categories: Category[];
}

export default function PreviewGridClient({ categories }: PreviewGridClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ backgroundColor: '#F7F3EA', minHeight: '100vh', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <PublicNavbar />

      <main style={{ padding: '4rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header & Search Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '3.5rem',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#A63A2C',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            ALL COURSES & CATEGORIES
          </div>
          <h1
            style={{
              fontSize: '2.8rem',
              fontWeight: '700',
              color: '#191510',
              margin: '0 0 1rem 0',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            Explore AI Academy Catalog
          </h1>
          <p style={{ color: '#55503F', fontSize: '1.1rem', maxWidth: '600px', margin: '0 0 2rem 0', lineHeight: '1.6' }}>
            Browse our full catalog of structured AI categories. Select any category to preview lessons and sample free videos.
          </p>

          {/* Search Bar */}
          <div style={{ width: '100%', maxWidth: '540px', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '1.2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1rem',
                color: '#9A9284',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search courses by category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem 0.85rem 3.2rem',
                borderRadius: '0px',
                border: '1.5px solid #191510',
                fontSize: '0.95rem',
                outline: 'none',
                backgroundColor: '#F7F3EA',
                color: '#191510',
                fontFamily: "'IBM Plex Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              backgroundColor: '#F7F3EA',
              border: '1px solid rgba(25, 21, 16, 0.2)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔎</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#191510', margin: '0 0 0.5rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              No categories found
            </h3>
            <p style={{ color: '#55503F', margin: 0 }}>Try searching for a different course name or keyword.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {filteredCategories.map((cat, index) => (
              <CourseCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                description={cat.description}
                coverImagePath={cat.cover_image_path}
                price={Number(cat.price)}
                lessonCount={cat._count?.lessons || 0}
                position={index + 1}
                comingSoon={cat.coming_soon}
                targetUrl={`/preview/${cat.id}`}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
