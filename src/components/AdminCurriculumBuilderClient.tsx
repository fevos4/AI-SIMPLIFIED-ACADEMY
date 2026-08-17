'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatEmbedUrl } from '@/lib/video-utils';

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  source_type: string;
  file_path: string | null;
  embed_url: string | null;
  thumbnail_path: string | null;
  format: string;
  is_free: boolean;
  downloadable: boolean;
  position: number;
  duration_seconds: number | null;
}

interface LessonItem {
  id: string;
  name: string;
  description: string | null;
  published: boolean;
  position: number;
  videos: VideoItem[];
}

interface CategoryData {
  id: string;
  name: string;
  price: number;
  position: number;
  lessons: LessonItem[];
}

interface AdminCurriculumBuilderProps {
  category: CategoryData;
}

export default function AdminCurriculumBuilderClient({ category: initialCategory }: AdminCurriculumBuilderProps) {
  const [category, setCategory] = useState<CategoryData>(initialCategory);
  
  // Lesson Form State
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [creatingLesson, setCreatingLesson] = useState(false);

  // Unpublish Modal Confirmation State
  const [unpublishTargetLesson, setUnpublishTargetLesson] = useState<LessonItem | null>(null);
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(null);

  // Video Form Per Lesson State
  const [activeSourceType, setActiveSourceType] = useState<Record<string, 'self_hosted' | 'embed'>>({});
  const [videoTitle, setVideoTitle] = useState<Record<string, string>>({});
  const [videoEmbedUrl, setVideoEmbedUrl] = useState<Record<string, string>>({});
  const [videoDuration, setVideoDuration] = useState<Record<string, string>>({});
  const [videoIsFree, setVideoIsFree] = useState<Record<string, boolean>>({});
  const [videoDownloadable, setVideoDownloadable] = useState<Record<string, boolean>>({});
  
  // File Upload State
  const [videoFile, setVideoFile] = useState<Record<string, File | null>>({});
  const [thumbnailFile, setThumbnailFile] = useState<Record<string, File | null>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatusText, setUploadStatusText] = useState<Record<string, string>>({});
  const [submittingVideo, setSubmittingVideo] = useState<Record<string, boolean>>({});
  const [videoError, setVideoError] = useState<Record<string, string | null>>({});

  const formatSecondsToMMSS = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parseMMSSToSeconds = (mmss: string): number | null => {
    if (!mmss || !mmss.trim()) return null;
    const parts = mmss.trim().split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      if (!isNaN(mins) && !isNaN(secs)) {
        return mins * 60 + secs;
      }
    } else if (parts.length === 1) {
      const secs = parseInt(parts[0], 10);
      if (!isNaN(secs)) return secs;
    }
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Quick refetch category lessons
  const refreshCurriculum = async () => {
    try {
      const res = await fetch(`/api/admin/lessons?categoryId=${category.id}`);
      if (res.ok) {
        const data = await res.json();
        setCategory((prev) => ({
          ...prev,
          lessons: data.lessons,
        }));
      }
    } catch {
      // Ignore background refetch failure
    }
  };

  // Add Lesson
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonName.trim()) return;

    setCreatingLesson(true);
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: category.id,
          name: newLessonName.trim(),
          description: newLessonDesc.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCategory((prev) => ({
          ...prev,
          lessons: [...prev.lessons, { ...data.lesson, videos: [] }],
        }));
        setNewLessonName('');
        setNewLessonDesc('');
      }
    } finally {
      setCreatingLesson(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (lesson: LessonItem, targetState: boolean) => {
    setTogglingPublishId(lesson.id);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: targetState }),
      });

      if (res.ok) {
        setCategory((prev) => ({
          ...prev,
          lessons: prev.lessons.map((l) => (l.id === lesson.id ? { ...l, published: targetState } : l)),
        }));
      }
    } finally {
      setTogglingPublishId(null);
      setUnpublishTargetLesson(null);
    }
  };

  // Upload File to Presigned URL with Progress
  const uploadFileWithProgress = (file: File, presignedUrl: string, lessonId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress((prev) => ({ ...prev, [lessonId]: percent }));
          setUploadStatusText((prev) => ({ ...prev, [lessonId]: `Uploading ${file.name}... ${percent}%` }));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error uploading file to storage'));
      xhr.send(file);
    });
  };

  // Handle Save Video
  const handleSaveVideo = async (lessonId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = videoTitle[lessonId] || '';
    const sourceType = activeSourceType[lessonId] || 'self_hosted';

    if (!title.trim()) {
      setVideoError((prev) => ({ ...prev, [lessonId]: 'Video title is required.' }));
      return;
    }

    setSubmittingVideo((prev) => ({ ...prev, [lessonId]: true }));
    setVideoError((prev) => ({ ...prev, [lessonId]: null }));
    setUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));

    try {
      let finalFilePath: string | null = null;
      let finalThumbnailPath: string | null = null;

      if (sourceType === 'self_hosted') {
        const vFile = videoFile[lessonId];
        if (!vFile) {
          setVideoError((prev) => ({ ...prev, [lessonId]: 'Please choose a video file to upload.' }));
          setSubmittingVideo((prev) => ({ ...prev, [lessonId]: false }));
          return;
        }

        // 1. Get Presigned URL for Video
        setUploadStatusText((prev) => ({ ...prev, [lessonId]: 'Requesting upload URL...' }));
        const presignedRes = await fetch('/api/admin/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: vFile.name, contentType: vFile.type }),
        });
        const presignedData = await presignedRes.json();

        if (!presignedRes.ok || !presignedData.uploadUrl) {
          throw new Error(presignedData.error || 'Failed to generate video upload URL.');
        }

        // 2. Upload Video to MinIO/B2
        await uploadFileWithProgress(vFile, presignedData.uploadUrl, lessonId);
        finalFilePath = presignedData.objectKey;

        // 3. Optional Thumbnail Upload
        const tFile = thumbnailFile[lessonId];
        if (tFile) {
          setUploadStatusText((prev) => ({ ...prev, [lessonId]: 'Uploading thumbnail image...' }));
          const tPresignedRes = await fetch('/api/admin/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: tFile.name, contentType: tFile.type }),
          });
          const tPresignedData = await tPresignedRes.json();

          if (tPresignedRes.ok && tPresignedData.uploadUrl) {
            await uploadFileWithProgress(tFile, tPresignedData.uploadUrl, lessonId);
            finalThumbnailPath = tPresignedData.objectKey;
          }
        }
      } else {
        // Embed URL Validation
        const embedUrl = videoEmbedUrl[lessonId] || '';
        if (!embedUrl.trim()) {
          setVideoError((prev) => ({ ...prev, [lessonId]: 'Please enter an embed URL.' }));
          setSubmittingVideo((prev) => ({ ...prev, [lessonId]: false }));
          return;
        }
      }

      // Create Video DB Record
      setUploadStatusText((prev) => ({ ...prev, [lessonId]: 'Saving video record...' }));
      const durationSeconds = parseMMSSToSeconds(videoDuration[lessonId] || '');

      const saveRes = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          category_id: category.id,
          title: title.trim(),
          source_type: sourceType,
          file_path: finalFilePath,
          embed_url: videoEmbedUrl[lessonId] ? formatEmbedUrl(videoEmbedUrl[lessonId]) : null,
          thumbnail_path: finalThumbnailPath,
          format: 'landscape',
          is_free: Boolean(videoIsFree[lessonId]),
          downloadable: Boolean(videoDownloadable[lessonId]),
          duration_seconds: durationSeconds,
        }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.error || 'Failed to save video record.');
      }

      // Clear Form Fields on Success
      setVideoTitle((prev) => ({ ...prev, [lessonId]: '' }));
      setVideoEmbedUrl((prev) => ({ ...prev, [lessonId]: '' }));
      setVideoDuration((prev) => ({ ...prev, [lessonId]: '' }));
      setVideoFile((prev) => ({ ...prev, [lessonId]: null }));
      setThumbnailFile((prev) => ({ ...prev, [lessonId]: null }));
      setUploadStatusText((prev) => ({ ...prev, [lessonId]: '' }));

      await refreshCurriculum();
    } catch (err: any) {
      setVideoError((prev) => ({ ...prev, [lessonId]: err.message || 'An error occurred uploading video.' }));
    } finally {
      setSubmittingVideo((prev) => ({ ...prev, [lessonId]: false }));
    }
  };

  return (
    <div style={{ backgroundColor: '#fdf9f2', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#24201a', padding: '2.5rem 2rem' }}>
      <main style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <Link
          href="/admin/categories"
          style={{
            color: '#e94f6b',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '1rem',
            textDecoration: 'none',
            fontWeight: '700',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.9rem',
          }}
        >
          ← Back to All Categories
        </Link>

        <header style={{ borderBottom: '1px solid #ecdfc4', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>
            {category.name} <span style={{ fontSize: '1.2rem', color: '#6b6151', fontWeight: '500' }}>(Curriculum Builder)</span>
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6b6151', fontSize: '0.95rem' }}>
            Price: <strong style={{ color: '#e94f6b' }}>{category.price} ETB</strong> | Position: {category.position}
          </p>
        </header>

        {/* Add Lesson Module Form */}
        <section
          style={{
            border: '1px solid #ecdfc4',
            borderRadius: '14px',
            padding: '1.75rem',
            marginBottom: '2.5rem',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1rem' }}>
            + Add Lesson Module to Category
          </h2>
          <form onSubmit={handleAddLesson} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '250px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                Lesson Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Module 1: Introduction to AI"
                value={newLessonName}
                onChange={(e) => setNewLessonName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #ecdfc4',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ flex: 3, minWidth: '300px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                Description
              </label>
              <input
                type="text"
                placeholder="Brief summary of topics covered in this lesson module"
                value={newLessonDesc}
                onChange={(e) => setNewLessonDesc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #ecdfc4',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={creatingLesson}
              style={{
                padding: '0.8rem 1.5rem',
                backgroundColor: '#e94f6b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.9rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: creatingLesson ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                textTransform: 'uppercase',
              }}
            >
              {creatingLesson ? 'Adding...' : 'Add Lesson'}
            </button>
          </form>
        </section>

        {/* Lessons & Videos Curriculum Tree */}
        <section>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem' }}>
            Lessons & Videos Curriculum Tree ({category.lessons.length} Modules)
          </h2>

          {category.lessons.map((lesson, idx) => {
            const isLessonPublished = lesson.published;
            const sourceType = activeSourceType[lesson.id] || 'self_hosted';

            return (
              <div
                key={lesson.id}
                style={{
                  border: '1px solid #ecdfc4',
                  borderRadius: '14px',
                  marginBottom: '1.75rem',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                }}
              >
                {/* Lesson Header with Status & Publish Toggle */}
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: '#fdf9f2',
                    borderBottom: '1px solid #ecdfc4',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a' }}>
                      {idx + 1}. {lesson.name}
                    </h3>

                    {/* STATUS BADGE */}
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        backgroundColor: isLessonPublished ? '#e6f8f3' : '#fff7e6',
                        color: isLessonPublished ? '#05b98a' : '#b45309',
                        border: `1px solid ${isLessonPublished ? '#05b98a' : '#ffd166'}`,
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        fontFamily: "'Space Grotesk', sans-serif",
                        letterSpacing: '0.5px',
                      }}
                    >
                      {isLessonPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#6b6151', fontWeight: '600', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {lesson.videos.length} Videos
                    </span>

                    {/* PUBLISH / UNPUBLISH ACTION BUTTON */}
                    {isLessonPublished ? (
                      <button
                        onClick={() => setUnpublishTargetLesson(lesson)}
                        disabled={togglingPublishId === lesson.id}
                        style={{
                          padding: '0.45rem 1rem',
                          backgroundColor: '#ffffff',
                          color: '#e94f6b',
                          border: '1px solid #e94f6b',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '0.82rem',
                          fontFamily: "'Space Grotesk', sans-serif",
                          cursor: 'pointer',
                        }}
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTogglePublish(lesson, true)}
                        disabled={togglingPublishId === lesson.id}
                        style={{
                          padding: '0.45rem 1rem',
                          backgroundColor: '#05b98a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '0.82rem',
                          fontFamily: "'Space Grotesk', sans-serif",
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                        }}
                      >
                        {togglingPublishId === lesson.id ? 'Publishing...' : 'Publish Lesson'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Videos List within Lesson */}
                <div style={{ padding: '1.5rem' }}>
                  {lesson.videos.length === 0 ? (
                    <p style={{ color: '#9a8e73', fontStyle: 'italic', margin: '0 0 1.25rem 0', fontSize: '0.9rem' }}>
                      No videos in this lesson module yet. Add a video below.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      {lesson.videos.map((vid, vIdx) => (
                        <div
                          key={vid.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #ecdfc4',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a', fontSize: '0.92rem' }}>
                              {vIdx + 1}. {vid.title}
                            </span>
                            {vid.duration_seconds && (
                              <span style={{ fontSize: '0.8rem', color: '#6b6151', fontWeight: '600' }}>
                                ({formatSecondsToMMSS(vid.duration_seconds)})
                              </span>
                            )}
                            <span
                              style={{
                                padding: '0.15rem 0.45rem',
                                backgroundColor: vid.is_free ? '#e6f8f3' : '#fde8eb',
                                color: vid.is_free ? '#05b98a' : '#e94f6b',
                                fontSize: '0.72rem',
                                borderRadius: '4px',
                                fontWeight: '700',
                                fontFamily: "'Space Grotesk', sans-serif",
                              }}
                            >
                              {vid.is_free ? 'FREE PREVIEW' : 'PAID'}
                            </span>
                            <span
                              style={{
                                padding: '0.15rem 0.45rem',
                                backgroundColor: '#fdf9f2',
                                border: '1px solid #ecdfc4',
                                color: '#6b6151',
                                fontSize: '0.72rem',
                                borderRadius: '4px',
                                fontWeight: '600',
                              }}
                            >
                              {vid.source_type.toUpperCase()} ({vid.format})
                            </span>
                          </div>

                          <div style={{ fontSize: '0.85rem', color: '#9a8e73' }}>
                            Pos: {vid.position}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SIMPLIFIED VIDEO ADD FORM PER LESSON */}
                  <div
                    style={{
                      padding: '1.25rem',
                      border: '1px dashed #ecdfc4',
                      backgroundColor: '#fdf9f2',
                      borderRadius: '10px',
                    }}
                  >
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a' }}>
                      + Add Video to {lesson.name}
                    </h4>

                    {/* TASK 3: SOURCE TYPE TOGGLE BUTTONS */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setActiveSourceType((prev) => ({ ...prev, [lesson.id]: 'self_hosted' }))}
                        style={{
                          padding: '0.5rem 1.25rem',
                          borderRadius: '8px',
                          border: '1px solid #ecdfc4',
                          backgroundColor: sourceType === 'self_hosted' ? '#24201a' : '#ffffff',
                          color: sourceType === 'self_hosted' ? '#ffffff' : '#24201a',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          fontFamily: "'Space Grotesk', sans-serif",
                          cursor: 'pointer',
                        }}
                      >
                        📁 Upload Video File
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSourceType((prev) => ({ ...prev, [lesson.id]: 'embed' }))}
                        style={{
                          padding: '0.5rem 1.25rem',
                          borderRadius: '8px',
                          border: '1px solid #ecdfc4',
                          backgroundColor: sourceType === 'embed' ? '#24201a' : '#ffffff',
                          color: sourceType === 'embed' ? '#ffffff' : '#24201a',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          fontFamily: "'Space Grotesk', sans-serif",
                          cursor: 'pointer',
                        }}
                      >
                        🔗 Embed URL (YouTube/Vimeo)
                      </button>
                    </div>

                    <form onSubmit={(e) => handleSaveVideo(lesson.id, e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Video Title */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#24201a', marginBottom: '0.35rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                          Video Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lesson 1.1: What is Generative AI?"
                          value={videoTitle[lesson.id] || ''}
                          onChange={(e) => setVideoTitle((prev) => ({ ...prev, [lesson.id]: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #ecdfc4',
                            fontSize: '0.92rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* CONDITIONAL RENDERING BASED ON SOURCE TYPE */}
                      {sourceType === 'self_hosted' ? (
                        <>
                          {/* TASK 2: Real File Upload Pickers */}
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#24201a', marginBottom: '0.35rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                                Choose Video File * (.mp4, .webm)
                              </label>
                              <input
                                type="file"
                                accept="video/*"
                                required
                                onChange={(e) => setVideoFile((prev) => ({ ...prev, [lesson.id]: e.target.files?.[0] || null }))}
                                style={{
                                  width: '100%',
                                  padding: '0.6rem',
                                  borderRadius: '8px',
                                  border: '1px solid #ecdfc4',
                                  backgroundColor: '#ffffff',
                                  fontSize: '0.85rem',
                                }}
                              />
                              {videoFile[lesson.id] && (
                                <div style={{ fontSize: '0.78rem', color: '#6b6151', marginTop: '0.25rem' }}>
                                  Selected: {videoFile[lesson.id]?.name} ({formatFileSize(videoFile[lesson.id]?.size || 0)})
                                </div>
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#24201a', marginBottom: '0.35rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                                Choose Thumbnail Image (Optional)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setThumbnailFile((prev) => ({ ...prev, [lesson.id]: e.target.files?.[0] || null }))}
                                style={{
                                  width: '100%',
                                  padding: '0.6rem',
                                  borderRadius: '8px',
                                  border: '1px solid #ecdfc4',
                                  backgroundColor: '#ffffff',
                                  fontSize: '0.85rem',
                                }}
                              />
                            </div>
                          </div>

                          {/* Duration MM:SS Input */}
                          <div style={{ maxWidth: '240px' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#24201a', marginBottom: '0.35rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                              Video Duration (MM:SS)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 12:30"
                              value={videoDuration[lesson.id] || ''}
                              onChange={(e) => setVideoDuration((prev) => ({ ...prev, [lesson.id]: e.target.value }))}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #ecdfc4',
                                fontSize: '0.92rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(videoIsFree[lesson.id])}
                                onChange={(e) => setVideoIsFree((prev) => ({ ...prev, [lesson.id]: e.target.checked }))}
                                style={{ width: '16px', height: '16px', accentColor: '#05b98a' }}
                              /> Free Preview Lesson
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(videoDownloadable[lesson.id])}
                                onChange={(e) => setVideoDownloadable((prev) => ({ ...prev, [lesson.id]: e.target.checked }))}
                                style={{ width: '16px', height: '16px', accentColor: '#e94f6b' }}
                              /> Allow Student Download
                            </label>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Embed URL Input */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#24201a', marginBottom: '0.35rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                              Embed URL * (e.g. YouTube / Vimeo)
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="https://www.youtube.com/embed/xyz..."
                              value={videoEmbedUrl[lesson.id] || ''}
                              onChange={(e) => setVideoEmbedUrl((prev) => ({ ...prev, [lesson.id]: e.target.value }))}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #ecdfc4',
                                fontSize: '0.92rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(videoIsFree[lesson.id])}
                              onChange={(e) => setVideoIsFree((prev) => ({ ...prev, [lesson.id]: e.target.checked }))}
                              style={{ width: '16px', height: '16px', accentColor: '#05b98a' }}
                            /> Free Preview Lesson
                          </label>
                        </>
                      )}

                      {/* UPLOAD PROGRESS BAR */}
                      {submittingVideo[lesson.id] && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#24201a', marginBottom: '0.35rem' }}>
                            {uploadStatusText[lesson.id] || 'Uploading...'}
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#ecdfc4', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${uploadProgress[lesson.id] || 0}%`,
                                height: '100%',
                                backgroundColor: '#05b98a',
                                transition: 'width 0.2s ease',
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* ERROR MESSAGE */}
                      {videoError[lesson.id] && (
                        <div style={{ padding: '0.75rem', backgroundColor: '#fde8eb', border: '1px solid #e94f6b', borderRadius: '8px', color: '#e94f6b', fontSize: '0.85rem', fontWeight: '600' }}>
                          {videoError[lesson.id]}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submittingVideo[lesson.id]}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#05b98a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '0.88rem',
                          fontFamily: "'Space Grotesk', sans-serif",
                          cursor: submittingVideo[lesson.id] ? 'not-allowed' : 'pointer',
                          marginLeft: 'auto',
                          boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {submittingVideo[lesson.id] ? 'Uploading & Saving...' : 'Save Video Lesson'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* CONFIRMATION DIALOG FOR UNPUBLISH */}
      {unpublishTargetLesson && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            backgroundColor: 'rgba(36, 32, 26, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setUnpublishTargetLesson(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '2rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              border: '1px solid #ecdfc4',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a' }}>
              Confirm Unpublish Lesson
            </h3>
            <p style={{ color: '#6b6151', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1.75rem 0' }}>
              Unpublishing this lesson will immediately hide it from all students, including those who have purchased this course. Are you sure?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setUnpublishTargetLesson(null)}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: '#ffffff',
                  color: '#6b6151',
                  border: '1px solid #ecdfc4',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleTogglePublish(unpublishTargetLesson, false)}
                disabled={togglingPublishId === unpublishTargetLesson.id}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: '#e94f6b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                }}
              >
                {togglingPublishId === unpublishTargetLesson.id ? 'Unpublishing...' : 'Yes, Unpublish Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
