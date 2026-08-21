'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatEmbedUrl } from '@/lib/video-utils';
import { Edit3, X, Check, AlertCircle } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  description?: string | null;
  price: number;
  position: number;
  coming_soon?: boolean;
  cover_image_path?: string | null;
  lessons: LessonItem[];
}

interface AdminCurriculumBuilderProps {
  category: CategoryData;
}

// Helper: Format Seconds to MM:SS
const formatSecondsToMMSS = (seconds: number | null) => {
  if (seconds === null || seconds === undefined) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper: Parse MM:SS to Seconds
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

// Helper: Image Presigned URL
const getImageSrc = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `/api/storage/presigned?path=${encodeURIComponent(path)}`;
};

// Helper: File Size Format
const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper: Direct Upload to Presigned PUT URL with Progress
const uploadFileWithProgress = (file: File, presignedUrl: string, onProgress: (pct: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
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

/* =========================================================================
   SORTABLE VIDEO ITEM COMPONENT (WITH INLINE EDIT FORM)
   ========================================================================= */
interface SortableVideoRowProps {
  video: VideoItem;
  lessonId: string;
  vIdx: number;
  editingVideoId: string | null;
  setEditingVideoId: (id: string | null) => void;
  onVideoUpdated: (updatedVideo: VideoItem) => void;
}

function SortableVideoRow({
  video,
  lessonId,
  vIdx,
  editingVideoId,
  setEditingVideoId,
  onVideoUpdated,
}: SortableVideoRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id });

  const isEditing = editingVideoId === video.id;

  // Edit Video Form State
  const [editTitle, setEditTitle] = useState(video.title);
  const [editDesc, setEditDesc] = useState(video.description || '');
  const [editDuration, setEditDuration] = useState(formatSecondsToMMSS(video.duration_seconds) || '');
  const [editIsFree, setEditIsFree] = useState(video.is_free);
  const [editFormat, setEditFormat] = useState(video.format || 'landscape');
  const [editDownloadable, setEditDownloadable] = useState(video.downloadable);
  const [editEmbedUrl, setEditEmbedUrl] = useState(video.embed_url || '');

  // File replacement state
  const [replaceVideoFile, setReplaceVideoFile] = useState<File | null>(null);
  const [editUploadProgress, setEditUploadProgress] = useState<number | null>(null);
  const [editUploadStatus, setEditUploadStatus] = useState<string>('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.15)' : undefined,
    border: isEditing ? '2px solid #191510' : '1px solid #ecdfc4',
    borderRadius: '8px',
    backgroundColor: isDragging ? '#f7f3ea' : '#ffffff',
    marginBottom: '0.75rem',
  };

  const handleStartEdit = () => {
    setEditTitle(video.title);
    setEditDesc(video.description || '');
    setEditDuration(formatSecondsToMMSS(video.duration_seconds) || '');
    setEditIsFree(video.is_free);
    setEditFormat(video.format || 'landscape');
    setEditDownloadable(video.downloadable);
    setEditEmbedUrl(video.embed_url || '');
    setReplaceVideoFile(null);
    setEditUploadProgress(null);
    setEditError(null);
    setEditingVideoId(video.id);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError('Title is required');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);
    setEditUploadProgress(null);

    try {
      let finalFilePath = video.file_path;

      // Handle video file replacement if self_hosted & new file picked
      if (video.source_type === 'self_hosted' && replaceVideoFile) {
        setEditUploadStatus('Requesting presigned upload URL...');
        const presignedRes = await fetch('/api/admin/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: replaceVideoFile.name, contentType: replaceVideoFile.type }),
        });
        const presignedData = await presignedRes.json();
        if (!presignedRes.ok || !presignedData.uploadUrl) {
          throw new Error(presignedData.error || 'Failed to get upload URL for video replacement');
        }

        setEditUploadStatus(`Uploading new video ${replaceVideoFile.name}...`);
        await uploadFileWithProgress(replaceVideoFile, presignedData.uploadUrl, (pct) => {
          setEditUploadProgress(pct);
        });

        finalFilePath = presignedData.objectKey;
      }

      const durationSecs = parseMMSSToSeconds(editDuration);
      const formattedEmbed = video.source_type === 'embed' && editEmbedUrl ? formatEmbedUrl(editEmbedUrl) : null;

      const patchRes = await fetch(`/api/admin/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim() || null,
          duration_seconds: durationSecs,
          is_free: editIsFree,
          format: editFormat,
          downloadable: editDownloadable,
          file_path: finalFilePath,
          embed_url: formattedEmbed,
        }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        throw new Error(patchData.error || 'Failed to save video changes');
      }

      onVideoUpdated(patchData.video);
      setEditingVideoId(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to edit video');
    } finally {
      setEditSubmitting(false);
      setEditUploadProgress(null);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Video Row Display Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Drag Handle ⠿ */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: 'grab',
              padding: '0.2rem 0.4rem',
              color: '#9a8e73',
              fontSize: '1.2rem',
              lineHeight: 1,
              userSelect: 'none',
            }}
            title="Drag to reorder video"
          >
            ⠿
          </div>

          <span style={{ fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a', fontSize: '0.92rem' }}>
            {video.title}
          </span>

          {video.duration_seconds && (
            <span style={{ fontSize: '0.8rem', color: '#6b6151', fontWeight: '600' }}>
              ({formatSecondsToMMSS(video.duration_seconds)})
            </span>
          )}

          <span
            style={{
              padding: '0.15rem 0.45rem',
              backgroundColor: video.is_free ? '#e6f8f3' : '#fde8eb',
              color: video.is_free ? '#05b98a' : '#e94f6b',
              fontSize: '0.72rem',
              borderRadius: '4px',
              fontWeight: '700',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {video.is_free ? 'FREE PREVIEW' : 'PAID'}
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
            {video.source_type.toUpperCase()} ({video.format})
          </span>
        </div>

        <button
          type="button"
          onClick={isEditing ? () => setEditingVideoId(null) : handleStartEdit}
          style={{
            padding: '0.35rem 0.75rem',
            backgroundColor: isEditing ? '#24201a' : '#fdf9f2',
            color: isEditing ? '#ffffff' : '#24201a',
            border: '1px solid #191510',
            borderRadius: '4px',
            fontSize: '0.78rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {isEditing ? 'Close' : '✎ Edit'}
        </button>
      </div>

      {/* TASK 3: INLINE VIDEO EDIT FORM */}
      {isEditing && (
        <form
          onSubmit={handleSaveEdit}
          style={{
            padding: '1.25rem',
            borderTop: '1px solid #ecdfc4',
            backgroundColor: '#fcfaf6',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510' }}>
            Editing Video: {video.title}
          </h4>

          {/* Title & Duration */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '220px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#191510' }}>
                Video Title *
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  border: '1px solid #191510',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#191510' }}>
                Duration (MM:SS)
              </label>
              <input
                type="text"
                placeholder="e.g. 12:30"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  border: '1px solid #191510',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#191510' }}>
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '0.65rem',
                border: '1px solid #191510',
                borderRadius: '4px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Source Type Specific Editing */}
          {video.source_type === 'self_hosted' ? (
            <div style={{ padding: '0.85rem', backgroundColor: '#ffffff', border: '1px solid #ecdfc4', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6b6151', marginBottom: '0.6rem' }}>
                Current video file: <strong style={{ color: '#191510' }}>{video.file_path ? video.file_path.split('/').pop() : 'None'}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#191510' }}>
                  Replace Video File (Optional)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setReplaceVideoFile(e.target.files?.[0] || null)}
                  style={{ fontSize: '0.85rem' }}
                />
                {replaceVideoFile && (
                  <span style={{ fontSize: '0.78rem', color: '#05b98a', fontWeight: '600' }}>
                    New file selected: {replaceVideoFile.name} ({formatFileSize(replaceVideoFile.size)})
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#191510' }}>
                Embed URL (YouTube/Vimeo)
              </label>
              <input
                type="text"
                value={editEmbedUrl}
                onChange={(e) => setEditEmbedUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  border: '1px solid #191510',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Toggles: is_free, format, downloadable */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editIsFree}
                onChange={(e) => setEditIsFree(e.target.checked)}
                style={{ accentColor: '#05b98a' }}
              />
              Free Preview
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editDownloadable}
                onChange={(e) => setEditDownloadable(e.target.checked)}
                style={{ accentColor: '#e94f6b' }}
              />
              Downloadable
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>
              <span>Format:</span>
              <select
                value={editFormat}
                onChange={(e) => setEditFormat(e.target.value)}
                style={{ padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid #191510' }}
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
          </div>

          {/* Progress / Status */}
          {editSubmitting && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#191510', marginBottom: '0.2rem' }}>
                {editUploadStatus || 'Saving changes...'}
              </div>
              {editUploadProgress !== null && (
                <div style={{ width: '100%', height: '6px', backgroundColor: '#ecdfc4', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${editUploadProgress}%`, height: '100%', backgroundColor: '#05b98a' }} />
                </div>
              )}
            </div>
          )}

          {editError && (
            <div style={{ color: '#A63A2C', fontSize: '0.85rem', fontWeight: '600' }}>
              {editError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setEditingVideoId(null)}
              disabled={editSubmitting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ffffff',
                color: '#6b6151',
                border: '1px solid #191510',
                borderRadius: '4px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={editSubmitting}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#191510',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: editSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* =========================================================================
   SORTABLE LESSON ITEM COMPONENT
   ========================================================================= */
interface SortableLessonRowProps {
  lesson: LessonItem;
  lIdx: number;
  togglingPublishId: string | null;
  setUnpublishTargetLesson: (lesson: LessonItem | null) => void;
  handleTogglePublish: (lesson: LessonItem, targetState: boolean) => void;
  children: React.ReactNode;
}

function SortableLessonRow({
  lesson,
  lIdx,
  togglingPublishId,
  setUnpublishTargetLesson,
  handleTogglePublish,
  children,
}: SortableLessonRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });

  const isLessonPublished = lesson.published;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    boxShadow: isDragging ? '0 10px 24px rgba(0,0,0,0.15)' : undefined,
    border: '1px solid #ecdfc4',
    borderRadius: '14px',
    marginBottom: '1.75rem',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Lesson Header */}
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
          {/* Drag Handle ⠿ */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: 'grab',
              padding: '0.2rem 0.5rem',
              color: '#9a8e73',
              fontSize: '1.4rem',
              lineHeight: 1,
              userSelect: 'none',
            }}
            title="Drag to reorder lesson"
          >
            ⠿
          </div>

          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a' }}>
            {lesson.name}
          </h3>

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
              }}
            >
              {togglingPublishId === lesson.id ? 'Publishing...' : 'Publish Lesson'}
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

