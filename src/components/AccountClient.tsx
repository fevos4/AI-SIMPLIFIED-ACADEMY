'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Purchase {
  id: string;
  categoryName: string;
  amountClaimed: number;
  status: 'pending_verification' | 'verified' | 'rejected';
  rejectionReason?: string | null;
  createdAt: string;
}

interface AccountClientProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  purchases: Purchase[];
}

export default function AccountClient({ user: initialUser, purchases }: AccountClientProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setUser((prev) => ({ ...prev, name: name.trim() }));
        setProfileMessage({ type: 'success', text: 'Name updated successfully.' });
        router.refresh();
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update name.' });
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <main style={{ padding: '2.5rem 2rem', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1
          style={{
            fontSize: '2.4rem',
            color: '#0f172a',
            margin: '0 0 0.5rem 0',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: '900',
          }}
        >
          Account Settings
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>
          Manage your personal details, security preferences, and purchase history.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 1: Personal Details */}
        <section
          style={{
            backgroundColor: '#ffffff',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          }}
        >
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1.25rem 0', fontFamily: "'Outfit', sans-serif" }}>
            Personal Details
          </h2>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Email Address (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {profileMessage && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  backgroundColor: profileMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: profileMessage.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${profileMessage.type === 'success' ? '#a7f3d0' : '#fca5a5'}`,
                }}
              >
                {profileMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '0.9rem',
                cursor: profileLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {profileLoading ? 'Updating...' : 'Save Profile'}
            </button>
          </form>
        </section>

        {/* Section 2: Change Password */}
        <section
          style={{
            backgroundColor: '#ffffff',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          }}
        >
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1.25rem 0', fontFamily: "'Outfit', sans-serif" }}>
            Change Password
          </h2>

          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {passwordMessage && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  backgroundColor: passwordMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: passwordMessage.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${passwordMessage.type === 'success' ? '#a7f3d0' : '#fca5a5'}`,
                }}
              >
                {passwordMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '0.9rem',
                cursor: passwordLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Section 3: Purchase History */}
        <section
          style={{
            backgroundColor: '#ffffff',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          }}
        >
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1.25rem 0', fontFamily: "'Outfit', sans-serif" }}>
            Purchase History
          </h2>

          {purchases.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>No purchase records found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: '700', color: '#0f172a' }}>{item.categoryName}</td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', fontWeight: '700', color: '#4F46E5' }}>{item.amountClaimed} ETB</td>
                      <td style={{ padding: '1rem' }}>
                        {item.status === 'verified' && (
                          <span style={{ padding: '0.25rem 0.65rem', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '800' }}>
                            ✓ Verified
                          </span>
                        )}
                        {item.status === 'pending_verification' && (
                          <span style={{ padding: '0.25rem 0.65rem', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '800' }}>
                            ⏳ Pending
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span style={{ padding: '0.25rem 0.65rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '800' }}>
                            ✕ Rejected
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                        {item.status === 'rejected' && item.rejectionReason ? (
                          <span style={{ color: '#dc2626' }}>Reason: {item.rejectionReason}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Logout Action Card */}
        <section
          style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem 2rem',
            borderRadius: '16px',
            border: '1px solid #fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '800', color: '#991b1b' }}>
              Sign Out
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
              End your active session on this device.
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </section>
      </div>
    </main>
  );
}
