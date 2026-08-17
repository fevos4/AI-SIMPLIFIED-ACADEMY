import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.count();
  const categories = await prisma.courseCategory.count();
  const lessons = await prisma.courseLesson.count();
  const videos = await prisma.courseVideo.count();

  console.log('--- SEED VERIFICATION ---');
  console.log('Users count:', users);
  console.log('Categories count:', categories);
  console.log('Lessons count:', lessons);
  console.log('Videos count:', videos);

  const sampleUser = await prisma.user.findFirst({ where: { role: 'super_admin' } });
  console.log('Super Admin user:', sampleUser?.email, '| verified:', sampleUser?.email_verified);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
