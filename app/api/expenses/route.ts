import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
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
    const { category, amount, description, date, userId } = await req.json();
    
    if (!category || !amount) {
      return Response.json({ success: false, message: "Kategori dan Nominal wajib diisi" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: { 
        category, 
        amount: parseFloat(amount), 
        description, 
        date: date ? new Date(date) : new Date(),
        userId: userId || null
      }
    });
    return Response.json({ success: true, expense });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
