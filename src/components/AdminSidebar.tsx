'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Layers, CreditCard, ShieldCheck, LogOut, Menu } from 'lucide-react';

interface AdminSidebarProps {
  user?: {
    email: string;
    role: string;
  } | null;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Overview', href: '/admin', Icon: LayoutDashboard },
    { label: 'Categories & Curriculum', href: '/admin/categories', Icon: Layers },
    { label: 'Payment Queue', href: '/admin/purchases', Icon: CreditCard },
    ...(user?.role === 'super_admin' ? [{ label: 'Manage Admins', href: '/admin/manage-admins', Icon: ShieldCheck }] : []),
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const getInitials = (emailStr?: string) => {
    if (!emailStr) return 'AD';
    return emailStr.slice(0, 2).toUpperCase();
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
            <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <img
                src="/imgs/logo.png"
                alt="AI Simplified Admin"
                style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              />
              <div>
                <span
                  style={{
                    color: '#191510',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    fontFamily: "'Space Grotesk', sans-serif",
                    letterSpacing: '-0.01em',
                    display: 'block',
                    lineHeight: 1.1,
                  }}
                >
                  ADMIN PORTAL
                </span>
                <span style={{ fontSize: '0.7rem', color: '#A63A2C', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI Simplified
                </span>
              </div>
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
            const isActive =
              pathname === item.href ||
              (item.href === '/admin/categories' && pathname.startsWith('/admin/categories/'));
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

      {/* Bottom Admin User Info & Logout */}
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
                backgroundColor: '#191510',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: '700',
                fontFamily: "'Space Grotesk', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getInitials(user.email)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#191510', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#A63A2C', fontWeight: '600', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {user.role}
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
