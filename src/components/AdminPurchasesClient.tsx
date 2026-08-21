'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface PurchaseItem {
  id: string;
  status: string;
  reference_number: string;
  amount_claimed: number;
  receipt_image_path: string | null;
  receipt_url: string | null;
  rejection_reason: string | null;
  created_at: string;
  bank: string | null;
  auto_verified: boolean;
  verify_et_request_id: string | null;
  verification_status: string | null;
  user: {
    name: string;
    email: string;
  };
  category: {
    name: string;
    price: number;
  };
}

interface AdminPurchasesClientProps {
  initialPurchases: PurchaseItem[];
}

/** Map bank codes to human-readable names */
function getBankDisplayName(code: string | null): string {
  if (!code) return 'Unknown';
  const map: Record<string, string> = {
    cbe: 'CBE',
    boa: 'BOA',
    telebirr: 'Telebirr',
    mpesa: 'M-Pesa',
    cbebirr: 'CBE Birr',
    dashen: 'Dashen',
    awash: 'Awash',
    siinqee: 'Siinqee',
    kaafiebirr: 'Kaafi Ebirr',
  };
  return map[code] || code.toUpperCase();
}

export default function AdminPurchasesClient({ initialPurchases }: AdminPurchasesClientProps) {
  const [purchases, setPurchases] = useState<PurchaseItem[]>(initialPurchases);

  // Lightbox Modal State for Receipt Image
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingPurchase, setRejectingPurchase] = useState<PurchaseItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [submittingActionId, setSubmittingActionId] = useState<string | null>(null);

  // Handle Approve Payment
  const handleApprove = async (purchaseId: string) => {
    setSubmittingActionId(purchaseId);
    try {
      const res = await fetch(`/api/admin/purchases/${purchaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (res.ok) {
        setPurchases((prev) =>
          prev.map((p) => (p.id === purchaseId ? { ...p, status: 'verified' } : p))
        );
      } else {
        const data = await res.json();
        alert(`Failed to approve payment: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error approving payment: ${err.message}`);
    } finally {
      setSubmittingActionId(null);
    }
  };

  // Open Reject Modal
  const handleOpenReject = (purchase: PurchaseItem) => {
    setRejectingPurchase(purchase);
    setRejectionReason('');
    setRejectionError(null);
  };

  // Confirm Reject Payment
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPurchase) return;

    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required. Please explain why the payment was rejected.');
      return;
    }

    setSubmittingActionId(rejectingPurchase.id);
    setRejectionError(null);

    try {
      const res = await fetch(`/api/admin/purchases/${rejectingPurchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: rejectionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRejectionError(data.error || 'Failed to reject payment.');
        setSubmittingActionId(null);
        return;
      }

      setPurchases((prev) =>
        prev.map((p) =>
          p.id === rejectingPurchase.id
            ? { ...p, status: 'rejected', rejection_reason: rejectionReason.trim() }
            : p
        )
      );

      setRejectingPurchase(null);
      setRejectionReason('');
    } catch (err: any) {
      setRejectionError(err.message || 'Error rejecting payment.');
    } finally {
      setSubmittingActionId(null);
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '3.5rem 1.5rem', boxSizing: 'border-box' }}>
        <Link
          href="/admin"
          style={{
            color: '#191510',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '1rem',
            textDecoration: 'none',
            fontWeight: '500',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9rem',
          }}
        >
          ← Admin Dashboard
        </Link>
        <h1 style={{ marginBottom: '2.5rem', fontSize: '2.2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
          Payment Verification Queue
        </h1>

        <div style={{ overflowX: 'auto', border: '1px solid rgba(25, 21, 16, 0.14)', borderRadius: '0px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#FFFFFF', textAlign: 'left', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <thead>
              <tr style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid rgba(25, 21, 16, 0.14)' }}>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Category</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference #</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Receipt</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => {
                const isPending = p.status === 'pending_verification';
                const isVerified = p.status === 'verified';
                const isRejected = p.status === 'rejected';

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(25, 21, 16, 0.1)' }}>
                    {/* Student Info */}
                    <td style={{ padding: '1rem' }}>
                      <strong style={{ color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>{p.user.name}</strong><br />
                      <span style={{ fontSize: '0.85rem', color: '#9A9284' }}>{p.user.email}</span>
                    </td>

                    {/* Course Category */}
                    <td style={{ padding: '1rem', color: '#191510' }}>{p.category.name}</td>

                    {/* Bank */}
                    <td style={{ padding: '1rem', color: '#191510', fontSize: '0.85rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        backgroundColor: '#F7F3EA',
                        border: '1px solid rgba(25, 21, 16, 0.14)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                      }}>
                        {getBankDisplayName(p.bank)}
                      </span>
                    </td>

                    {/* Reference Number */}
                    <td style={{ padding: '1rem', fontFamily: "'Space Grotesk', monospace", fontWeight: '700', color: '#191510' }}>
                      {p.reference_number}
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '1rem', fontWeight: '700', color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {p.amount_claimed} ETB
                    </td>

                    {/* Payment Receipt Thumbnail & Section */}
                    <td style={{ padding: '1rem' }}>
                      {p.receipt_url ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6b6151', fontWeight: '500', textTransform: 'uppercase' }}>
                            Payment Receipt
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveReceiptUrl(p.receipt_url)}
                            style={{
                              padding: 0,
                              border: '1px solid rgba(25, 21, 16, 0.2)',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              width: '120px',
                              height: '90px',
                              backgroundColor: '#F7F3EA',
                              display: 'block',
                              position: 'relative',
                            }}
                            title="Click to view full receipt image"
                          >
                            <img
                              src={p.receipt_url}
                              alt={`Receipt for ${p.reference_number}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: '#9A9284', fontStyle: 'italic' }}>
                          No receipt uploaded
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '0px',
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            border: isVerified ? '1px solid #3F6B4A' : isPending ? '1px solid #C98A2E' : '1px solid #A63A2C',
                            color: isVerified ? '#3F6B4A' : isPending ? '#C98A2E' : '#A63A2C',
                            backgroundColor: '#FFFFFF',
                            display: 'inline-block',
                          }}
                        >
                          {isPending ? 'PENDING' : p.status.toUpperCase()}
                        </span>

                        {/* Auto-Verified Badge */}
                        {isVerified && p.auto_verified && (
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '0px',
                              fontSize: '0.68rem',
                              fontWeight: '600',
                              fontFamily: "'IBM Plex Sans', sans-serif",
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              backgroundColor: '#E8F5E9',
                              color: '#2E7D32',
                              border: '1px solid #2E7D32',
                              display: 'inline-block',
                            }}
                          >
                            ✓ Auto-Verified by verify.et
                          </span>
                        )}

                        {/* Pending with verify.et request */}
                        {isPending && p.verify_et_request_id && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#C98A2E',
                              fontWeight: '500',
                            }}
                          >
                            Pending verify.et result
                          </span>
                        )}

                        {/* Pending without verify.et request */}
                        {isPending && !p.verify_et_request_id && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#9A9284',
                              fontWeight: '500',
                            }}
                          >
                            Manual review required
                          </span>
                        )}

                        {isRejected && p.rejection_reason && (
                          <div style={{ fontSize: '0.78rem', color: '#A63A2C', marginTop: '0.1rem', maxWidth: '180px' }}>
                            Reason: {p.rejection_reason}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: '1rem' }}>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                          {/* Approve Button */}
                          <button
                            type="button"
                            disabled={submittingActionId === p.id}
                            onClick={() => handleApprove(p.id)}
                            style={{
                              padding: '0.45rem 0.9rem',
                              backgroundColor: '#191510',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '0px',
                              cursor: submittingActionId === p.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.82rem',
                              fontWeight: '500',
                              fontFamily: "'IBM Plex Sans', sans-serif",
                            }}
                          >
                            {submittingActionId === p.id ? 'Saving...' : 'Approve'}
                          </button>

                          {/* Outlined Danger Reject Button */}
                          <button
                            type="button"
                            disabled={submittingActionId === p.id}
                            onClick={() => handleOpenReject(p)}
                            style={{
                              padding: '0.45rem 0.9rem',
                              backgroundColor: 'transparent',
                              color: '#A63A2C',
                              border: '1px solid #A63A2C',
                              borderRadius: '0px',
                              cursor: submittingActionId === p.id ? 'not-allowed' : 'pointer',
                              fontSize: '0.82rem',
                              fontWeight: '600',
                              fontFamily: "'IBM Plex Sans', sans-serif",
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : isVerified && p.auto_verified ? (
                        <span style={{ color: '#3F6B4A', fontSize: '0.85rem', fontWeight: '500' }}>Auto-Verified</span>
                      ) : (
                        <span style={{ color: '#9A9284', fontSize: '0.85rem' }}>Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* LIGHTBOX MODAL FOR RECEIPT IMAGE */}
      {activeReceiptUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setActiveReceiptUrl(null)}
        >
          {/* Close Button (X) Top-Right */}
          <button
            type="button"
            onClick={() => setActiveReceiptUrl(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '2rem',
              cursor: 'pointer',
              lineHeight: 1,
              zIndex: 3001,
            }}
            title="Close Lightbox (Esc)"
          >
            ✕
          </button>

          {/* Centered Image Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '90vw',
              maxHeight: '85vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeReceiptUrl}
              alt="Full Size Payment Receipt"
              style={{
                maxWidth: '90vw',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: '4px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}
            />

            {/* Open in New Tab Link */}
            <a
              href={activeReceiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: '1rem',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: '500',
                textDecoration: 'underline',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Open original image in new tab ↗
            </a>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectingPurchase && (
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
          onClick={() => setRejectingPurchase(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: '#FFFFFF',
              borderRadius: '0px',
              padding: '2rem',
              border: '1.5px solid #191510',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510' }}>
              Reject Payment Verification
            </h3>
            <p style={{ color: '#55503F', fontSize: '0.9rem', margin: '0 0 1.25rem 0', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Rejecting payment for <strong>{rejectingPurchase.user.name}</strong> ({rejectingPurchase.category.name}, Ref #{rejectingPurchase.reference_number}).
            </p>

            <form onSubmit={handleConfirmReject} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Reference number not found, wrong amount, duplicate submission..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0px',
                    border: '1.5px solid #191510',
                    backgroundColor: '#FFFFFF',
                    color: '#191510',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {rejectionError && (
                <div style={{ color: '#A63A2C', fontSize: '0.85rem', fontWeight: '600' }}>
                  {rejectionError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRejectingPurchase(null)}
                  style={{
                    padding: '0.7rem 1.25rem',
                    backgroundColor: '#FFFFFF',
                    color: '#191510',
                    border: '1px solid #191510',
                    borderRadius: '0px',
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
                  disabled={submittingActionId === rejectingPurchase.id}
                  style={{
                    padding: '0.7rem 1.25rem',
                    backgroundColor: '#A63A2C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '0px',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: submittingActionId === rejectingPurchase.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingActionId === rejectingPurchase.id ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
