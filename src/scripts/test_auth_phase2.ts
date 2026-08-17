import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession, verifyToken } from '@/lib/auth';

async function runAuthVerificationTests() {
  console.log('=== RUNNING PHASE 2 AUTHENTICATION VERIFICATION TESTS ===\n');

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testName = 'Test Student';
  const testPassword = 'TestPassword123!';
  let rawOtpCode = '';
  let otpToken = '';
  let userSessionCookie = '';
  let adminSessionCookie = '';

  // -------------------------------------------------------------
  // Test 1: Sign up a new user (Initiate -> Verify OTP -> Set Password -> Auto-logged-in)
  // -------------------------------------------------------------
  console.log('[Test 1] 3-Step Signup Flow & Auto-login...');

  // Step 1: Initiate
  const initiateRes = await fetch('http://localhost:3000/api/auth/signup/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, name: testName }),
  });
  const initiateData = await initiateRes.json();
  if (!initiateRes.ok || !initiateData.debug_otp) throw new Error(`Initiate failed: ${initiateData.error}`);
  rawOtpCode = initiateData.debug_otp;
  console.log('  -> OTP generated & retrieved:', rawOtpCode);

  // Step 2: Verify OTP
  const verifyRes = await fetch('http://localhost:3000/api/auth/signup/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp_code: rawOtpCode }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyRes.ok || !verifyData.otp_token) throw new Error(`OTP verify failed: ${verifyData.error}`);
  otpToken = verifyData.otp_token;
  console.log('  -> OTP verified successfully, token received.');

  // Step 3: Complete Signup
  const completeRes = await fetch('http://localhost:3000/api/auth/signup/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      confirm_password: testPassword,
      otp_token: otpToken,
    }),
  });
  const completeData = await completeRes.json();
  const setCookieHeader = completeRes.headers.get('set-cookie');
  if (!completeRes.ok || !setCookieHeader?.includes('elearning_session')) {
    throw new Error(`Complete signup failed: ${completeData.error}`);
  }
  userSessionCookie = setCookieHeader.split(';')[0];
  console.log('  -> Signup complete! Auto-login cookie issued:', userSessionCookie.substring(0, 35) + '...');
  console.log('✓ Check 1 PASSED: 3-Step signup & auto-login clean.\n');

  // -------------------------------------------------------------
  // Test 2: Try to log in with unverified email
  // -------------------------------------------------------------
  console.log('[Test 2] Login attempt with unverified email...');
  const unverifiedEmail = `unverified_${Date.now()}@example.com`;
  await prisma.user.create({
    data: {
      email: unverifiedEmail,
      name: 'Unverified User',
      password_hash: await bcrypt.hash('Password123!', 10),
      email_verified: false,
      role: 'user',
    },
  });

  const unverifiedLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: unverifiedEmail, password: 'Password123!' }),
  });
  const unverifiedLoginData = await unverifiedLoginRes.json();
  if (unverifiedLoginRes.ok || unverifiedLoginData.error !== 'Please verify your email before logging in') {
    throw new Error(`Expected 'Please verify your email before logging in', got: ${unverifiedLoginData.error}`);
  }
  console.log('  -> Received expected error message:', unverifiedLoginData.error);
  console.log('✓ Check 2 PASSED: Unverified email login blocked with specific error.\n');

  // -------------------------------------------------------------
  // Test 3: Try to log in with wrong password
  // -------------------------------------------------------------
  console.log('[Test 3] Login attempt with wrong password...');
  const wrongPasswordRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword123!' }),
  });
  const wrongPasswordData = await wrongPasswordRes.json();
  if (wrongPasswordRes.ok || wrongPasswordData.error !== 'Invalid email or password') {
    throw new Error(`Expected generic 'Invalid email or password', got: ${wrongPasswordData.error}`);
  }
  console.log('  -> Received generic error:', wrongPasswordData.error);
  console.log('✓ Check 3 PASSED: Wrong password returns generic error.\n');

  // -------------------------------------------------------------
  // Test 4: Regular user trying to access /admin API
  // -------------------------------------------------------------
  console.log('[Test 4] Regular user accessing admin route...');
  const adminAccessRes = await fetch('http://localhost:3000/api/admin/stats', {
    headers: { Cookie: userSessionCookie },
  });
  if (adminAccessRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for user accessing admin route, got ${adminAccessRes.status}`);
  }
  console.log('  -> Admin API returned HTTP 403 Forbidden.');
  console.log('✓ Check 4 PASSED: Regular user blocked from admin routes.\n');

  // -------------------------------------------------------------
  // Test 5: Logged-out visitor accessing protected /dashboard API
  // -------------------------------------------------------------
  console.log('[Test 5] Logged-out visitor accessing protected user route...');
  const userAccessRes = await fetch('http://localhost:3000/api/user/me');
  if (userAccessRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for logged out user, got ${userAccessRes.status}`);
  }
  console.log('  -> User API returned HTTP 401 Unauthorized.');
  console.log('✓ Check 5 PASSED: Logged-out visitor blocked from user routes.\n');

  // -------------------------------------------------------------
  // Test 6: Try to log in as admin via public /login (without isAdminContext)
  // -------------------------------------------------------------
  console.log('[Test 6] Admin login attempt on public /login page...');
  const adminPublicLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@elearning.com', password: 'AdminPassword123!', isAdminContext: false }),
  });
  const adminPublicLoginData = await adminPublicLoginRes.json();
  if (adminPublicLoginRes.ok || adminPublicLoginData.error !== 'Invalid email or password') {
    throw new Error(`Expected admin rejected on public page, got: ${adminPublicLoginData.error}`);
  }
  console.log('  -> Admin login on public form rejected with generic error:', adminPublicLoginData.error);
  console.log('✓ Check 6 PASSED: Admin blocked from logging in on public /login.\n');

  // -------------------------------------------------------------
  // Test 7: Super Admin login via /admin page (with isAdminContext: true)
  // -------------------------------------------------------------
  console.log('[Test 7] Super Admin login on /admin page...');
  const superAdminLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@elearning.com', password: 'AdminPassword123!', isAdminContext: true }),
  });
  const superAdminLoginData = await superAdminLoginRes.json();
  const adminCookieHeader = superAdminLoginRes.headers.get('set-cookie');
  if (!superAdminLoginRes.ok || !adminCookieHeader?.includes('elearning_session')) {
    throw new Error(`Super Admin login failed: ${superAdminLoginData.error}`);
  }
  adminSessionCookie = adminCookieHeader.split(';')[0];

  // Test admin API access with super admin cookie
  const adminStatsRes = await fetch('http://localhost:3000/api/admin/stats', {
    headers: { Cookie: adminSessionCookie },
  });
  if (!adminStatsRes.ok) throw new Error(`Super admin unable to access admin API: ${adminStatsRes.status}`);
  console.log('  -> Super admin logged in successfully and accessed admin API.');
  console.log('✓ Check 7 PASSED: Super Admin login on /admin page verified.\n');

  // -------------------------------------------------------------
  // Test 8: OTP resend rate limiting (can't resend within 60s)
  // -------------------------------------------------------------
  console.log('[Test 8] OTP Resend rate limiting check...');
  const resendTestEmail = `resend_${Date.now()}@example.com`;
  
  // Initiate
  await fetch('http://localhost:3000/api/auth/signup/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: resendTestEmail, name: 'Resend Test' }),
  });

  // Attempt resend immediately (< 60s)
  const resendRes = await fetch('http://localhost:3000/api/auth/signup/resend-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: resendTestEmail }),
  });
  const resendData = await resendRes.json();
  if (resendRes.status !== 429 || resendData.error !== 'Please wait before requesting a new code') {
    throw new Error(`Expected rate limit HTTP 429 'Please wait before requesting a new code', got status ${resendRes.status}: ${resendData.error}`);
  }
  console.log('  -> Received expected rate limit rejection:', resendData.error);
  console.log('✓ Check 8 PASSED: OTP resend rate limit strictly enforced.\n');

  console.log('=============================================================');
  console.log('🎉 ALL 8 AUTHENTICATION & SECURITY VERIFICATION CHECKS PASSED!');
  console.log('=============================================================');
}

runAuthVerificationTests()
  .catch((err) => {
    console.error('❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  });
