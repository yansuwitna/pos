import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { name: 'asc' }
    });

    return Response.json({ success: true, stores });
  } catch (error: any) {
    return Response.json({ success: false, stores: [], message: error?.message }, { status: 500 });
  }
}
