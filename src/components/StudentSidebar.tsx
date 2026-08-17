'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  user?: {
    name: string;
    email: string;
  } | null;
}

export default function StudentSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'My Courses', href: '/dashboard/my-courses', icon: '▶️' },
    { label: 'Browse', href: '/courses', icon: '📚' },
    { label: 'Account', href: '/dashboard/account', icon: '👤' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const getInitials = (nameStr?: string) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '260px',
        backgroundColor: '#24201a',
        color: '#ffffff',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.25s ease',
        zIndex: 100,
        borderRight: '1px solid #332d25',
        flexShrink: 0,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div>
        {/* Top Header */}
        <div
          style={{
            padding: '1.25rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid #332d25',
          }}
        >
          {!collapsed && (
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#e94f6b',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                🎓
              </div>
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: '700',
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: '-0.3px',
                }}
              >
                AI SIMPLIFIED
              </span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9a8e73',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0.25rem',
              borderRadius: '6px',
            }}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? '➔' : '☰'}
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '1.25rem 0.75rem', fontFamily: "'Space Grotesk', sans-serif" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/courses' && pathname.startsWith('/courses/'));

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  color: isActive ? '#ffffff' : '#9a8e73',
                  backgroundColor: isActive ? '#e94f6b' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '0.9rem',
                  marginBottom: '0.35rem',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 1px 2px rgba(36, 32, 26, 0.04)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Avatar & Logout */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid #332d25' }}>
        {!collapsed && user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: '#1c1914',
              border: '1px solid #332d25',
              marginBottom: '0.75rem',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#e94f6b',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: '700',
                fontFamily: "'Space Grotesk', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getInitials(user.name)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9a8e73', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '0.65rem',
            backgroundColor: '#1c1914',
            color: '#e94f6b',
            border: '1px solid #332d25',
            borderRadius: '8px',
            fontWeight: '700',
            fontFamily: "'Space Grotesk', sans-serif",
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s ease',
          }}
        >
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
