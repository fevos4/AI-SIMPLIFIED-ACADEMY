import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

async function runPhase3VerificationTests() {
  console.log('=== RUNNING PHASE 3 BROWSING & ACCESS CONTROL VERIFICATION TESTS ===\n');

  // Fetch sample category and videos from DB
  const category = await prisma.courseCategory.findFirst({
    include: {
      lessons: {
        include: {
          videos: true,
        },
      },
    },
  });

  if (!category) throw new Error('No categories found in DB');
  const categoryId = category.id;

  let freeVideoId = '';
  let paidVideoId = '';

  for (const lesson of category.lessons) {
    for (const video of lesson.videos) {
      if (video.is_free && !freeVideoId) freeVideoId = video.id;
      if (!video.is_free && !paidVideoId) paidVideoId = video.id;
    }
  }

  if (!freeVideoId || !paidVideoId) throw new Error('Could not find both free and paid test videos');

  // Create a clean test user
  const studentEmail = `phase3_student_${Date.now()}@example.com`;
  const studentUser = await prisma.user.create({
    data: {
      email: studentEmail,
      name: 'Phase 3 Student',
      password_hash: 'hash',
      email_verified: true,
      role: 'user',
    },
  });

  // Issue session token for student
  const studentToken = await createSession(studentUser.id, studentUser.role, studentUser.email);
  const studentCookie = `elearning_session=${studentToken}`;

  // -------------------------------------------------------------
  // Test 1: Browse / as logged-out visitor
  // -------------------------------------------------------------
  console.log('[Test 1] Browse / homepage logged out...');
  const homeRes = await fetch('http://localhost:3000/');
  if (!homeRes.ok) throw new Error(`Homepage failed with status ${homeRes.status}`);
  const homeHtml = await homeRes.text();
  if (!homeHtml.includes(category.name)) throw new Error('Category name not found on homepage');
  console.log('  -> Homepage fetched successfully, category list present.');
  console.log('✓ Check 1 PASSED: Public homepage browsable.\n');

  // -------------------------------------------------------------
  // Test 2: Open /courses/[categoryId] logged out
  // -------------------------------------------------------------
  console.log('[Test 2] Open /courses/[categoryId] logged out...');
  const detailRes = await fetch(`http://localhost:3000/courses/${categoryId}`);
  if (!detailRes.ok) throw new Error(`Category detail page failed with status ${detailRes.status}`);
  const detailHtml = await detailRes.text();
  if (!detailHtml.includes('FREE PREVIEW') || !detailHtml.includes('Purchase to Unlock')) {
    throw new Error('Expected video lock / free preview indicators on detail page');
  }
  console.log('  -> Category detail page loaded, free/paid status rendered accurately.');
  console.log('✓ Check 2 PASSED: Category detail page access state verified.\n');

  // -------------------------------------------------------------
  // Test 3: Play FREE video while logged out
  // -------------------------------------------------------------
  console.log('[Test 3] Play FREE video while logged out...');
  const freePlayRes = await fetch(`http://localhost:3000/api/student/videos/${freeVideoId}/play`);
  const freePlayData = await freePlayRes.json();
  if (!freePlayRes.ok || !freePlayData.playable) {
    throw new Error(`Free video playback failed: ${freePlayData.error}`);
  }
  console.log('  -> Free video playable! URL/embed returned:', freePlayData.url || freePlayData.embedUrl);
  console.log('✓ Check 3 PASSED: Free video playback allowed for unauthenticated user.\n');

  // -------------------------------------------------------------
  // Test 4: Play PAID video while logged out
  // -------------------------------------------------------------
  console.log('[Test 4] Play PAID video while logged out...');
  const paidLoggedOutRes = await fetch(`http://localhost:3000/api/student/videos/${paidVideoId}/play`);
  if (paidLoggedOutRes.status !== 401) {
    throw new Error(`Expected HTTP 401 for logged out paid video access, got ${paidLoggedOutRes.status}`);
  }
  console.log('  -> Paid video access while logged out returned HTTP 401 Unauthorized.');
  console.log('✓ Check 4 PASSED: Paid video protected against unauthenticated users.\n');

  // -------------------------------------------------------------
  // Test 5: Play PAID video while logged in but without purchase
  // -------------------------------------------------------------
  console.log('[Test 5] Play PAID video while logged in without purchase...');
  const paidNoPurchaseRes = await fetch(`http://localhost:3000/api/student/videos/${paidVideoId}/play`, {
    headers: { Cookie: studentCookie },
  });
  const paidNoPurchaseData = await paidNoPurchaseRes.json();
  if (paidNoPurchaseRes.status !== 403 || paidNoPurchaseData.categoryId !== categoryId) {
    throw new Error(`Expected HTTP 403 with categoryId, got ${paidNoPurchaseRes.status}: ${JSON.stringify(paidNoPurchaseData)}`);
  }
  console.log('  -> Returned HTTP 403 Forbidden with categoryId:', paidNoPurchaseData.categoryId);
  console.log('✓ Check 5 PASSED: Paid video blocked for non-purchasers.\n');

  // -------------------------------------------------------------
  // Test 6: Submit duplicate reference number
  // -------------------------------------------------------------
  console.log('[Test 6] Submit duplicate reference number...');
  const refNum = `CBE_TEST_REF_${Date.now()}`;

  // First submission
  const sub1Res = await fetch(`http://localhost:3000/api/student/courses/${categoryId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({ reference_number: refNum }),
  });
  if (!sub1Res.ok) throw new Error(`Initial purchase submission failed: ${(await sub1Res.json()).error}`);

  // Duplicate submission with same refNum
  const dupUser = await prisma.user.create({
    data: { email: `dup_${Date.now()}@example.com`, name: 'Dup', password_hash: 'h', role: 'user' },
  });
  const dupCookie = `elearning_session=${await createSession(dupUser.id, dupUser.role, dupUser.email)}`;

  const subDupRes = await fetch(`http://localhost:3000/api/student/courses/${categoryId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: dupCookie },
    body: JSON.stringify({ reference_number: refNum }),
  });
  const subDupData = await subDupRes.json();
  if (subDupRes.status !== 400 || subDupData.error !== 'Reference number has already been submitted') {
    throw new Error(`Expected clean error 'Reference number has already been submitted', got: ${subDupData.error}`);
  }
  console.log('  -> Duplicate submission returned clean error:', subDupData.error);
  console.log('✓ Check 6 PASSED: Duplicate reference number submission rejected cleanly.\n');

  // -------------------------------------------------------------
  // Test 7: Submit second purchase while one is pending
  // -------------------------------------------------------------
  console.log('[Test 7] Submit second purchase while one is pending...');
  const sub2Res = await fetch(`http://localhost:3000/api/student/courses/${categoryId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({ reference_number: `CBE_TEST_REF2_${Date.now()}` }),
  });
  const sub2Data = await sub2Res.json();
  if (sub2Res.status !== 400 || sub2Data.error !== 'You already have a payment under review') {
    throw new Error(`Expected 'You already have a payment under review', got: ${sub2Data.error}`);
  }
  console.log('  -> Returned expected error:', sub2Data.error);
  console.log('✓ Check 7 PASSED: Multiple pending submissions blocked.\n');

  console.log('=============================================================');
  console.log('🎉 ALL PHASE 3 BROWSING & ACCESS CONTROL VERIFICATION TESTS PASSED!');
  console.log('=============================================================');
}

runPhase3VerificationTests()
  .catch((err) => {
    console.error('❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  });
