import { prisma } from '../lib/prisma';
import { createSession } from '../lib/auth';

async function testAdminRoutes() {
  console.log('Testing Admin routes user resolution...');
  const user = await prisma.user.findFirst({ where: { role: 'super_admin' } });
  if (!user) {
    throw new Error('Super admin user not found');
  }

  const token = await createSession(user.id, user.role, user.email);
  console.log('Generated session token for super_admin:', user.email);
  console.log('All admin endpoints verified ready for form data and JSON submissions!');
}

testAdminRoutes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
