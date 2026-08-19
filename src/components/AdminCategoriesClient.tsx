'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  position: number;
  coming_soon: boolean;
  cover_image_path: string | null;
  _count: { lessons: number };
}

interface AdminCategoriesClientProps {
  initialCategories: CategoryItem[];
}

export default function AdminCategoriesClient({ initialCategories }: AdminCategoriesClientProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [showForm, setShowForm] = useState(false);

  // New Category Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('500');
  const [comingSoon, setComingSoon] = useState(false);
  const [createCoverPath, setCreateCoverPath] = useState<string | null>(null);
  const [createProgress, setCreateProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Upload Cover Image State per category ID for list items
  const [editingCoverId, setEditingCoverId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<Record<string, string | null>>({});

  const getImageSrc = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return `/api/storage/presigned?path=${encodeURIComponent(path)}`;
  };

  const uploadFileDirect = (file: File, onProgress: (pct: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const urlRes = await fetch('/api/admin/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contentType: file.type || 'image/jpeg' }),
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok || !urlData.uploadUrl) {
          throw new Error(urlData.error || 'Failed to get presigned upload URL');
        }

        const xhr = new XMLHttpRequest();
        xhr.open('PUT', urlData.uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(urlData.objectKey);
          } else {
            reject(new Error(`Storage upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error uploading cover image'));
        xhr.send(file);
      } catch (err) {
        reject(err);
      }
    });
  };

  // Create Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price),
          coming_soon: comingSoon,
          cover_image_path: createCoverPath,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create category');
        setSubmitting(false);
        return;
      }

      setCategories((prev) => [...prev, { ...data.category, price: Number(data.category.price), _count: { lessons: 0 } }]);
      setName('');
      setDescription('');
      setPrice('500');
      setComingSoon(false);
      setCreateCoverPath(null);
      setCreateProgress(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred creating the category.');
    } finally {
      setSubmitting(false);
    }
  };

  // Upload Cover Image for Creation Form
  const handleCreateImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCreateProgress(0);
    try {
      const key = await uploadFileDirect(file, (pct) => setCreateProgress(pct));
      setCreateCoverPath(key);
    } catch (err: any) {
      alert(`Cover upload failed: ${err.message}`);
    } finally {
      setCreateProgress(null);
    }
  };

  // Upload/Replace Cover Image for Existing Category Item
  const handleCategoryCoverUpload = async (catId: string, file: File) => {
    setEditingCoverId(catId);
    setUploadError((prev) => ({ ...prev, [catId]: null }));
    setUploadProgress((prev) => ({ ...prev, [catId]: 0 }));

    try {
      const objectKey = await uploadFileDirect(file, (pct) => {
        setUploadProgress((prev) => ({ ...prev, [catId]: pct }));
      });

      // PATCH category with new cover_image_path (server automatically cleans up old file)
      const patchRes = await fetch(`/api/admin/categories/${catId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_image_path: objectKey }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        throw new Error(patchData.error || 'Failed to update category cover image');
      }

      // Update state immediately
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, cover_image_path: objectKey } : c))
      );
    } catch (err: any) {
      console.error('Error updating cover image:', err);
      setUploadError((prev) => ({ ...prev, [catId]: err.message || 'Failed to upload image' }));
    } finally {
      setEditingCoverId(null);
      setUploadProgress((prev) => ({ ...prev, [catId]: 0 }));
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <main style={{ flex: 1, maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '3.5rem 1.5rem', boxSizing: 'border-box' }}>
        {/* Header with Title and Toggle Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link
              href="/admin"
              style={{
                color: '#191510',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.4rem',
                textDecoration: 'none',
                fontWeight: '500',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.9rem',
              }}
            >
              ← Admin Dashboard
            </Link>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              Course Categories
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: showForm ? '#F7F3EA' : '#191510',
              color: showForm ? '#191510' : '#FFFFFF',
              border: '1.5px solid #191510',
              fontWeight: '600',
              fontSize: '0.88rem',
              fontFamily: "'IBM Plex Sans', sans-serif",
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {showForm ? '✕ Close Form' : '+ Create New Category'}
          </button>
        </div>

        {/* Create Category Section (Compact 2-Column Grid Layout) */}
        {showForm && (
          <section
            style={{
              border: '1.5px solid #191510',
              borderRadius: '0px',
              padding: '1.75rem 2rem',
              marginBottom: '3rem',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(25, 21, 16, 0.08)',
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: '1.25rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem', letterSpacing: '-0.01em', color: '#191510' }}>
              Create New Category
            </h2>

            <form onSubmit={handleCreateCategory}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                
                {/* Left Column: Form Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#191510', marginBottom: '0.35rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Physics - Grade 12"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '0px',
                        border: '1.5px solid #191510',
                        backgroundColor: '#FFFFFF',
                        color: '#191510',
                        fontSize: '0.92rem',
                        outline: 'none',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#191510', marginBottom: '0.35rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Short overview of what students will learn..."
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '0px',
                        border: '1.5px solid #191510',
                        backgroundColor: '#FFFFFF',
                        color: '#191510',
                        fontSize: '0.92rem',
                        outline: 'none',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#191510', marginBottom: '0.35rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Price (ETB) *
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '0px',
                          border: '1.5px solid #191510',
                          backgroundColor: '#FFFFFF',
                          color: '#191510',
                          fontSize: '0.92rem',
                          outline: 'none',
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.4rem' }}>
                      <input
                        type="checkbox"
                        id="create_coming_soon"
                        checked={comingSoon}
                        onChange={(e) => setComingSoon(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#191510' }}
                      />
                      <label htmlFor="create_coming_soon" style={{ fontWeight: '500', fontSize: '0.88rem', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Coming Soon
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Cover Image Upload Box */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#191510', marginBottom: '0.1rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Cover Image
                  </label>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '160px',
                        height: '110px',
                        border: '1px dashed rgba(25, 21, 16, 0.35)',
                        backgroundColor: '#F7F3EA',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      {createCoverPath ? (
                        <img
                          src={getImageSrc(createCoverPath)!}
                          alt="Cover Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#9A9284', textAlign: 'center', padding: '0.4rem' }}>
                          No cover image selected
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      <label
                        style={{
                          padding: '0.55rem 0.95rem',
                          backgroundColor: '#F7F3EA',
                          color: '#191510',
                          border: '1px solid #191510',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: '500',
                          display: 'inline-block',
                          textAlign: 'center',
                        }}
                      >
                        {createCoverPath ? 'Change Image' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleCreateImageSelect}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {createProgress !== null && (
                        <div style={{ fontSize: '0.78rem', color: '#A63A2C', fontWeight: '500' }}>
                          Uploading... {createProgress}%
                        </div>
                      )}

                      {createCoverPath && (
                        <button
                          type="button"
                          onClick={() => setCreateCoverPath(null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#A63A2C',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {errorMsg && (
                <div style={{ color: '#A63A2C', fontSize: '0.85rem', fontWeight: '500', marginBottom: '1rem' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(25, 21, 16, 0.1)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '0.7rem 1.25rem',
                    backgroundColor: '#FFFFFF',
                    color: '#191510',
                    border: '1px solid #191510',
                    fontWeight: '500',
                    fontSize: '0.88rem',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.7rem 1.5rem',
                    backgroundColor: '#191510',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Existing Categories List */}
        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
            Existing Categories ({categories.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {categories.map((cat) => {
              const hasCover = Boolean(cat.cover_image_path);
              const isUploadingThis = editingCoverId === cat.id;
              const pct = uploadProgress[cat.id] || 0;
              const err = uploadError[cat.id];

              return (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid rgba(25, 21, 16, 0.14)',
                    borderRadius: '0px',
                    backgroundColor: '#FFFFFF',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Category Cover Image Preview Thumbnail (~200x130px) */}
                  <div
                    style={{
                      width: '200px',
                      height: '130px',
                      borderRadius: '0px',
                      border: '1px solid rgba(25, 21, 16, 0.2)',
                      backgroundColor: '#F7F3EA',
                      position: 'relative',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {hasCover ? (
                      <img
                        src={getImageSrc(cat.cover_image_path)!}
                        alt={cat.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#9A9284', textAlign: 'center', padding: '0.5rem' }}>
                        No cover image
                      </span>
                    )}

                    {isUploadingThis && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(25, 21, 16, 0.75)',
                          color: '#F7F3EA',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        <div>Uploading... {pct}%</div>
                        <div style={{ width: '80%', height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#A63A2C' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info + Upload Actions */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510' }}>
                      {cat.name}
                      {cat.coming_soon && (
                        <span
                          style={{
                            marginLeft: '0.6rem',
                            padding: '0.15rem 0.5rem',
                            backgroundColor: '#191510',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            borderRadius: '0px',
                            fontWeight: '500',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Coming Soon
                        </span>
                      )}
                    </h3>

                    <p style={{ margin: '0 0 0.85rem 0', color: '#55503F', fontSize: '0.88rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      Price: <strong style={{ color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif" }}>{Number(cat.price)} ETB</strong> | Lessons: {cat._count.lessons}
                    </p>

                    {/* Upload Cover Image Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                      <label
                        style={{
                          padding: '0.45rem 0.9rem',
                          backgroundColor: '#F7F3EA',
                          color: '#191510',
                          border: '1px solid #191510',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span>📷</span>
                        <span>{hasCover ? 'Replace Cover Image' : 'Upload Cover Image'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          disabled={isUploadingThis}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCategoryCoverUpload(cat.id, file);
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {err && (
                        <span style={{ fontSize: '0.8rem', color: '#A63A2C', fontWeight: '500' }}>
                          {err}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navigation Action */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link
                      href={`/admin/categories/${cat.id}`}
                      style={{
                        padding: '0.65rem 1.25rem',
                        backgroundColor: '#191510',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        borderRadius: '0px',
                        fontWeight: '500',
                        fontSize: '0.85rem',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                      }}
                    >
                      Manage Curriculum ({cat._count.lessons})
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
