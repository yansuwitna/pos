import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = {};
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

    const capital = await prisma.capital.create({
      data: {
        amount: Number(amount),
        description: description || "Modal Awal",
        date: date ? new Date(date) : new Date(),
        userId: userId
      }
    });

    return Response.json({ success: true, capital });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
