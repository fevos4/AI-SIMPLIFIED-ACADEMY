'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Play, Layers, User, LogOut, Menu, ArrowLeft, ArrowRight } from 'lucide-react';

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
    { label: 'Dashboard', href: '/dashboard', Icon: Home },
    { label: 'My Courses', href: '/dashboard/my-courses', Icon: Play },
    { label: 'Browse', href: '/courses', Icon: Layers },
    { label: 'Account', href: '/dashboard/account', Icon: User },
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
        backgroundColor: '#FFFFFF',
        color: '#191510',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.25s ease',
        zIndex: 100,
        borderRight: '1px solid rgba(25, 21, 16, 0.14)',
        flexShrink: 0,
        fontFamily: "'IBM Plex Sans', sans-serif",
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
            borderBottom: '1px solid rgba(25, 21, 16, 0.14)',
          }}
        >
          {!collapsed && (
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1.5px solid #191510',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#191510',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  fontFamily: "'Space Grotesk', sans-serif",
                  lineHeight: 1,
                }}
              >
                አ
              </div>
              <span
                style={{
                  color: '#191510',
                  fontSize: '1rem',
                  fontWeight: '600',
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: '-0.01em',
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
              color: '#191510',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Menu width={20} height={20} strokeWidth={1.5} color="#191510" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '1.25rem 0.75rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/courses' && pathname.startsWith('/courses/'));
            const { Icon } = item;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0px',
                  color: isActive ? '#F7F3EA' : '#191510',
                  backgroundColor: isActive ? '#A63A2C' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.9rem',
                  marginBottom: '0.35rem',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'background-color 0.15s ease',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                <Icon width={18} height={18} strokeWidth={1.75} color={isActive ? '#F7F3EA' : '#191510'} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Avatar & Logout */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(25, 21, 16, 0.14)' }}>
        {!collapsed && user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '0px',
              backgroundColor: '#F7F3EA',
              border: '1px solid rgba(25, 21, 16, 0.14)',
              marginBottom: '0.75rem',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1.5px solid #191510',
                backgroundColor: 'transparent',
                color: '#191510',
                fontSize: '0.82rem',
                fontWeight: '600',
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
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#191510', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9A9284', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'IBM Plex Sans', sans-serif" }}>
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
            backgroundColor: '#F7F3EA',
            color: '#A63A2C',
            border: '1px solid rgba(25, 21, 16, 0.14)',
            borderRadius: '0px',
            fontWeight: '500',
            fontFamily: "'IBM Plex Sans', sans-serif",
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.15s ease',
          }}
        >
          <LogOut width={16} height={16} color="#A63A2C" strokeWidth={1.75} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
