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

  // Active Sessions State
  const [sessions, setSessions] = useState<Array<{
    id: string;
    device_hint: string | null;
    ip_address: string | null;
    created_at: string;
    last_used_at: string;
    is_current: boolean;
  }>>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsMessage, setSessionsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSessions = React.useCallback(async () => {
    try {
      const res = await fetch('/api/user/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error('Failed to fetch sessions', e);
    }
  }, []);

  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSingleSession = async (sessionId: string) => {
    setSessionsLoading(true);
    setSessionsMessage(null);
    try {
      const res = await fetch(`/api/user/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessionsMessage({ type: 'success', text: 'Device logged out successfully.' });
        fetchSessions();
      } else {
        const data = await res.json();
        setSessionsMessage({ type: 'error', text: data.error || 'Failed to revoke session.' });
      }
    } catch {
      setSessionsMessage({ type: 'error', text: 'An error occurred while revoking session.' });
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setSessionsLoading(true);
    setSessionsMessage(null);
    try {
      const res = await fetch('/api/user/sessions', { method: 'DELETE' });
      if (res.ok) {
        setSessionsMessage({ type: 'success', text: 'All other devices logged out successfully.' });
        fetchSessions();
      } else {
        const data = await res.json();
        setSessionsMessage({ type: 'error', text: data.error || 'Failed to revoke other sessions.' });
      }
    } catch {
      setSessionsMessage({ type: 'error', text: 'An error occurred while revoking other sessions.' });
    } finally {
      setSessionsLoading(false);
    }
  };

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
    <main style={{ padding: '3.5rem 2.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <header style={{ marginBottom: '3rem' }}>
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
          ACCOUNT & SECURITY
        </div>
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
          Account Settings
        </h1>
        <p style={{ color: '#55503F', margin: 0, fontSize: '1.05rem', fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: '1.5' }}>
          Manage your personal details, security credentials, active device sessions, and purchase history.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 1: Personal Details */}
        <section
          style={{
            backgroundColor: '#F7F3EA',
            padding: '2rem',
            borderRadius: '0px',
            border: '1px solid rgba(25, 21, 16, 0.14)',
          }}
        >
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#191510', margin: '0 0 1.25rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
            Personal Details
          </h2>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#55503F', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email Address (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0px',
                    border: '1px solid rgba(25, 21, 16, 0.2)',
                    backgroundColor: '#FFFFFF',
                    color: '#55503F',
                    fontSize: '0.95rem',
                    opacity: 0.8,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {profileMessage && (
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '0px',
                  fontSize: '0.88rem',
                  marginBottom: '1.25rem',
                  fontWeight: '500',
                  backgroundColor: '#FFFFFF',
                  color: profileMessage.type === 'success' ? '#3F6B4A' : '#A63A2C',
                  border: `1.5px solid ${profileMessage.type === 'success' ? '#3F6B4A' : '#A63A2C'}`,
                }}
              >
                {profileMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              style={{
                padding: '0.85rem 1.75rem',
                backgroundColor: '#191510',
                color: '#F7F3EA',
                border: 'none',
                borderRadius: '0px',
                fontWeight: '600',
                fontSize: '0.9rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: profileLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              {profileLoading ? 'Updating...' : 'Save Profile'}
            </button>
          </form>
        </section>

        {/* Section 2: Change Password */}
        <section
          style={{
            backgroundColor: '#F7F3EA',
            padding: '2rem',
            borderRadius: '0px',
            border: '1px solid rgba(25, 21, 16, 0.14)',
          }}
        >
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#191510', margin: '0 0 1.25rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
            Change Password
          </h2>

          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
            </div>

            {passwordMessage && (
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '0px',
                  fontSize: '0.88rem',
                  marginBottom: '1.25rem',
                  fontWeight: '500',
                  backgroundColor: '#FFFFFF',
                  color: passwordMessage.type === 'success' ? '#3F6B4A' : '#A63A2C',
                  border: `1.5px solid ${passwordMessage.type === 'success' ? '#3F6B4A' : '#A63A2C'}`,
                }}
              >
                {passwordMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                padding: '0.85rem 1.75rem',
                backgroundColor: '#191510',
                color: '#F7F3EA',
                border: 'none',
                borderRadius: '0px',
                fontWeight: '600',
                fontSize: '0.9rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: passwordLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Section 3: Active Sessions */}
        <section
          style={{
            backgroundColor: '#F7F3EA',
            padding: '2rem',
            borderRadius: '0px',
            border: '1px solid rgba(25, 21, 16, 0.14)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#191510', margin: '0 0 0.25rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
                Active Sessions
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#55503F' }}>
                Devices and locations currently logged into your account.
              </p>
            </div>
            {sessions.filter((s) => !s.is_current).length > 0 && (
              <button
                onClick={handleRevokeOtherSessions}
                disabled={sessionsLoading}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: '#FFFFFF',
                  color: '#A63A2C',
                  border: '1.5px solid #A63A2C',
                  borderRadius: '0px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  cursor: sessionsLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Log out all other devices
              </button>
            )}
          </div>

          {sessionsMessage && (
            <div
              style={{
                padding: '0.85rem',
                borderRadius: '0px',
                fontSize: '0.88rem',
                marginBottom: '1.25rem',
                fontWeight: '500',
                backgroundColor: '#FFFFFF',
                color: sessionsMessage.type === 'success' ? '#3F6B4A' : '#A63A2C',
                border: `1.5px solid ${sessionsMessage.type === 'success' ? '#3F6B4A' : '#A63A2C'}`,
              }}
            >
              {sessionsMessage.text}
            </div>
          )}

          {sessions.length === 0 ? (
            <p style={{ color: '#55503F', fontSize: '0.95rem', margin: 0 }}>No active session records.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderRadius: '0px',
                    border: '1.5px solid #191510',
                    backgroundColor: '#FFFFFF',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: '700', color: '#191510', fontSize: '0.95rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {s.device_hint || 'Unknown Device'}
                      </span>
                      {s.is_current && (
                        <span style={{ padding: '0.2rem 0.55rem', backgroundColor: '#3F6B4A', color: '#F7F3EA', borderRadius: '0px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          THIS DEVICE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#55503F', marginTop: '0.25rem' }}>
                      IP: {s.ip_address || 'Unknown'} • Last active: {new Date(s.last_used_at).toLocaleString()}
                    </div>
                  </div>
                  {!s.is_current && (
                    <button
                      onClick={() => handleRevokeSingleSession(s.id)}
                      disabled={sessionsLoading}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#F7F3EA',
                        color: '#A63A2C',
                        border: '1.5px solid #A63A2C',
                        borderRadius: '0px',
                        fontWeight: '600',
                        fontSize: '0.82rem',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        cursor: sessionsLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Log out this device
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 4: Purchase History */}
        <section
          style={{
            backgroundColor: '#F7F3EA',
            padding: '2rem',
            borderRadius: '0px',
            border: '1px solid rgba(25, 21, 16, 0.14)',
          }}
        >
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#191510', margin: '0 0 1.25rem 0', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
            Purchase History
          </h2>

          {purchases.length === 0 ? (
            <p style={{ color: '#55503F', fontSize: '0.95rem', margin: 0 }}>No purchase records found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #191510', color: '#191510', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(25, 21, 16, 0.14)' }}>
                      <td style={{ padding: '1rem', fontWeight: '700', color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>{item.categoryName}</td>
                      <td style={{ padding: '1rem', color: '#55503F' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', fontWeight: '700', color: '#191510' }}>{item.amountClaimed} ETB</td>
                      <td style={{ padding: '1rem' }}>
                        {item.status === 'verified' && (
                          <span style={{ padding: '0.25rem 0.65rem', backgroundColor: '#3F6B4A', color: '#F7F3EA', borderRadius: '0px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                            ✓ VERIFIED
                          </span>
                        )}
                        {item.status === 'pending_verification' && (
                          <span style={{ padding: '0.25rem 0.65rem', backgroundColor: '#C98A2E', color: '#F7F3EA', borderRadius: '0px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                            ⏳ PENDING
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span style={{ padding: '0.25rem 0.65rem', backgroundColor: '#A63A2C', color: '#F7F3EA', borderRadius: '0px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                            ✕ REJECTED
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: '#55503F', fontSize: '0.85rem' }}>
                        {item.status === 'rejected' && item.rejectionReason ? (
                          <span style={{ color: '#A63A2C' }}>Reason: {item.rejectionReason}</span>
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
            backgroundColor: '#F7F3EA',
            padding: '1.75rem 2rem',
            borderRadius: '0px',
            border: '1.5px solid #A63A2C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', fontWeight: '700', color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif" }}>
              Sign Out
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#55503F' }}>
              End your active session on this device.
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.75rem',
              backgroundColor: '#A63A2C',
              color: '#F7F3EA',
              border: 'none',
              borderRadius: '0px',
              fontWeight: '600',
              fontSize: '0.9rem',
              fontFamily: "'IBM Plex Sans', sans-serif",
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
