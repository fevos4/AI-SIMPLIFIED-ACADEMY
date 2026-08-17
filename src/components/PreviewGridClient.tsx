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
    <div style={{ backgroundColor: '#fdf9f2', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#24201a' }}>
      <PublicNavbar />

      <main style={{ padding: '3.5rem 2.5rem', maxWidth: '1280px', margin: '0 auto' }}>
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
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#e94f6b',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            ALL COURSES & CATEGORIES
          </div>
          <h1
            style={{
              fontSize: '2.8rem',
              fontWeight: '700',
              color: '#24201a',
              margin: '0 0 1rem 0',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.5px',
            }}
          >
            Explore AI Academy Catalog
          </h1>
          <p style={{ color: '#6b6151', fontSize: '1.1rem', maxWidth: '600px', margin: '0 0 2rem 0', lineHeight: '1.5' }}>
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
                fontSize: '1.1rem',
                color: '#9a8e73',
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
                padding: '0.95rem 1.25rem 0.95rem 3.2rem',
                borderRadius: '8px',
                border: '1px solid #ecdfc4',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                transition: 'all 0.2s ease',
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
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #ecdfc4',
              boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#24201a', margin: '0 0 0.5rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
              No categories found
            </h3>
            <p style={{ color: '#6b6151', margin: 0 }}>Try searching for a different course name or keyword.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '2rem',
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
