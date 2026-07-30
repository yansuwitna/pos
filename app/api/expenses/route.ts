import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    let whereClause: any = {};
    if (session?.storeId && session.role !== 'SUPER_ADMIN') {
      whereClause.storeId = session.storeId;
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, name: true, username: true } }
      }
    });
    return Response.json({ success: true, expenses });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { category, amount, description, date, userId: requestUserId } = await req.json();
    
    if (!category || !amount) {
      return Response.json({ success: false, message: "Kategori dan Nominal wajib diisi" }, { status: 400 });
    }

    const userId = requestUserId || session?.id || null;
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

    const expense = await prisma.expense.create({
      data: { 
        category, 
        amount: parseFloat(amount), 
        description, 
        date: date ? new Date(date) : new Date(),
        userId: userId,
        storeId: storeId
      }
    });
    return Response.json({ success: true, expense });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
