import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = {};
    if (session?.storeId && session.role !== 'SUPER_ADMIN') {
      whereClause.storeId = session.storeId;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const capitals = await prisma.capital.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    return Response.json({ success: true, capitals });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { amount, description, date } = await req.json();

    if (!amount || amount === 0) {
      return Response.json({ success: false, message: "Nominal tidak boleh 0" }, { status: 400 });
    }

    let userId = session?.id as string | undefined;

    // Fallback if no session
    if (!userId) {
      const fallbackUser = await prisma.user.findFirst();
      if (!fallbackUser) {
        return Response.json({ success: false, message: "Tidak ada user di database." }, { status: 400 });
      }
      userId = fallbackUser.id;
    }

    let storeId = session?.storeId as string | undefined;
    if (!storeId && userId) {
      const userObj = await prisma.user.findUnique({ where: { id: userId }, select: { storeId: true } });
      storeId = userObj?.storeId || undefined;
    }

    if (!storeId) {
      const fallbackStore = await prisma.store.findFirst();
      if (!fallbackStore) {
        return Response.json({ success: false, message: "Toko tidak ditemukan." }, { status: 400 });
      }
      storeId = fallbackStore.id;
    }

    const capital = await prisma.capital.create({
      data: {
        amount: Number(amount),
        description: description || "Modal Awal",
        date: date ? new Date(date) : new Date(),
        userId: userId,
        storeId: storeId
      }
    });

    return Response.json({ success: true, capital });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
