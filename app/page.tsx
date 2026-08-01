import { prisma } from '@/lib/prisma';
import LoginClient from './login-client';

export default async function Home() {
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  return <LoginClient adminExists={!!admin} />;
}
