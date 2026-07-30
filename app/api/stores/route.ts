import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ success: true, stores });
  } catch (error) {
    return Response.json({ success: false, message: 'Failed to fetch stores' }, { status: 500 });
  }
}
