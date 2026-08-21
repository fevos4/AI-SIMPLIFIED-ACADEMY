'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatEmbedUrl } from '@/lib/video-utils';
import { Lock, Play, ArrowLeft, Check, Clock, X, AlertTriangle, ChevronDown } from 'lucide-react';

// ─── Bank configuration (client-side mirror of server config) ────

type BankCode =
  | 'cbe' | 'boa' | 'telebirr' | 'mpesa' | 'cbebirr'
  | 'dashen' | 'awash' | 'siinqee' | 'kaafiebirr';

interface BankOption {
  code: BankCode;
  name: string;
  referenceLabel: string;
  requiresPhone: boolean;
  available: boolean;
  unavailableMessage?: string;
}

const BANKS: BankOption[] = [
  { code: 'cbe', name: 'Commercial Bank of Ethiopia (CBE)', referenceLabel: 'CBE Reference Number (FT...)', requiresPhone: false, available: true },
  { code: 'boa', name: 'Bank of Abyssinia (BOA)', referenceLabel: 'BOA Reference Number', requiresPhone: false, available: true },
  { code: 'telebirr', name: 'Telebirr', referenceLabel: 'Transaction Number', requiresPhone: false, available: false, unavailableMessage: 'Telebirr verification is currently unavailable due to an upstream issue from Ethio Telecom. Please use another payment method or wait for it to be restored.' },
  { code: 'mpesa', name: 'M-Pesa', referenceLabel: 'Transaction Number', requiresPhone: false, available: true },
  { code: 'cbebirr', name: 'CBE Birr', referenceLabel: 'Receipt Number', requiresPhone: true, available: true },
  { code: 'dashen', name: 'Dashen Bank', referenceLabel: 'Reference Number', requiresPhone: false, available: true },
  { code: 'awash', name: 'Awash Bank', referenceLabel: 'Reference Number', requiresPhone: false, available: true },
  { code: 'siinqee', name: 'Siinqee Bank', referenceLabel: 'Reference Number', requiresPhone: false, available: true },
  { code: 'kaafiebirr', name: 'Kaafi Ebirr', referenceLabel: 'Reference Number', requiresPhone: false, available: true },
];

// ─── Interfaces ──────────────────────────────────────────────────

interface Video {
  id: string;
  title: string;
  description?: string | null;
  source_type: string;
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
  coming_soon?: boolean;
  cover_image_path?: string | null;
  lessons: Lesson[];
}

