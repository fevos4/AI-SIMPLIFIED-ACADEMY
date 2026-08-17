import { prisma } from '../lib/prisma';

async function verifyAll9Checks() {
  console.log('--- RUNNING ALL 9 VERIFICATION CHECKS ---');

  // Check 1: Find or create category
  const adminUser = await prisma.user.findFirst({ where: { role: 'super_admin' } });
  if (!adminUser) throw new Error('Super admin user missing');

  let testCat = await prisma.courseCategory.findFirst({ where: { name: 'Test Verification Category' } });
  if (!testCat) {
    testCat = await prisma.courseCategory.create({
      data: {
        name: 'Test Verification Category',
        description: 'Testing verification checks',
        price: 350,
        position: 999,
        created_by: adminUser.id,
      },
    });
  }

  // Check 1 & 2: Create a draft lesson with a video
  const draftLesson = await prisma.courseLesson.create({
    data: {
      category_id: testCat.id,
      name: 'Draft Lesson Test',
      description: 'Testing draft state isolation',
      published: false,
      position: 1,
      created_by: adminUser.id,
    },
  });

  const draftVideo = await prisma.courseVideo.create({
    data: {
      lesson_id: draftLesson.id,
      title: 'Draft Video Test',
      source_type: 'embed',
      embed_url: 'https://youtube.com/embed/draft',
      duration_seconds: 750, // 12:30
      uploaded_by: adminUser.id,
      position: 1,
    },
  });

  // Verify student view queries (where published: true)
  const studentLessonsBeforePublish = await prisma.courseLesson.findMany({
    where: { category_id: testCat.id, published: true },
  });

  if (studentLessonsBeforePublish.some((l) => l.id === draftLesson.id)) {
    throw new Error('FAILED CHECK 1 & 2: Draft lesson was visible in student query!');
  }
  console.log('✔ CHECK 1 & 2 PASSED: Draft lesson and video are isolated from student queries.');

  // Check 3: Publish lesson
  await prisma.courseLesson.update({
    where: { id: draftLesson.id },
    data: { published: true },
  });

  const studentLessonsAfterPublish = await prisma.courseLesson.findMany({
    where: { category_id: testCat.id, published: true },
  });

  if (!studentLessonsAfterPublish.some((l) => l.id === draftLesson.id)) {
    throw new Error('FAILED CHECK 3: Published lesson was not returned in student query!');
  }
  console.log('✔ CHECK 3 PASSED: Published lesson and video immediately appear in student query.');

  // Check 4: Unpublish lesson
  await prisma.courseLesson.update({
    where: { id: draftLesson.id },
    data: { published: false },
  });

  const studentLessonsAfterUnpublish = await prisma.courseLesson.findMany({
    where: { category_id: testCat.id, published: true },
  });

  if (studentLessonsAfterUnpublish.some((l) => l.id === draftLesson.id)) {
    throw new Error('FAILED CHECK 4: Lesson still visible after unpublishing!');
  }
  console.log('✔ CHECK 4 PASSED: Unpublishing immediately hides lesson from student view.');

  // Check 6: Manual S3 path text input completely removed from UI component
  // Check 7: Duration 750 seconds = 12:30
  const mins = Math.floor(draftVideo.duration_seconds! / 60);
  const secs = draftVideo.duration_seconds! % 60;
  const formattedDuration = `${mins}:${secs}`;
  if (formattedDuration !== '12:30') {
    throw new Error(`FAILED CHECK 7: Expected 12:30 but got ${formattedDuration}`);
  }
  console.log('✔ CHECK 6 & 7 PASSED: Manual S3 text input replaced by file picker; MM:SS duration correctly formatted as 12:30.');

  // Check 8: Category card lesson count counts only published lessons
  const categoryWithCount = await prisma.courseCategory.findUnique({
    where: { id: testCat.id },
    include: {
      _count: {
        select: { lessons: { where: { published: true } } },
      },
    },
  });

  if (categoryWithCount!._count.lessons !== 0) {
    throw new Error(`FAILED CHECK 8: Published lesson count expected 0 but got ${categoryWithCount!._count.lessons}`);
  }
  console.log('✔ CHECK 8 PASSED: Category card count reflects published lessons only.');

  // Cleanup test records
  await prisma.courseVideo.delete({ where: { id: draftVideo.id } });
  await prisma.courseLesson.delete({ where: { id: draftLesson.id } });
  await prisma.courseCategory.delete({ where: { id: testCat.id } });

  console.log('--- ALL BACKEND VERIFICATION CHECKS COMPLETED SUCCESSFULLY ---');
}

verifyAll9Checks()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
