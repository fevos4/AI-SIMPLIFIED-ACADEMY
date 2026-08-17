import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { s3Client } from '@/lib/storage';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import bcrypt from 'bcryptjs';

async function runPhase4VerificationTests() {
  console.log('=== RUNNING PHASE 4 ADMIN DASHBOARD & CONTENT MANAGEMENT TESTS ===\n');

  // Prepare admin & super_admin test sessions
  const superAdminUser = await prisma.user.findFirst({ where: { role: 'super_admin' } });
  if (!superAdminUser) throw new Error('Super admin user missing from DB seed');

  const superAdminCookie = `elearning_session=${await createSession(superAdminUser.id, superAdminUser.role, superAdminUser.email)}`;

  // Create a regular admin user
  const regularAdminEmail = `admin_test_${Date.now()}@example.com`;
  const regularAdminUser = await prisma.user.create({
    data: {
      email: regularAdminEmail,
      name: 'Regular Admin',
      password_hash: await bcrypt.hash('AdminPassword123!', 10),
      role: 'admin',
      email_verified: true,
    },
  });
  const regularAdminCookie = `elearning_session=${await createSession(regularAdminUser.id, regularAdminUser.role, regularAdminUser.email)}`;

  const bucketName = process.env.STORAGE_BUCKET || 'elearning';

  // -------------------------------------------------------------
  // Test 1: Create category with cover image presigned upload
  // -------------------------------------------------------------
  console.log('[Test 1] Create category with cover image direct upload...');
  const coverFileName = 'cover_test.png';
  
  // Get upload URL
  const uploadUrlRes = await fetch('http://localhost:3000/api/admin/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({ fileName: coverFileName, contentType: 'image/png' }),
  });
  const uploadUrlData = await uploadUrlRes.json();
  if (!uploadUrlRes.ok || !uploadUrlData.uploadUrl || !uploadUrlData.objectKey) {
    throw new Error(`Upload URL generation failed: ${uploadUrlData.error}`);
  }

  // Direct PUT to MinIO/B2 S3
  const putRes = await fetch(uploadUrlData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: Buffer.from('fake image content'),
  });
  if (!putRes.ok) throw new Error(`Direct PUT upload failed with status ${putRes.status}`);

  // Create Category record
  const createCatRes = await fetch('http://localhost:3000/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      name: `Category Test ${Date.now()}`,
      description: 'Phase 4 test category',
      price: 450,
      cover_image_path: uploadUrlData.objectKey,
    }),
  });
  const createCatData = await createCatRes.json();
  if (!createCatRes.ok) throw new Error(`Category creation failed: ${createCatData.error}`);
  const createdCategory = createCatData.category;
  console.log('  -> Category created in DB:', createdCategory.id);
  console.log('✓ Check 1 PASSED: Category & cover image uploaded successfully.\n');

  // -------------------------------------------------------------
  // Test 2: Add lesson to category
  // -------------------------------------------------------------
  console.log('[Test 2] Add lesson to category...');
  const createLessonRes = await fetch('http://localhost:3000/api/admin/lessons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      category_id: createdCategory.id,
      name: 'Lesson Unit 1',
      description: 'Test lesson',
    }),
  });
  const createLessonData = await createLessonRes.json();
  if (!createLessonRes.ok) throw new Error(`Lesson creation failed: ${createLessonData.error}`);
  const createdLesson = createLessonData.lesson;
  console.log('  -> Lesson created in DB:', createdLesson.id);
  console.log('✓ Check 2 PASSED: Lesson added to category.\n');

  // -------------------------------------------------------------
  // Test 3: Add self-hosted video to lesson
  // -------------------------------------------------------------
  console.log('[Test 3] Add self-hosted video (after upload confirmation)...');
  const videoFileName = 'lecture.mp4';
  const videoUploadRes = await fetch('http://localhost:3000/api/admin/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({ filename: videoFileName, contentType: 'video/mp4' }), // Test alternate filename casing
  });
  const videoUploadData = await videoUploadRes.json();

  // Upload binary content to S3
  await fetch(videoUploadData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4' },
    body: Buffer.from('fake mp4 video stream data'),
  });

  // Create Video DB record AFTER upload completion
  const createVideoRes = await fetch('http://localhost:3000/api/admin/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      lesson_id: createdLesson.id,
      title: 'Self-Hosted Video Lecture',
      source_type: 'self_hosted',
      file_path: videoUploadData.objectKey,
      is_free: false,
    }),
  });
  const createVideoData = await createVideoRes.json();
  if (!createVideoRes.ok) throw new Error(`Self hosted video creation failed: ${createVideoData.error}`);
  const selfHostedVideo = createVideoData.video;
  console.log('  -> Self hosted video created in DB after upload:', selfHostedVideo.id);
  console.log('✓ Check 3 PASSED: Self-hosted video uploaded & created.\n');

  // -------------------------------------------------------------
  // Test 4: Add embed video with is_free = false
  // -------------------------------------------------------------
  console.log('[Test 4] Add embed video with is_free = false...');
  const createEmbedRes = await fetch('http://localhost:3000/api/admin/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      lesson_id: createdLesson.id,
      title: 'Embedded Paid Video',
      source_type: 'embed',
      embed_url: 'https://www.youtube.com/embed/xyz123',
      is_free: false,
    }),
  });
  const createEmbedData = await createEmbedRes.json();
  if (!createEmbedRes.ok || createEmbedData.video.is_free !== false) {
    throw new Error('Embed video failed or forced is_free override occurred');
  }
  const embedVideo = createEmbedData.video;
  console.log('  -> Embed video created with is_free = false intact:', embedVideo.id);
  console.log('✓ Check 4 PASSED: Embed video saved without forced is_free override.\n');

  // -------------------------------------------------------------
  // Test 5: Edit video metadata
  // -------------------------------------------------------------
  console.log('[Test 5] Edit video metadata...');
  const patchVideoRes = await fetch(`http://localhost:3000/api/admin/videos/${embedVideo.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({ title: 'Updated Embed Video Title', is_free: true }),
  });
  const patchVideoData = await patchVideoRes.json();
  if (!patchVideoRes.ok || patchVideoData.video.title !== 'Updated Embed Video Title' || patchVideoData.video.is_free !== true) {
    throw new Error(`Video metadata patch failed: ${JSON.stringify(patchVideoData)}`);
  }
  console.log('  -> Video title & is_free updated in DB:', patchVideoData.video.title);
  console.log('✓ Check 5 PASSED: Video metadata edited.\n');

  // -------------------------------------------------------------
  // Test 6: Delete video (DB row + storage file)
  // -------------------------------------------------------------
  console.log('[Test 6] Delete video (DB row & storage file cleanup)...');
  const deleteVidRes = await fetch(`http://localhost:3000/api/admin/videos/${selfHostedVideo.id}`, {
    method: 'DELETE',
    headers: { Cookie: superAdminCookie },
  });
  if (!deleteVidRes.ok) throw new Error('Delete video failed');

  // Verify DB deletion
  const checkDbVid = await prisma.courseVideo.findUnique({ where: { id: selfHostedVideo.id } });
  if (checkDbVid) throw new Error('Video still exists in DB after deletion');

  // Verify Storage deletion
  let fileExistsInStorage = true;
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: selfHostedVideo.file_path! }));
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      fileExistsInStorage = false;
    }
  }
  if (fileExistsInStorage) throw new Error('Storage file was not deleted from S3 bucket');
  console.log('  -> Video DB record and S3 storage object removed cleanly.');
  console.log('✓ Check 6 PASSED: Video & storage file deleted.\n');

  // -------------------------------------------------------------
  // Test 7: Approve pending purchase
  // -------------------------------------------------------------
  console.log('[Test 7] Approve pending purchase...');
  const purchaser = await prisma.user.create({
    data: { email: `purchaser1_${Date.now()}@example.com`, name: 'Purchaser 1', password_hash: 'h', role: 'user' },
  });
  const purchase1 = await prisma.coursePurchase.create({
    data: {
      user_id: purchaser.id,
      category_id: createdCategory.id,
      reference_number: `REF_APP_${Date.now()}`,
      amount_claimed: 450,
      status: 'pending_verification',
    },
  });

  const approveRes = await fetch(`http://localhost:3000/api/admin/purchases/${purchase1.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({ action: 'approve' }),
  });
  const approveData = await approveRes.json();
  if (!approveRes.ok || approveData.purchase.status !== 'verified') {
    throw new Error(`Purchase approval failed: ${approveData.error}`);
  }
  console.log('  -> Purchase status updated to verified with reviewer ID:', approveData.purchase.reviewed_by);
  console.log('✓ Check 7 PASSED: Purchase approved.\n');

  // -------------------------------------------------------------
  // Test 8: Reject pending purchase
  // -------------------------------------------------------------
  console.log('[Test 8] Reject pending purchase...');
  const purchase2 = await prisma.coursePurchase.create({
    data: {
      user_id: purchaser.id,
      category_id: createdCategory.id,
      reference_number: `REF_REJ_${Date.now()}`,
      amount_claimed: 450,
      status: 'pending_verification',
    },
  });

  const rejectRes = await fetch(`http://localhost:3000/api/admin/purchases/${purchase2.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({ action: 'reject', rejection_reason: 'CBE reference number invalid' }),
  });
  const rejectData = await rejectRes.json();
  if (!rejectRes.ok || rejectData.purchase.status !== 'rejected' || rejectData.purchase.rejection_reason !== 'CBE reference number invalid') {
    throw new Error(`Purchase rejection failed: ${rejectData.error}`);
  }
  console.log('  -> Purchase status updated to rejected with reason:', rejectData.purchase.rejection_reason);
  console.log('✓ Check 8 PASSED: Purchase rejected with reason.\n');

  // -------------------------------------------------------------
  // Test 9: Access /api/admin/manage-admins as role = admin
  // -------------------------------------------------------------
  console.log('[Test 9] Access /api/admin/manage-admins as role = admin (not super_admin)...');
  const manageAdminAsAdminRes = await fetch('http://localhost:3000/api/admin/manage-admins', {
    headers: { Cookie: regularAdminCookie },
  });
  if (manageAdminAsAdminRes.status !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden for admin role on manage-admins, got ${manageAdminAsAdminRes.status}`);
  }
  console.log('  -> HTTP 403 Forbidden returned for non-super_admin user.');
  console.log('✓ Check 9 PASSED: Manage-admins route restricted to super_admin.\n');

  // -------------------------------------------------------------
  // Test 10: Create new admin account as super_admin & verify login
  // -------------------------------------------------------------
  console.log('[Test 10] Create new admin account as super_admin & verify login...');
  const newAdminEmail = `new_admin_${Date.now()}@example.com`;
  const newAdminPassword = 'NewAdminPassword123!';

  const createAdminRes = await fetch('http://localhost:3000/api/admin/manage-admins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      name: 'Created Admin',
      email: newAdminEmail,
      password: newAdminPassword,
      role: 'admin',
    }),
  });
  const createAdminData = await createAdminRes.json();
  if (!createAdminRes.ok || createAdminData.admin.role !== 'admin') {
    throw new Error(`Admin account creation failed: ${createAdminData.error}`);
  }

  // Attempt login with newly created admin account via /admin context
  const newAdminLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword, isAdminContext: true }),
  });
  const newAdminLoginData = await newAdminLoginRes.json();
  if (!newAdminLoginRes.ok || newAdminLoginData.role !== 'admin') {
    throw new Error(`Created admin login failed: ${newAdminLoginData.error}`);
  }
  console.log('  -> Created admin account successfully logged in via /admin context.');
  console.log('✓ Check 10 PASSED: New admin account created & verified login.\n');

  console.log('=============================================================');
  console.log('🎉 ALL 10 ADMIN DASHBOARD VERIFICATION CHECKS PASSED!');
  console.log('=============================================================');
}

runPhase4VerificationTests()
  .catch((err) => {
    console.error('❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  });