interface CourseViewClientProps {
  category: Category;
  userAccessStatus: 'purchased' | 'pending' | 'rejected' | 'none';
  cbeAccountName: string;
  cbeAccountNumber: string;
  rejectionReason?: string | null;
  bankAccounts?: Array<{
    id: string;
    bank: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    phone_number: string | null;
    instructions: string | null;
    is_active: boolean;
  }>;
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
  rejectionReason: initialRejectionReason,
  bankAccounts,
}: CourseViewClientProps) {
  const [accessStatus, setAccessStatus] = useState<'purchased' | 'pending' | 'rejected' | 'none'>(initialAccessStatus);
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

  // Calculate available active banks
  const availableBanks = React.useMemo(() => {
    if (bankAccounts && bankAccounts.length > 0) {
      return bankAccounts
        .filter((acc) => acc.is_active)
        .map((acc) => {
          const config = BANKS.find((b) => b.code === acc.bank);
          return {
            code: acc.bank as BankCode,
            name: acc.bank_name || config?.name || acc.bank.toUpperCase(),
            referenceLabel: config?.referenceLabel || 'Reference / Transaction Number',
            requiresPhone: config?.requiresPhone || false,
            available: config?.available ?? true,
            unavailableMessage: config?.unavailableMessage,
            account: acc,
          };
        });
    }
    return BANKS.map((b) => ({
      ...b,
      account: {
        id: b.code,
        bank: b.code,
        bank_name: b.name,
        account_name: cbeAccountName,
        account_number: b.code === 'cbe' ? cbeAccountNumber : 'Contact Support',
        phone_number: null,
        instructions: null,
        is_active: true,
      },
    }));
  }, [bankAccounts, cbeAccountName, cbeAccountNumber]);

  // Slide-over purchase panel state
  const [showPurchaseSlideOver, setShowPurchaseSlideOver] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankCode | ''>('');
  const [refNumber, setRefNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState<string>(category.price.toString());
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(initialRejectionReason || null);

  const selectedBankConfig = availableBanks.find((b) => b.code === selectedBank) || BANKS.find((b) => b.code === selectedBank);
  const selectedAccountInfo = availableBanks.find((b) => b.code === selectedBank)?.account;

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
    setPurchaseError(null);
    setPurchaseSuccess(null);

    if (category.coming_soon) {
      setPurchaseError('This course is coming soon and is not currently open for purchase.');
      return;
    }

    // Validate bank selection
    if (!selectedBank) {
      setPurchaseError('Please select the bank you paid from.');
      return;
    }

    // Check bank availability
    if (selectedBankConfig && !selectedBankConfig.available) {
      setPurchaseError(selectedBankConfig.unavailableMessage || 'This bank is currently unavailable.');
      return;
    }

    if (!refNumber.trim()) {
      setPurchaseError('Reference/transaction number is required.');
      return;
    }

    // CBE Birr requires phone
    if (selectedBankConfig?.requiresPhone && !phoneNumber.trim()) {
      setPurchaseError('Phone number is required for CBE Birr.');
      return;
    }

    // Amount check
    const parsedAmount = parseFloat(amountPaid);
    if (isNaN(parsedAmount) || parsedAmount < category.price) {
      setPurchaseError(`Amount must be at least ${category.price} ETB.`);
      return;
    }

    setSubmittingPurchase(true);

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
          bank: selectedBank,
          reference_number: refNumber.trim(),
          phone_number: phoneNumber.trim() || undefined,
          amount_paid: amountPaid,
          receipt_image_path: receiptPath,
        }),
      });

      const data = await res.json();

      if (data.autoApproved) {
        // Auto-approved by verify.et!
        setAccessStatus('purchased');
        setPurchaseSuccess('Payment verified! Your course access has been unlocked instantly.');
        setTimeout(() => {
          setShowPurchaseSlideOver(false);
          setPurchaseSuccess(null);
        }, 3000);
      } else if (data.autoRejected) {
        // Auto-rejected by verify.et
        setRejectionReason(data.reason || 'Payment could not be verified.');
        setAccessStatus('rejected');
        setPurchaseError(data.reason || 'Payment could not be verified. Please check your details and try again.');
      } else if (data.success) {
        // Submitted for manual review
        setAccessStatus('pending');
        setPurchaseSuccess(data.message || 'Payment submitted for review. You will be notified when it is verified.');
        setTimeout(() => {
          setShowPurchaseSlideOver(false);
          setPurchaseSuccess(null);
        }, 3000);
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

  // Shared styles
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#191510',
    marginBottom: '0.4rem',
    fontFamily: "'IBM Plex Sans', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const inputStyle: React.CSSProperties = {
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
  };

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

          {accessStatus === 'rejected' && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#F7F3EA',
                border: '1.5px solid #A63A2C',
                borderRadius: '0px',
                color: '#A63A2C',
                fontWeight: '500',
                fontSize: '0.85rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: rejectionReason ? '0.5rem' : 0 }}>
                <AlertTriangle width={16} height={16} color="#A63A2C" strokeWidth={2} />
                <span>Payment Rejected</span>
              </div>
              {rejectionReason && (
                <div style={{ fontSize: '0.82rem', color: '#A63A2C', marginBottom: '0.75rem', paddingLeft: '1.6rem' }}>
                  {rejectionReason}
                </div>
              )}
              <button
                onClick={() => {
                  setShowPurchaseSlideOver(true);
                  setPurchaseError(null);
                  setPurchaseSuccess(null);
                }}
                style={{
                  padding: '0.45rem 1rem',
                  backgroundColor: '#A63A2C',
                  color: '#F7F3EA',
                  border: 'none',
                  borderRadius: '0px',
                  fontWeight: '500',
                  fontSize: '0.82rem',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Resubmit Payment
              </button>
            </div>
          )}

          {accessStatus === 'none' && (
            category.coming_soon ? (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: '#FAF8F5',
                  border: '1px dashed rgba(25, 21, 16, 0.25)',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: 0.8,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#9A9284', textTransform: 'uppercase', fontWeight: '600', fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.05em' }}>
                    Course Status
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#55503F', fontFamily: "'Space Grotesk', sans-serif" }}>
                    Coming Soon
                  </div>
                </div>
                <span
                  style={{
                    padding: '0.4rem 0.85rem',
                    backgroundColor: 'rgba(25, 21, 16, 0.06)',
                    color: '#9A9284',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Enrollment Closed
                </span>
              </div>
            ) : (
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
                  onClick={() => {
                    setShowPurchaseSlideOver(true);
                    setPurchaseError(null);
                    setPurchaseSuccess(null);
                  }}
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
            )
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
                    {category.coming_soon ? 'Course Coming Soon' : 'This video module is locked'}
                  </h3>
                  <p style={{ color: '#9A9284', fontSize: '0.95rem', maxWidth: '420px', margin: '0 0 1.75rem 0', lineHeight: '1.6', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    {category.coming_soon
                      ? 'This course is currently under development. Enrollment and video access will open soon.'
                      : 'Purchase lifetime access to unlock all premium video tutorials and course materials.'}
                  </p>
                  {category.coming_soon ? (
                    <button
                      disabled
                      style={{
                        padding: '0.9rem 2rem',
                        backgroundColor: 'rgba(247, 243, 234, 0.12)',
                        color: '#9A9284',
                        border: '1px solid rgba(247, 243, 234, 0.2)',
                        borderRadius: '0px',
                        fontWeight: '600',
                        fontSize: '0.92rem',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        cursor: 'not-allowed',
                      }}
                    >
                      Coming Soon — Enrollment Closed
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowPurchaseSlideOver(true);
                        setPurchaseError(null);
                        setPurchaseSuccess(null);
                      }}
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
                  )}
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

      {/* ═══════════════════════════════════════════════════════════
          PURCHASE SLIDE-OVER DRAWER (Bank-aware form)
          ═══════════════════════════════════════════════════════════ */}
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
              maxWidth: '520px',
              height: '100%',
              backgroundColor: '#F7F3EA',
              color: '#191510',
              borderLeft: '1px solid rgba(25, 21, 16, 0.2)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              boxSizing: 'border-box',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#191510', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                Complete Payment
              </h2>
              <button
                onClick={() => setShowPurchaseSlideOver(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#191510' }}
              >
                <X width={20} height={20} color="#191510" />
              </button>
            </div>

            {/* Success Message */}
            {purchaseSuccess && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#F7F3EA',
                  border: '1.5px solid #3F6B4A',
                  borderRadius: '0px',
                  color: '#3F6B4A',
                  fontSize: '0.88rem',
                  marginBottom: '1.25rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Check width={16} height={16} color="#3F6B4A" strokeWidth={2} />
                {purchaseSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitPurchase}>
              {/* ── Bank Selector ───────────────────────────────── */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>
                  Select Your Bank / Payment Method *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {availableBanks.map((bank) => {
                    const isActive = selectedBank === bank.code;
                    const isDisabled = !bank.available;

                    return (
                      <button
                        key={bank.code}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled) {
                            setSelectedBank(bank.code);
                            setPurchaseError(null);
                            setRefNumber('');
                            setPhoneNumber('');
                          }
                        }}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: '0px',
                          border: isActive ? '2px solid #191510' : '1.5px solid rgba(25, 21, 16, 0.2)',
                          backgroundColor: isActive ? '#191510' : isDisabled ? 'rgba(25, 21, 16, 0.05)' : '#F7F3EA',
                          color: isActive ? '#F7F3EA' : isDisabled ? '#9A9284' : '#191510',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          opacity: isDisabled ? 0.6 : 1,
                        }}
                      >
                        {bank.name}
                        {isDisabled && (
                          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: '400', color: '#A63A2C', marginTop: '0.15rem' }}>
                            Unavailable
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Bank Account Details Box (Updates dynamically when selected bank changes) */}
              {selectedBank && selectedAccountInfo && (
                <div
                  style={{
                    backgroundColor: '#F7F3EA',
                    padding: '1.25rem',
                    borderRadius: '0px',
                    border: '1.5px solid #191510',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#A63A2C', textTransform: 'uppercase', marginBottom: '0.6rem', fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.05em' }}>
                    Payment Details: {selectedAccountInfo.bank_name || selectedBankConfig?.name}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem', color: '#191510', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    {selectedAccountInfo.account_name && (
                      <div>
                        <span style={{ color: '#55503F', fontSize: '0.82rem' }}>Account Name: </span>
                        <strong>{selectedAccountInfo.account_name}</strong>
                      </div>
                    )}

                    <div>
                      <span style={{ color: '#55503F', fontSize: '0.82rem' }}>
                        {selectedBank === 'cbebirr' || selectedBank === 'telebirr' || selectedBank === 'mpesa'
                          ? 'Phone / Account No: '
                          : 'Account Number: '}
                      </span>
                      <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#191510', letterSpacing: '0.02em' }}>
                        {selectedAccountInfo.account_number}
                      </strong>
                    </div>

                    {selectedAccountInfo.phone_number && (
                      <div>
                        <span style={{ color: '#55503F', fontSize: '0.82rem' }}>Contact Phone: </span>
                        <strong style={{ fontFamily: 'monospace' }}>{selectedAccountInfo.phone_number}</strong>
                      </div>
                    )}

                    {selectedAccountInfo.instructions && (
                      <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(25, 21, 16, 0.1)', fontSize: '0.8rem', color: '#55503F' }}>
                        {selectedAccountInfo.instructions}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Telebirr unavailable warning */}
              {selectedBank === 'telebirr' && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: '#F7F3EA',
                    border: '1.5px solid #C98A2E',
                    borderRadius: '0px',
                    color: '#C98A2E',
                    fontSize: '0.82rem',
                    marginBottom: '1.25rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <AlertTriangle width={16} height={16} color="#C98A2E" strokeWidth={2} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <span>{BANKS.find((b) => b.code === 'telebirr')?.unavailableMessage}</span>
                </div>
              )}

              {/* ── Dynamic Reference Field ────────────────────── */}
              {selectedBank && selectedBank !== 'telebirr' && selectedBankConfig && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>
                    {selectedBankConfig.referenceLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={selectedBank === 'cbe' ? 'e.g. FT240813XXXX' : 'Enter reference number'}
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}

              {/* ── Phone Number (CBE Birr only) ────────────────── */}
              {selectedBank === 'cbebirr' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>
                    Your CBE Birr Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0911234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}

              {/* ── Amount Paid ─────────────────────────────────── */}
              {selectedBank && selectedBank !== 'telebirr' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>
                    Amount Paid (ETB) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}

              {/* ── Receipt Image ───────────────────────────────── */}
              {selectedBank && selectedBank !== 'telebirr' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>
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
              )}

              {/* ── Error Message ────────────────────────────────── */}
              {purchaseError && (
                <div style={{ padding: '0.85rem', backgroundColor: '#F7F3EA', border: '1.5px solid #A63A2C', borderRadius: '0px', color: '#A63A2C', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '500' }}>
                  {purchaseError}
                </div>
              )}

              {/* ── Submit Button ────────────────────────────────── */}
              {selectedBank && selectedBank !== 'telebirr' && (
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
                  {submittingPurchase ? 'Verifying Payment...' : 'Submit Payment Reference'}
                </button>
              )}
            </form>

            {/* Informational note */}
            {selectedBank && selectedBank !== 'telebirr' && (
              <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', backgroundColor: 'rgba(25, 21, 16, 0.04)', border: '1px solid rgba(25, 21, 16, 0.1)', fontSize: '0.78rem', color: '#9A9284', lineHeight: '1.5' }}>
                <strong style={{ color: '#191510' }}>How it works:</strong> Your payment will be verified automatically in seconds. If automatic verification isn&apos;t available, your payment will be queued for manual review and you&apos;ll be notified once it&apos;s approved.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