/* =========================================================================
   MAIN CURRICULUM BUILDER CLIENT COMPONENT
   ========================================================================= */
export default function AdminCurriculumBuilderClient({ category: initialCategory }: AdminCurriculumBuilderProps) {
  const [category, setCategory] = useState<CategoryData>(initialCategory);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Cover Image Header Upload State
  const [uploadingCategoryCover, setUploadingCategoryCover] = useState(false);
  const [categoryCoverPct, setCategoryCoverPct] = useState<number | null>(null);

  // Lesson Form State
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [creatingLesson, setCreatingLesson] = useState(false);

  // Unpublish Modal Confirmation State
  const [unpublishTargetLesson, setUnpublishTargetLesson] = useState<LessonItem | null>(null);
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(null);

  // Active Video Edit State
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  // Add Video Form Per Lesson State
  const [activeSourceType, setActiveSourceType] = useState<Record<string, 'self_hosted' | 'embed'>>({});
  const [videoTitle, setVideoTitle] = useState<Record<string, string>>({});
  const [videoEmbedUrl, setVideoEmbedUrl] = useState<Record<string, string>>({});
  const [videoDuration, setVideoDuration] = useState<Record<string, string>>({});
  const [videoIsFree, setVideoIsFree] = useState<Record<string, boolean>>({});
  const [videoDownloadable, setVideoDownloadable] = useState<Record<string, boolean>>({});

  // File Upload State for Video Addition
  const [videoFile, setVideoFile] = useState<Record<string, File | null>>({});
  const [thumbnailFile, setThumbnailFile] = useState<Record<string, File | null>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatusText, setUploadStatusText] = useState<Record<string, string>>({});
  const [submittingVideo, setSubmittingVideo] = useState<Record<string, boolean>>({});
  const [videoError, setVideoError] = useState<Record<string, string | null>>({});

  // Category Price & Details Edit State
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [editPriceInput, setEditPriceInput] = useState(String(category.price));
  const [editNameInput, setEditNameInput] = useState(category.name);
  const [editDescInput, setEditDescInput] = useState(category.description || '');
  const [savingCategoryDetails, setSavingCategoryDetails] = useState(false);
  const [priceModalError, setPriceModalError] = useState<string | null>(null);
  const [priceModalSuccess, setPriceModalSuccess] = useState<string | null>(null);

  const handleOpenPriceModal = () => {
    setEditPriceInput(String(category.price));
    setEditNameInput(category.name);
    setEditDescInput(category.description || '');
    setPriceModalError(null);
    setPriceModalSuccess(null);
    setShowEditPriceModal(true);
  };

  const handleSavePriceAndDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameInput.trim()) {
      setPriceModalError('Course name is required');
      return;
    }
    const numPrice = Number(editPriceInput);
    if (isNaN(numPrice) || numPrice < 0) {
      setPriceModalError('Please enter a valid price (>= 0 ETB)');
      return;
    }

    setSavingCategoryDetails(true);
    setPriceModalError(null);

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editNameInput.trim(),
          description: editDescInput.trim() || null,
          price: numPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update category price');
      }

      setCategory((prev) => ({
        ...prev,
        name: editNameInput.trim(),
        description: editDescInput.trim() || null,
        price: numPrice,
      }));

      setPriceModalSuccess('Course price and details updated successfully!');
      setTimeout(() => {
        setShowEditPriceModal(false);
        setPriceModalSuccess(null);
      }, 1200);
    } catch (err: any) {
      setPriceModalError(err.message || 'Error updating price');
    } finally {
      setSavingCategoryDetails(false);
    }
  };

  // TASK 1: Category Header Cover Image Upload
  const handleCategoryHeaderCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCategoryCover(true);
    setCategoryCoverPct(0);

    try {
      const presignedRes = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'image/jpeg' }),
      });
      const presignedData = await presignedRes.json();
      if (!presignedRes.ok || !presignedData.uploadUrl) {
        throw new Error(presignedData.error || 'Failed to get upload URL');
      }

      await uploadFileWithProgress(file, presignedData.uploadUrl, (pct) => setCategoryCoverPct(pct));

      // PATCH category (server handler automatically cleans up old file)
      const patchRes = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_image_path: presignedData.objectKey }),
      });

      if (!patchRes.ok) {
        throw new Error('Failed to update category cover image');
      }

      setCategory((prev) => ({ ...prev, cover_image_path: presignedData.objectKey }));
    } catch (err: any) {
      alert(`Cover upload failed: ${err.message}`);
    } finally {
      setUploadingCategoryCover(false);
      setCategoryCoverPct(null);
    }
  };

  // TASK 2: Lesson Drag and Drop Reordering
  const handleLessonDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = category.lessons.findIndex((l) => l.id === active.id);
    const newIndex = category.lessons.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedLessons = arrayMove(category.lessons, oldIndex, newIndex).map((l, idx) => ({
      ...l,
      position: idx + 1,
    }));

    // Optimistic UI update
    setCategory((prev) => ({ ...prev, lessons: reorderedLessons }));

    // Send PATCH for affected lessons
    try {
      await Promise.all(
        reorderedLessons.map((l) =>
          fetch(`/api/admin/lessons/${l.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: l.position }),
          })
        )
      );
    } catch (err) {
      console.error('Failed to sync lesson positions with server:', err);
    }
  };

  // TASK 2: Video Drag and Drop Reordering within Lesson
  const handleVideoDragEnd = async (lessonId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const lesson = category.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    const oldIndex = lesson.videos.findIndex((v) => v.id === active.id);
    const newIndex = lesson.videos.findIndex((v) => v.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedVideos = arrayMove(lesson.videos, oldIndex, newIndex).map((v, idx) => ({
      ...v,
      position: idx + 1,
    }));

    // Optimistic UI update
    setCategory((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) => (l.id === lessonId ? { ...l, videos: reorderedVideos } : l)),
    }));

    // Send PATCH for affected videos
    try {
      await Promise.all(
        reorderedVideos.map((v) =>
          fetch(`/api/admin/videos/${v.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: v.position }),
          })
        )
      );
    } catch (err) {
      console.error('Failed to sync video positions with server:', err);
    }
  };

  // Handle Video Updated via Edit Form
  const handleVideoUpdated = (updatedVideo: VideoItem) => {
    setCategory((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) => ({
        ...l,
        videos: l.videos.map((v) => (v.id === updatedVideo.id ? updatedVideo : v)),
      })),
    }));
  };

  // Add Lesson Handler
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
          position: category.lessons.length + 1,
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

  // Handle Save New Video Lesson
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

        await uploadFileWithProgress(vFile, presignedData.uploadUrl, (pct) => {
          setUploadProgress((prev) => ({ ...prev, [lessonId]: pct }));
          setUploadStatusText((prev) => ({ ...prev, [lessonId]: `Uploading ${vFile.name}... ${pct}%` }));
        });
        finalFilePath = presignedData.objectKey;

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
            await uploadFileWithProgress(tFile, tPresignedData.uploadUrl, (pct) => {
              setUploadStatusText((prev) => ({ ...prev, [lessonId]: `Uploading thumbnail... ${pct}%` }));
            });
            finalThumbnailPath = tPresignedData.objectKey;
          }
        }
      } else {
        const embedUrl = videoEmbedUrl[lessonId] || '';
        if (!embedUrl.trim()) {
          setVideoError((prev) => ({ ...prev, [lessonId]: 'Please enter an embed URL.' }));
          setSubmittingVideo((prev) => ({ ...prev, [lessonId]: false }));
          return;
        }
      }

      const durationSeconds = parseMMSSToSeconds(videoDuration[lessonId] || '');
      const lessonObj = category.lessons.find((l) => l.id === lessonId);
      const nextPos = lessonObj ? lessonObj.videos.length + 1 : 1;

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
          position: nextPos,
          duration_seconds: durationSeconds,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveData.error || 'Failed to save video record.');
      }

      // Add newly created video to state
      setCategory((prev) => ({
        ...prev,
        lessons: prev.lessons.map((l) =>
          l.id === lessonId ? { ...l, videos: [...l.videos, saveData.video] } : l
        ),
      }));

      // Clear Form Fields
      setVideoTitle((prev) => ({ ...prev, [lessonId]: '' }));
      setVideoEmbedUrl((prev) => ({ ...prev, [lessonId]: '' }));
      setVideoDuration((prev) => ({ ...prev, [lessonId]: '' }));
      setVideoFile((prev) => ({ ...prev, [lessonId]: null }));
      setThumbnailFile((prev) => ({ ...prev, [lessonId]: null }));
      setUploadStatusText((prev) => ({ ...prev, [lessonId]: '' }));
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
            color: '#191510',
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

        {/* TASK 1: Header Section with Cover Image Thumbnail Preview & Upload */}
        <header
          style={{
            borderBottom: '1px solid #ecdfc4',
            paddingBottom: '1.5rem',
            marginBottom: '2.5rem',
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>
              {category.name} <span style={{ fontSize: '1.2rem', color: '#6b6151', fontWeight: '500' }}>(Curriculum Builder)</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, color: '#6b6151', fontSize: '0.95rem' }}>
                Price: <strong style={{ color: '#A63A2C', fontSize: '1.05rem' }}>{category.price} ETB</strong> | Modules: {category.lessons.length}
              </p>
              <button
                type="button"
                onClick={handleOpenPriceModal}
                style={{
                  padding: '0.3rem 0.75rem',
                  backgroundColor: '#ffffff',
                  color: '#191510',
                  border: '1px solid #191510',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <Edit3 width={12} height={12} />
                <span>Edit Course Price</span>
              </button>
            </div>
          </div>

          {/* Cover Image Upload Area */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div
              style={{
                width: '180px',
                height: '115px',
                borderRadius: '8px',
                border: '1px solid #ecdfc4',
                backgroundColor: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {category.cover_image_path ? (
                <img
                  src={getImageSrc(category.cover_image_path)!}
                  alt={category.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#9a8e73', textAlign: 'center', padding: '0.5rem' }}>
                  No cover image
                </span>
              )}

              {uploadingCategoryCover && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(36, 32, 26, 0.8)',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                  }}
                >
                  <div>Uploading... {categoryCoverPct}%</div>
                </div>
              )}
            </div>

            <label
              style={{
                padding: '0.55rem 1rem',
                backgroundColor: '#191510',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.82rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>📷</span>
              <span>{category.cover_image_path ? 'Change Cover Image' : 'Upload Cover Image'}</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                disabled={uploadingCategoryCover}
                onChange={handleCategoryHeaderCoverUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
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
                backgroundColor: '#191510',
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

        {/* TASK 2: Lessons & Videos Curriculum Tree with Drag-and-Drop Reordering */}
        <section>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem' }}>
            Lessons & Videos Curriculum Tree ({category.lessons.length} Modules)
          </h2>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
            <SortableContext items={category.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {category.lessons.map((lesson, lIdx) => {
                const sourceType = activeSourceType[lesson.id] || 'self_hosted';

                return (
                  <SortableLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    lIdx={lIdx}
                    togglingPublishId={togglingPublishId}
                    setUnpublishTargetLesson={setUnpublishTargetLesson}
                    handleTogglePublish={handleTogglePublish}
                  >
                    {/* Videos List within Lesson */}
                    <div style={{ padding: '1.5rem' }}>
                      {lesson.videos.length === 0 ? (
                        <p style={{ color: '#9a8e73', fontStyle: 'italic', margin: '0 0 1.25rem 0', fontSize: '0.9rem' }}>
                          No videos in this lesson module yet. Add a video below.
                        </p>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleVideoDragEnd(lesson.id, e)}
                        >
                          <SortableContext items={lesson.videos.map((v) => v.id)} strategy={verticalListSortingStrategy}>
                            <div style={{ marginBottom: '1.5rem' }}>
                              {lesson.videos.map((vid, vIdx) => (
                                <SortableVideoRow
                                  key={vid.id}
                                  video={vid}
                                  lessonId={lesson.id}
                                  vIdx={vIdx}
                                  editingVideoId={editingVideoId}
                                  setEditingVideoId={setEditingVideoId}
                                  onVideoUpdated={handleVideoUpdated}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}

                      {/* VIDEO ADD FORM PER LESSON */}
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

                        {/* SOURCE TYPE TOGGLE BUTTONS */}
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
                              backgroundColor: '#191510',
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
                  </SortableLessonRow>
                );
              })}
            </SortableContext>
          </DndContext>
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

      {/* EDIT PRICE & DETAILS MODAL */}
      {showEditPriceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            backgroundColor: 'rgba(25, 21, 16, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => !savingCategoryDetails && setShowEditPriceModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              padding: '2rem',
              border: '1.5px solid #191510',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #ecdfc4', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#191510' }}>
                Edit Course Price &amp; Details
              </h3>
              <button
                type="button"
                onClick={() => setShowEditPriceModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#191510', padding: '0.25rem' }}
              >
                <X width={20} height={20} />
              </button>
            </div>

            {priceModalSuccess && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#E8F5E9',
                  border: '1.5px solid #2E7D32',
                  color: '#2E7D32',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '4px',
                }}
              >
                <Check width={16} height={16} strokeWidth={2.5} />
                <span>{priceModalSuccess}</span>
              </div>
            )}

            {priceModalError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#F7F3EA',
                  border: '1.5px solid #A63A2C',
                  color: '#A63A2C',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '4px',
                }}
              >
                <AlertCircle width={16} height={16} />
                <span>{priceModalError}</span>
              </div>
            )}

            <form onSubmit={handleSavePriceAndDetails} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Course Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#191510', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1.5px solid #191510',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Price */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#A63A2C', textTransform: 'uppercase' }}>
                    Course Price (ETB) *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#6b6151' }}>
                    Verify.et checks against this amount
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={editPriceInput}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #A63A2C',
                    borderRadius: '4px',
                    backgroundColor: '#FAF8F5',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#6b6151', marginTop: '0.35rem' }}>
                  Students must pay at least this amount for verify.et to automatically approve enrollment.
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#191510', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editDescInput}
                  onChange={(e) => setEditDescInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1.5px solid #191510',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #ecdfc4', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  disabled={savingCategoryDetails}
                  onClick={() => setShowEditPriceModal(false)}
                  style={{
                    padding: '0.7rem 1.25rem',
                    backgroundColor: '#FFFFFF',
                    color: '#191510',
                    border: '1px solid #191510',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    cursor: savingCategoryDetails ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategoryDetails}
                  style={{
                    padding: '0.7rem 1.5rem',
                    backgroundColor: '#191510',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: savingCategoryDetails ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingCategoryDetails ? 'Saving...' : 'Save Price & Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
