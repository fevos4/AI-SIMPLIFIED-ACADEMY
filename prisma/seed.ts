import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating database seed with real AI Learning Hub courses...');

  // Clean existing data
  await prisma.courseVideo.deleteMany({});
  await prisma.courseLesson.deleteMany({});
  await prisma.coursePurchase.deleteMany({});
  await prisma.courseCategory.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Super Admin User
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@elearning.com',
      name: 'Super Admin',
      password_hash: adminPasswordHash,
      email_verified: true,
      role: 'super_admin',
    },
  });

  console.log('Created Super Admin user:', superAdmin.email);

  // -------------------------------------------------------------
  // Category 1: AI Fundamentals
  // -------------------------------------------------------------
  const cat1 = await prisma.courseCategory.create({
    data: {
      name: 'AI Fundamentals',
      description: 'Master core Artificial Intelligence concepts, Large Language Models, capabilities, and everyday applications.',
      price: 500,
      coming_soon: false,
      position: 1,
      created_by: superAdmin.id,
    },
  });

  const c1Lesson1 = await prisma.courseLesson.create({
    data: {
      category_id: cat1.id,
      name: 'Module 1: Introduction & LLM Concepts',
      description: 'Understanding Artificial Intelligence, Generative AI, and Large Language Models.',
      position: 1,
      published: true,
      created_by: superAdmin.id,
    },
  });

  const c1Lesson2 = await prisma.courseLesson.create({
    data: {
      category_id: cat1.id,
      name: 'Module 2: Practical AI & Limitations',
      description: 'Navigating AI hallucinations, real-world workplace applications, and terminology.',
      position: 2,
      published: true,
      created_by: superAdmin.id,
    },
  });

  // Videos for AI Fundamentals Module 1
  const cat1VideosM1 = [
    { title: 'What is Artificial Intelligence?', is_free: true, duration: 180 },
    { title: 'What is Generative AI?', is_free: true, duration: 210 },
    { title: 'How AI Actually Works', is_free: false, duration: 320 },
    { title: 'AI vs. Traditional Software', is_free: false, duration: 250 },
    { title: 'What Are Large Language Models (LLMs)?', is_free: false, duration: 400 },
    { title: 'What Are ChatGPT, Gemini, Claude & Copilot?', is_free: false, duration: 350 },
  ];

  for (let i = 0; i < cat1VideosM1.length; i++) {
    const v = cat1VideosM1[i];
    await prisma.courseVideo.create({
      data: {
        lesson_id: c1Lesson1.id,
        title: v.title,
        description: `In-depth exploration of ${v.title.toLowerCase()}.`,
        source_type: 'self_hosted',
        file_path: `videos/ai_fund_m1_v${i + 1}.mp4`,
        format: 'landscape',
        is_free: v.is_free,
        downloadable: false,
        duration_seconds: v.duration,
        position: i + 1,
        uploaded_by: superAdmin.id,
      },
    });
  }

  // Videos for AI Fundamentals Module 2
  const cat1VideosM2 = [
    { title: 'What AI Can and Cannot Do', is_free: false, duration: 280 },
    { title: 'AI Hallucinations', is_free: false, duration: 310 },
    { title: 'AI Limitations', is_free: false, duration: 240 },
    { title: 'AI in Everyday Life', is_free: false, duration: 290 },
    { title: 'AI in the Workplace', is_free: false, duration: 360 },
    { title: 'Understanding AI Terminology', is_free: false, duration: 420 },
  ];

  for (let i = 0; i < cat1VideosM2.length; i++) {
    const v = cat1VideosM2[i];
    await prisma.courseVideo.create({
      data: {
        lesson_id: c1Lesson2.id,
        title: v.title,
        description: `Practical guide on ${v.title.toLowerCase()}.`,
        source_type: 'self_hosted',
        file_path: `videos/ai_fund_m2_v${i + 1}.mp4`,
        format: 'landscape',
        is_free: v.is_free,
        downloadable: false,
        duration_seconds: v.duration,
        position: i + 1,
        uploaded_by: superAdmin.id,
      },
    });
  }

  // -------------------------------------------------------------
  // Category 2: Getting Started with AI
  // -------------------------------------------------------------
  const cat2 = await prisma.courseCategory.create({
    data: {
      name: 'Getting Started with AI',
      description: 'Hands-on beginner guide to setup, chat interfaces, file uploads, image handling, and voice conversations.',
      price: 500,
      coming_soon: false,
      position: 2,
      created_by: superAdmin.id,
    },
  });

  const c2Lesson1 = await prisma.courseLesson.create({
    data: {
      category_id: cat2.id,
      name: 'Module 1: Account Setup & Major Platforms',
      description: 'Setting up accounts and mastering ChatGPT, Gemini, Claude, and Copilot basics.',
      position: 1,
      published: true,
      created_by: superAdmin.id,
    },
  });

  const c2Lesson2 = await prisma.courseLesson.create({
    data: {
      category_id: cat2.id,
      name: 'Module 2: Multimodal Features & Conversations',
      description: 'Asking questions, context retention, file uploads, image tools, and voice modes.',
      position: 2,
      published: true,
      created_by: superAdmin.id,
    },
  });

  const cat2VideosM1 = [
    { title: 'Creating an AI Account', is_free: true, duration: 150 },
    { title: 'ChatGPT Basics', is_free: true, duration: 260 },
    { title: 'Gemini Basics', is_free: false, duration: 240 },
    { title: 'Claude Basics', is_free: false, duration: 270 },
    { title: 'Microsoft Copilot Basics', is_free: false, duration: 250 },
  ];

  for (let i = 0; i < cat2VideosM1.length; i++) {
    const v = cat2VideosM1[i];
    await prisma.courseVideo.create({
      data: {
        lesson_id: c2Lesson1.id,
        title: v.title,
        description: `Step-by-step tutorial on ${v.title.toLowerCase()}.`,
        source_type: 'self_hosted',
        file_path: `videos/get_started_m1_v${i + 1}.mp4`,
        format: 'landscape',
        is_free: v.is_free,
        downloadable: false,
        duration_seconds: v.duration,
        position: i + 1,
        uploaded_by: superAdmin.id,
      },
    });
  }

  const cat2VideosM2 = [
    { title: 'Understanding the AI Chat Interface', is_free: false, duration: 220 },
    { title: 'Asking Your First Question', is_free: false, duration: 190 },
    { title: 'Follow-up Questions', is_free: false, duration: 230 },
    { title: 'Conversations & Context', is_free: false, duration: 310 },
    { title: 'Uploading Files', is_free: false, duration: 280 },
    { title: 'Working with Images', is_free: false, duration: 300 },
    { title: 'Voice Conversations', is_free: false, duration: 270 },
  ];

  for (let i = 0; i < cat2VideosM2.length; i++) {
    const v = cat2VideosM2[i];
    await prisma.courseVideo.create({
      data: {
        lesson_id: c2Lesson2.id,
        title: v.title,
        description: `Hands-on practice covering ${v.title.toLowerCase()}.`,
        source_type: 'self_hosted',
        file_path: `videos/get_started_m2_v${i + 1}.mp4`,
        format: 'landscape',
        is_free: v.is_free,
        downloadable: false,
        duration_seconds: v.duration,
        position: i + 1,
        uploaded_by: superAdmin.id,
      },
    });
  }

  // -------------------------------------------------------------
  // Category 3: Prompt Engineering
  // -------------------------------------------------------------
  const cat3 = await prisma.courseCategory.create({
    data: {
      name: 'Prompt Engineering',
      description: 'Master effective prompt formulas, role-playing, constraints, templates, and advanced prompting techniques.',
      price: 500,
      coming_soon: false,
      position: 3,
      created_by: superAdmin.id,
    },
  });

  const c3Lesson1 = await prisma.courseLesson.create({
    data: {
      category_id: cat3.id,
      name: 'Module 1: Prompt Fundamentals & Structure',
      description: 'Anatomy of a prompt, basic formulas, roles, context, and clear instructions.',
      position: 1,
      published: true,
      created_by: superAdmin.id,
    },
  });

  const c3Lesson2 = await prisma.courseLesson.create({
    data: {
      category_id: cat3.id,
      name: 'Module 2: Advanced Techniques & Libraries',
      description: 'Constraints, examples, formatting, step-by-step reasoning, and prompt libraries.',
      position: 2,
      published: true,
      created_by: superAdmin.id,
    },
  });

  const cat3VideosM1 = [
    { title: 'What Is a Prompt?', is_free: true, duration: 160 },
    { title: 'Anatomy of a Good Prompt', is_free: true, duration: 290 },
    { title: 'The Basic Prompt Formula', is_free: false, duration: 310 },
    { title: 'Giving AI a Role', is_free: false, duration: 270 },
    { title: 'Giving AI Context', is_free: false, duration: 330 },
    { title: 'Giving Clear Instructions', is_free: false, duration: 280 },
  ];

  for (let i = 0; i < cat3VideosM1.length; i++) {
    const v = cat3VideosM1[i];
    await prisma.courseVideo.create({
      data: {
        lesson_id: c3Lesson1.id,
        title: v.title,
        description: `Comprehensive training on ${v.title.toLowerCase()}.`,
        source_type: 'self_hosted',
        file_path: `videos/prompt_eng_m1_v${i + 1}.mp4`,
        format: 'landscape',
        is_free: v.is_free,
        downloadable: false,
        duration_seconds: v.duration,
        position: i + 1,
        uploaded_by: superAdmin.id,
      },
    });
  }

  const cat3VideosM2 = [
    { title: 'Providing Examples', is_free: false, duration: 320 },
    { title: 'Setting Constraints', is_free: false, duration: 260 },
    { title: 'Asking for a Specific Format', is_free: false, duration: 290 },
    { title: 'Step-by-Step Prompting', is_free: false, duration: 340 },
    { title: 'Improving Weak Prompts', is_free: false, duration: 370 },
    { title: 'Prompt Templates', is_free: false, duration: 250 },
    { title: 'Prompt Libraries', is_free: false, duration: 230 },
    { title: 'Advanced Prompting Techniques', is_free: false, duration: 450 },
  ];

  for (let i = 0; i < cat3VideosM2.length; i++) {
    const v = cat3VideosM2[i];
    await prisma.courseVideo.create({
      data: {
        lesson_id: c3Lesson2.id,
        title: v.title,
        description: `Mastering ${v.title.toLowerCase()} for optimal AI outputs.`,
        source_type: 'self_hosted',
        file_path: `videos/prompt_eng_m2_v${i + 1}.mp4`,
        format: 'landscape',
        is_free: v.is_free,
        downloadable: false,
        duration_seconds: v.duration,
        position: i + 1,
        uploaded_by: superAdmin.id,
      },
    });
  }

  console.log('Real AI Learning Hub course data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding AI Learning Hub database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
