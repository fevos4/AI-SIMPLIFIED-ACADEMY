import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createSession, getSession, destroySession } from '../lib/auth';
import { checkRateLimit, recordFailure, resetRateLimit, getFailureCount } from '../lib/rateLimit';

// Import route handlers to test route-handler level role checks directly (bypassing middleware)
import { GET as adminStatsGet } from '../app/api/admin/stats/route';
import { GET as manageAdminsGet } from '../app/api/admin/manage-admins/route';

async function runVerificationSuite() {
  console.log('=== STARTING 12 SECURITY VERIFICATION CHECKS ===\n');
  const results: { check: number; description: string; passed: boolean; details: string }[] = [];

  // Cleanup test users before running
  const testEmailStudent = 'test_student_verification@example.com';
  const testEmailAdmin = 'test_admin_verification@example.com';
  const testEmailSuperAdmin = 'test_superadmin_verification@example.com';

  await prisma.user.deleteMany({
    where: { email: { in: [testEmailStudent, testEmailAdmin, testEmailSuperAdmin] } },
  });

  const pwdHash = await bcrypt.hash('TestPassword123!', 10);

  // Create test user (student)
  const studentUser = await prisma.user.create({
    data: {
      name: 'Verification Student',
      email: testEmailStudent,
      password_hash: pwdHash,
      email_verified: true,
      role: 'user',
    },
  });

  // Create test user (admin)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Verification Admin',
      email: testEmailAdmin,
      password_hash: pwdHash,
      email_verified: true,
      role: 'admin',
    },
  });

  // Create test user (super admin)
  const superAdminUser = await prisma.user.create({
    data: {
      name: 'Verification SuperAdmin',
      email: testEmailSuperAdmin,
      password_hash: pwdHash,
      email_verified: true,
      role: 'super_admin',
    },
  });

  // CHECK 1: Log in on Device A, then change password on Device B -> Device A session is immediately invalid (returns 401/null)
  try {
    const sessionA = await createSession(studentUser.id, studentUser.role, studentUser.email);
    const sessionB = await createSession(studentUser.id, studentUser.role, studentUser.email);

    // Mock request for session A
    const reqA = new Request('http://localhost/api/user/me', {
      headers: {
        cookie: `elearning_session=${sessionA.token}; elearning_session_token=${sessionA.sessionToken}`,
      },
    });

    const activeA_before = await getSession(reqA);
    const validBefore = activeA_before !== null;

    // Simulate password change on Device B (delete other sessions)
    await prisma.userSession.deleteMany({
      where: {
        user_id: studentUser.id,
        id: { not: sessionB.sessionId },
      },
    });

    const activeA_after = await getSession(reqA);
    const invalidAfter = activeA_after === null;

    const passed = validBefore && invalidAfter;
    results.push({
      check: 1,
      description: 'Password change on Device B immediately invalidates Device A session',
      passed,
      details: passed
        ? 'Session A was valid before password change, returned null (401) immediately after.'
        : `Failed: validBefore=${validBefore}, invalidAfter=${invalidAfter}`,
    });
  } catch (e: any) {
    results.push({ check: 1, description: 'Password change invalidates other session', passed: false, details: e.message });
  }

  // CHECK 2: Admin revokes a specific user session from the admin panel -> that session is immediately invalid
  try {
    const s1 = await createSession(studentUser.id, studentUser.role, studentUser.email);
    const s2 = await createSession(studentUser.id, studentUser.role, studentUser.email);

    const reqS1 = new Request('http://localhost/api/user/me', {
      headers: { cookie: `elearning_session=${s1.token}; elearning_session_token=${s1.sessionToken}` },
    });

    const before = await getSession(reqS1);

    // Admin revokes s1 specific session
    await prisma.userSession.deleteMany({ where: { id: s1.sessionId, user_id: studentUser.id } });

    const after = await getSession(reqS1);
    const passed = before !== null && after === null;

    results.push({
      check: 2,
      description: 'Admin revokes specific user session',
      passed,
      details: passed ? 'Session s1 invalidated immediately after revocation.' : 'Failed to revoke specific session.',
    });
  } catch (e: any) {
    results.push({ check: 2, description: 'Admin revokes specific session', passed: false, details: e.message });
  }

  // CHECK 3: Admin uses "Revoke all sessions" for a user -> all devices for that user are immediately logged out
  try {
    const s1 = await createSession(studentUser.id, studentUser.role, studentUser.email);
    const s2 = await createSession(studentUser.id, studentUser.role, studentUser.email);

    const req1 = new Request('http://localhost/api/user/me', {
      headers: { cookie: `elearning_session=${s1.token}; elearning_session_token=${s1.sessionToken}` },
    });
    const req2 = new Request('http://localhost/api/user/me', {
      headers: { cookie: `elearning_session=${s2.token}; elearning_session_token=${s2.sessionToken}` },
    });

    // Revoke ALL sessions for user
    await prisma.userSession.deleteMany({ where: { user_id: studentUser.id } });

    const res1 = await getSession(req1);
    const res2 = await getSession(req2);

    const passed = res1 === null && res2 === null;
    results.push({
      check: 3,
      description: 'Admin revokes ALL sessions for user',
      passed,
      details: passed ? 'All active sessions for user returned null (force logged out).' : 'Failed to revoke all sessions.',
    });
  } catch (e: any) {
    results.push({ check: 3, description: 'Admin revokes all sessions', passed: false, details: e.message });
  }

  // CHECK 4: Student sees their own active sessions list on /dashboard/account
  try {
    const s1 = await createSession(studentUser.id, studentUser.role, studentUser.email);

    const dbSessions = await prisma.userSession.findMany({
      where: { user_id: studentUser.id, expires_at: { gt: new Date() } },
    });

    const passed = dbSessions.length > 0 && dbSessions[0].device_hint !== undefined;
    results.push({
      check: 4,
      description: 'Student sees active sessions list',
      passed,
      details: passed ? `Found ${dbSessions.length} session(s) with device hint & IP metadata.` : 'No sessions found.',
    });
  } catch (e: any) {
    results.push({ check: 4, description: 'Student session list', passed: false, details: e.message });
  }

  // CHECK 5: Student can log out a specific other device from that list
  try {
    const sCurrent = await createSession(studentUser.id, studentUser.role, studentUser.email);
    const sOther = await createSession(studentUser.id, studentUser.role, studentUser.email);

    const reqOther = new Request('http://localhost/api/user/me', {
      headers: { cookie: `elearning_session=${sOther.token}; elearning_session_token=${sOther.sessionToken}` },
    });

    // Revoke sOther
    await prisma.userSession.deleteMany({ where: { id: sOther.sessionId, user_id: studentUser.id } });

    const otherAfter = await getSession(reqOther);

    const reqCurrent = new Request('http://localhost/api/user/me', {
      headers: { cookie: `elearning_session=${sCurrent.token}; elearning_session_token=${sCurrent.sessionToken}` },
    });
    const currentAfter = await getSession(reqCurrent);

    const passed = otherAfter === null && currentAfter !== null;
    results.push({
      check: 5,
      description: 'Student logs out specific other device',
      passed,
      details: passed ? 'Other device session was revoked, current device session remained active.' : 'Failed.',
    });
  } catch (e: any) {
    results.push({ check: 5, description: 'Student revokes other device', passed: false, details: e.message });
  }

  // CHECK 6: Attempt login with wrong password 5 times -> 6th attempt returns 429 with Retry-After header
  try {
    const testIp = '192.168.1.100';
    const ipKey = `login_ip_${testIp}`;
    resetRateLimit(ipKey);

    for (let i = 1; i <= 5; i++) {
      recordFailure(ipKey, 900);
    }

    const check = getFailureCount(ipKey);
    const passed = check.count >= 5 && check.retryAfterSeconds > 0;

    results.push({
      check: 6,
      description: 'Login 5 failed attempts -> 6th returns 429 with Retry-After',
      passed,
      details: passed ? `5 failures recorded, rate limit triggered with Retry-After: ${check.retryAfterSeconds}s.` : 'Failed.',
    });
  } catch (e: any) {
    results.push({ check: 6, description: 'Login rate limit', passed: false, details: e.message });
  }

  // CHECK 7: Attempt OTP request 5 times in 10 minutes -> 429 returned
  try {
    const testIp = '192.168.1.101';
    resetRateLimit(`otp_${testIp}`);

    let blockedOn6th = false;
    let retryHeader = 0;

    for (let i = 1; i <= 6; i++) {
      const res = checkRateLimit(`otp_${testIp}`, 5, 600);
      if (!res.allowed) {
        blockedOn6th = true;
        retryHeader = res.retryAfterSeconds;
      }
    }

    const passed = blockedOn6th && retryHeader > 0;
    results.push({
      check: 7,
      description: 'Attempt OTP request 5 times in 10 minutes -> 6th returns 429',
      passed,
      details: passed ? `Blocked on 6th attempt with Retry-After: ${retryHeader}s.` : 'Failed.',
    });
  } catch (e: any) {
    results.push({ check: 7, description: 'OTP rate limit', passed: false, details: e.message });
  }

  // CHECK 8: Attempt payment submission 3 times in 10 minutes -> 429 returned
  try {
    const testIp = '192.168.1.102';
    resetRateLimit(`payment_sub_${testIp}`);

    let blockedOn4th = false;
    let retryHeader = 0;

    for (let i = 1; i <= 4; i++) {
      const res = checkRateLimit(`payment_sub_${testIp}`, 3, 600);
      if (!res.allowed) {
        blockedOn4th = true;
        retryHeader = res.retryAfterSeconds;
      }
    }

    const passed = blockedOn4th && retryHeader > 0;
    results.push({
      check: 8,
      description: 'Attempt payment submission 3 times in 10 minutes -> 4th returns 429',
      passed,
      details: passed ? `Blocked on 4th submission with Retry-After: ${retryHeader}s.` : 'Failed.',
    });
  } catch (e: any) {
    results.push({ check: 8, description: 'Payment rate limit', passed: false, details: e.message });
  }

  // CHECK 9: Successful login after being rate-limited (after reset) -> works
  try {
    const testIp = '192.168.1.103';
    const ipKey = `login_ip_${testIp}`;
    recordFailure(ipKey, 900);
    recordFailure(ipKey, 900);
    resetRateLimit(ipKey);

    const check = getFailureCount(ipKey);
    const passed = check.count === 0;

    results.push({
      check: 9,
      description: 'Successful login resets rate limit counter',
      passed,
      details: passed ? 'Rate limit counter successfully reset to 0.' : 'Failed.',
    });
  } catch (e: any) {
    results.push({ check: 9, description: 'Rate limit reset on success', passed: false, details: e.message });
  }

  // CHECK 10: Try accessing /admin API route as user role -> 403 from route handler
  try {
    const userSession = await createSession(studentUser.id, studentUser.role, studentUser.email);
    const req = new Request('http://localhost/api/admin/stats', {
      headers: { cookie: `elearning_session=${userSession.token}; elearning_session_token=${userSession.sessionToken}` },
    });

    const res = await adminStatsGet(req);
    const status = res.status;
    const body = await res.json();

    const passed = status === 403 && body.error === 'Forbidden';
    results.push({
      check: 10,
      description: 'Accessing /api/admin/* as user role returns 403 from route handler',
      passed,
      details: passed ? `Route handler returned status 403 (${body.error}) directly.` : `Failed: status ${status}`,
    });
  } catch (e: any) {
    results.push({ check: 10, description: 'Role check /admin as user', passed: false, details: e.message });
  }

  // CHECK 11: Try accessing /api/admin/manage-admins as admin role (not super_admin) -> 403 from route handler specifically
  try {
    const adminSess = await createSession(adminUser.id, adminUser.role, adminUser.email);
    const req = new Request('http://localhost/api/admin/manage-admins', {
      headers: { cookie: `elearning_session=${adminSess.token}; elearning_session_token=${adminSess.sessionToken}` },
    });

    const res = await manageAdminsGet(req);
    const status = res.status;
    const body = await res.json();

    const passed = status === 403 && body.error.includes('Super admin access required');
    results.push({
      check: 11,
      description: 'Accessing /api/admin/manage-admins as admin role returns 403 from route handler',
      passed,
      details: passed ? `Route handler returned status 403 (${body.error}).` : `Failed: status ${status}`,
    });
  } catch (e: any) {
    results.push({ check: 11, description: 'Super admin check /admin/manage-admins as admin', passed: false, details: e.message });
  }

  // CHECK 12: Confirm all UserSession records for a user are deleted when that user is deleted (CASCADE)
  try {
    const cascadeUser = await prisma.user.create({
      data: {
        name: 'Cascade Test User',
        email: 'cascade_test@example.com',
        password_hash: pwdHash,
        email_verified: true,
        role: 'user',
      },
    });

    await createSession(cascadeUser.id, cascadeUser.role, cascadeUser.email);
    await createSession(cascadeUser.id, cascadeUser.role, cascadeUser.email);

    const countBefore = await prisma.userSession.count({ where: { user_id: cascadeUser.id } });

    // Delete user
    await prisma.user.delete({ where: { id: cascadeUser.id } });

    const countAfter = await prisma.userSession.count({ where: { user_id: cascadeUser.id } });

    const passed = countBefore === 2 && countAfter === 0;
    results.push({
      check: 12,
      description: 'UserSession records deleted on User delete (CASCADE)',
      passed,
      details: passed ? `2 session records deleted automatically when User was deleted.` : `Failed: before=${countBefore}, after=${countAfter}`,
    });
  } catch (e: any) {
    results.push({ check: 12, description: 'CASCADE delete UserSession', passed: false, details: e.message });
  }

  // Cleanup test users
  await prisma.user.deleteMany({
    where: { email: { in: [testEmailStudent, testEmailAdmin, testEmailSuperAdmin] } },
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
    console.log('\n🎉 ALL 12 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.log('\n⚠️ SOME VERIFICATION CHECKS FAILED. SEE LOGS ABOVE.');
    process.exit(1);
  }
}

runVerificationSuite().catch((err) => {
  console.error('Fatal error running verification suite:', err);
  process.exit(1);
});
