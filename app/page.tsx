import { prisma } from '@/lib/prisma';
import LoginClient from './login-client';

export default async function Home() {
  let adminExists = false;
  let stores: { id: string; code: string; name: string }[] = [];

  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    adminExists = !!admin;

    stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error querying data on home page:', error);
  }

  return <LoginClient adminExists={adminExists} initialStores={stores} />;
}
