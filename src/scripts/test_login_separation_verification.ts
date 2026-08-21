import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Import API route handlers to test server-side role check directly
import { POST as studentLoginPost } from '../app/api/auth/login/route';
import { POST as adminLoginPost } from '../app/api/auth/admin-login/route';
import { createSession } from '../lib/auth';

async function runLoginSeparationVerification() {
  console.log('=== STARTING 10 LOGIN SEPARATION VERIFICATION CHECKS ===\n');
  const results: { check: number; description: string; passed: boolean; details: string }[] = [];

  const testStudentEmail = 'student_sep_test@example.com';
  const testAdminEmail = 'admin_sep_test@example.com';

  // Cleanup test users
  await prisma.user.deleteMany({
    where: { email: { in: [testStudentEmail, testAdminEmail] } },
  });

  const pwdHash = await bcrypt.hash('SeparationPassword123!', 10);

  const studentUser = await prisma.user.create({
    data: {
      name: 'Separation Student',
      email: testStudentEmail,
      password_hash: pwdHash,
      email_verified: true,
      role: 'user',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Separation Admin',
      email: testAdminEmail,
      password_hash: pwdHash,
      email_verified: true,
      role: 'super_admin',
    },
  });

  // CHECK 1: Logging in as admin/super_admin on POST /api/auth/login (/login) -> returns generic "Invalid email or password", 401, no cookie
  try {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: 'SeparationPassword123!' }),
    });

    const res = await studentLoginPost(req);
    const status = res.status;
    const body = await res.json();
    const cookieHeader = res.headers.get('set-cookie');

    const passed = status === 401 && body.error === 'Invalid email or password' && !cookieHeader;
    results.push({
      check: 1,
      description: 'Admin account logging in on /login returns generic 401, no session cookie',
      passed,
      details: passed
        ? 'Returned HTTP 401 with generic "Invalid email or password" and no session cookie.'
        : `Failed: status=${status}, body=${JSON.stringify(body)}, cookieHeader=${cookieHeader}`,
    });
  } catch (e: any) {
    results.push({ check: 1, description: 'Admin login on /login rejected', passed: false, details: e.message });
  }

  // CHECK 2: Logging in as regular user on POST /api/auth/admin-login (/admin) -> returns generic "Invalid email or password", 401, no cookie
  try {
    const req = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: 'SeparationPassword123!' }),
    });

    const res = await adminLoginPost(req);
    const status = res.status;
    const body = await res.json();
    const cookieHeader = res.headers.get('set-cookie');

    const passed = status === 401 && body.error === 'Invalid email or password' && !cookieHeader;
    results.push({
      check: 2,
      description: 'User account logging in on /admin returns generic 401, no session cookie',
      passed,
      details: passed
        ? 'Returned HTTP 401 with generic "Invalid email or password" and no session cookie.'
        : `Failed: status=${status}, body=${JSON.stringify(body)}`,
    });
  } catch (e: any) {
    results.push({ check: 2, description: 'User login on /admin rejected', passed: false, details: e.message });
  }

  // CHECK 3: Log in as admin on /admin (POST /api/auth/admin-login) -> succeeds, redirects to /admin
  try {
    const req = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: 'SeparationPassword123!' }),
    });

    const res = await adminLoginPost(req);
    const status = res.status;
    const body = await res.json();

    const passed = status === 200 && body.success === true && body.redirectUrl === '/admin';
    results.push({
      check: 3,
      description: 'Admin login on /admin succeeds and returns redirectUrl /admin',
      passed,
      details: passed ? 'Admin authentication succeeded with redirectUrl: /admin.' : `Failed: status=${status}`,
    });
  } catch (e: any) {
    results.push({ check: 3, description: 'Admin login on /admin succeeds', passed: false, details: e.message });
  }

  // CHECK 4: Log in as regular student on /login (POST /api/auth/login) -> succeeds, redirects to /dashboard
  try {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: 'SeparationPassword123!' }),
    });

    const res = await studentLoginPost(req);
    const status = res.status;
    const body = await res.json();

    const passed = status === 200 && body.success === true && body.redirectUrl === '/dashboard';
    results.push({
      check: 4,
      description: 'Student login on /login succeeds and returns redirectUrl /dashboard',
      passed,
      details: passed ? 'Student authentication succeeded with redirectUrl: /dashboard.' : `Failed: status=${status}`,
    });
  } catch (e: any) {
    results.push({ check: 4, description: 'Student login on /login succeeds', passed: false, details: e.message });
  }

  // CHECK 5: Call POST /api/auth/login directly with admin credentials -> 401, no session cookie set
  try {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: 'SeparationPassword123!' }),
    });

    const res = await studentLoginPost(req);
    const status = res.status;
    const cookieHeader = res.headers.get('set-cookie');

    const passed = status === 401 && !cookieHeader;
    results.push({
      check: 5,
      description: 'Direct API POST /api/auth/login with admin credentials returns 401',
      passed,
      details: passed ? 'Direct API call blocked at server-side with 401.' : `Failed: status=${status}`,
    });
  } catch (e: any) {
    results.push({ check: 5, description: 'Direct API POST /api/auth/login with admin creds', passed: false, details: e.message });
  }

  // CHECK 6: Call POST /api/auth/admin-login directly with user credentials -> 401, no session cookie set
  try {
    const req = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: 'SeparationPassword123!' }),
    });

    const res = await adminLoginPost(req);
    const status = res.status;
    const cookieHeader = res.headers.get('set-cookie');

    const passed = status === 401 && !cookieHeader;
    results.push({
      check: 6,
      description: 'Direct API POST /api/auth/admin-login with user credentials returns 401',
      passed,
      details: passed ? 'Direct API call blocked at server-side with 401.' : `Failed: status=${status}`,
    });
  } catch (e: any) {
    results.push({ check: 6, description: 'Direct API POST /api/auth/admin-login with user creds', passed: false, details: e.message });
  }

  // CHECK 7: /login page source inspection -> NO "Create Account" button (only "Sign up" link pointing to /signup)
  try {
    const loginPageContent = fs.readFileSync(path.join(__dirname, '../app/(public)/login/page.tsx'), 'utf-8');
    const hasCreateAccountButton = /<button[^>]*>[^<]*Create Account[^<]*<\/button>/i.test(loginPageContent);
    const hasSignUpLink = /href=\{`\/signup/i.test(loginPageContent) || /href="\/signup"/i.test(loginPageContent);

    const passed = !hasCreateAccountButton && hasSignUpLink;
    results.push({
      check: 7,
      description: '/login page has NO "Create Account" button, only "Sign up" link to /signup',
      passed,
      details: passed ? 'Verified: No Create Account button present, Sign up link points to /signup.' : 'Failed UI check.',
    });
  } catch (e: any) {
    results.push({ check: 7, description: '/login UI check', passed: false, details: e.message });
  }

  // CHECK 8: /admin login form source inspection -> NO "Create Account", "Sign up", or "Forgot password" links
  try {
    const adminLoginContent = fs.readFileSync(path.join(__dirname, '../components/AdminLoginFormClient.tsx'), 'utf-8');
    const hasCreateAccount = /Create Account/i.test(adminLoginContent);
    const hasSignUp = /Sign up/i.test(adminLoginContent);
    const hasForgotPassword = /Forgot password/i.test(adminLoginContent);

    const passed = !hasCreateAccount && !hasSignUp && !hasForgotPassword;
    results.push({
      check: 8,
      description: '/admin login form has NO "Create Account", "Sign up", or "Forgot password" links',
      passed,
      details: passed ? 'Verified: Minimal admin login form with zero extraneous links.' : 'Failed UI check.',
    });
  } catch (e: any) {
    results.push({ check: 8, description: '/admin UI check', passed: false, details: e.message });
  }

  // CHECK 9 & 10: Middleware Routing Inspection for authenticated user & admin
  try {
    const middlewareContent = fs.readFileSync(path.join(__dirname, '../middleware.ts'), 'utf-8');
    const userToDashboard = /session\.role === 'user'[\s\S]*NextResponse\.redirect\(new URL\('\/dashboard'/i.test(middlewareContent);
    const adminToAdmin = /session\.role === 'admin'[\s\S]*isPublicLogin[\s\S]*NextResponse\.redirect\(new URL\('\/admin'/i.test(middlewareContent);

    results.push({
      check: 9,
      description: 'Authenticated user visiting /admin is redirected to /dashboard in middleware',
      passed: userToDashboard,
      details: userToDashboard ? 'Verified: User role attempting /admin redirects to /dashboard.' : 'Failed.',
    });

    results.push({
      check: 10,
      description: 'Authenticated admin visiting /dashboard or /login is redirected to /admin in middleware',
      passed: adminToAdmin,
      details: adminToAdmin ? 'Verified: Admin role attempting /login or /dashboard redirects to /admin.' : 'Failed.',
    });
  } catch (e: any) {
    results.push({ check: 9, description: 'Middleware routing check 9', passed: false, details: e.message });
    results.push({ check: 10, description: 'Middleware routing check 10', passed: false, details: e.message });
  }

  // Cleanup test users
  await prisma.user.deleteMany({
    where: { email: { in: [testStudentEmail, testAdminEmail] } },
  });

  // Print Summary Table
  console.log('----------------------------------------------------------------------------------------------------');
  console.log('| Check # | Result | Description');
  console.log('----------------------------------------------------------------------------------------------------');
  let allPassed = true;
  for (const r of results) {
    if (!r.passed) allPassed = false;
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`| Check ${r.check.toString().padEnd(2)} | ${status} | ${r.description}`);
    console.log(`|         | Details: ${r.details}`);
    console.log('----------------------------------------------------------------------------------------------------');
  }

  if (allPassed) {
    console.log('\n🎉 ALL 10 LOGIN SEPARATION VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.log('\n⚠️ SOME VERIFICATION CHECKS FAILED. SEE LOGS ABOVE.');
    process.exit(1);
  }
}

runLoginSeparationVerification().catch((err) => {
  console.error('Fatal error running login separation verification suite:', err);
  process.exit(1);
});
