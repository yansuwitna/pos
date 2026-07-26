import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const debts = await prisma.purchase.findMany({
      where: {
        OR: [
          { paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
          { dueDate: { not: null } }
        ]
      },
      include: {
        supplier: { select: { name: true } },
        debtPayments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ success: true, debts });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
