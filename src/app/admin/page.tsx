import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Layers, CreditCard, ShieldCheck, Landmark } from 'lucide-react';
import AdminLoginFormClient from '@/components/AdminLoginFormClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();

  // If unauthenticated or wrong role, show minimal Admin Login Form
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return <AdminLoginFormClient />;
  }

  const categoryCount = await prisma.courseCategory.count();
  const lessonCount = await prisma.courseLesson.count();
  const videoCount = await prisma.courseVideo.count();
  const pendingPurchaseCount = await prisma.coursePurchase.count({ where: { status: 'pending_verification' } });

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '3rem 2rem', boxSizing: 'border-box' }}>
        <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(25, 21, 16, 0.14)', paddingBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#A63A2C', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            ADMINISTRATION OVERVIEW
          </span>
          <h1 style={{ margin: '0.25rem 0 0 0', fontSize: '2.2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
            Admin Portal
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#55503F', fontSize: '0.95rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Welcome back, <strong>{session.email}</strong> ({session.role})
          </p>
        </header>

        {/* Stat Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ padding: '1.75rem', border: '1px solid rgba(25, 21, 16, 0.14)', borderRadius: '0px', backgroundColor: '#F7F3EA' }}>
            <h3 style={{ margin: 0, color: '#9A9284', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Total Categories
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>
              {categoryCount}
            </p>
          </div>

          <div style={{ padding: '1.75rem', border: '1px solid rgba(25, 21, 16, 0.14)', borderRadius: '0px', backgroundColor: '#F7F3EA' }}>
            <h3 style={{ margin: 0, color: '#9A9284', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Lessons & Videos
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>
              {lessonCount} / {videoCount}
            </p>
          </div>

          <div style={{ padding: '1.75rem', border: '1px solid rgba(25, 21, 16, 0.14)', borderRadius: '0px', backgroundColor: '#F7F3EA' }}>
            <h3 style={{ margin: 0, color: '#9A9284', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Pending Verification Queue
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: pendingPurchaseCount > 0 ? '#C98A2E' : '#3F6B4A', fontFamily: "'Space Grotesk', sans-serif" }}>
              {pendingPurchaseCount}
            </p>
          </div>
        </div>

        {/* Quick Management Links */}
        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
            Management Hub
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <Link
              href="/admin/categories"
              style={{
                padding: '1.5rem',
                border: '1.5px solid #191510',
                backgroundColor: '#FFFFFF',
                textDecoration: 'none',
                color: '#191510',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ padding: '0.65rem', backgroundColor: '#F7F3EA', border: '1px solid rgba(25, 21, 16, 0.14)' }}>
                <Layers width={22} height={22} color="#191510" />
              </div>
              <div>
                <strong style={{ fontSize: '1.05rem', fontFamily: "'Space Grotesk', sans-serif", display: 'block', marginBottom: '0.25rem' }}>
                  Categories & Curriculum
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#55503F' }}>
                  Create and manage course categories, lesson modules, drag order, and upload video content.
                </span>
              </div>
            </Link>

            <Link
              href="/admin/purchases"
              style={{
                padding: '1.5rem',
                border: '1.5px solid #191510',
                backgroundColor: '#FFFFFF',
                textDecoration: 'none',
                color: '#191510',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ padding: '0.65rem', backgroundColor: '#F7F3EA', border: '1px solid rgba(25, 21, 16, 0.14)' }}>
                <CreditCard width={22} height={22} color={pendingPurchaseCount > 0 ? '#A63A2C' : '#191510'} />
              </div>
              <div>
                <strong style={{ fontSize: '1.05rem', fontFamily: "'Space Grotesk', sans-serif", display: 'block', marginBottom: '0.25rem' }}>
                  Payment Queue ({pendingPurchaseCount})
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#55503F' }}>
                  Review submitted bank receipts, approve enrollments, or issue detailed rejection notices.
                </span>
              </div>
            </Link>

            <Link
              href="/admin/bank-accounts"
              style={{
                padding: '1.5rem',
                border: '1.5px solid #191510',
                backgroundColor: '#FFFFFF',
                textDecoration: 'none',
                color: '#191510',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ padding: '0.65rem', backgroundColor: '#F7F3EA', border: '1px solid rgba(25, 21, 16, 0.14)' }}>
                <Landmark width={22} height={22} color="#191510" />
              </div>
              <div>
                <strong style={{ fontSize: '1.05rem', fontFamily: "'Space Grotesk', sans-serif", display: 'block', marginBottom: '0.25rem' }}>
                  Bank Accounts &amp; Payment Methods
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#55503F' }}>
                  Set account numbers, mobile wallet phones, instructions, and toggle which banks appear for students.
                </span>
              </div>
            </Link>

            {session.role === 'super_admin' && (
              <Link
                href="/admin/manage-admins"
                style={{
                  padding: '1.5rem',
                  border: '1.5px solid #191510',
                  backgroundColor: '#FFFFFF',
                  textDecoration: 'none',
                  color: '#191510',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ padding: '0.65rem', backgroundColor: '#F7F3EA', border: '1px solid rgba(25, 21, 16, 0.14)' }}>
                  <ShieldCheck width={22} height={22} color="#191510" />
                </div>
                <div>
                  <strong style={{ fontSize: '1.05rem', fontFamily: "'Space Grotesk', sans-serif", display: 'block', marginBottom: '0.25rem' }}>
                    Manage Admin Accounts
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: '#55503F' }}>
                    Create new admin access credentials and manage role permissions across the team.
                  </span>
                </div>
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
