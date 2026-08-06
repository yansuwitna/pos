import { prisma } from '@/lib/prisma';
import LoginClient from './login-client';

export default async function Home() {
  let adminExists = false;
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    adminExists = !!admin;
  } catch (error) {
    console.error('Error querying super admin on home page:', error);
  }

  return <LoginClient adminExists={adminExists} />;
}
