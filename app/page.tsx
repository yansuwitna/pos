import { PrismaClient } from '@prisma/client';
import LoginClient from './login-client';

const prisma = new PrismaClient();

export default async function Home() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  return <LoginClient adminExists={!!admin} />;
}
