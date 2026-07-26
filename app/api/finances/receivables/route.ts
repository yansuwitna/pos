import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const receivables = await prisma.transaction.findMany({
      where: {
        OR: [
          { paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
          { dueDate: { not: null } }
        ]
      },
      include: {
        customer: { select: { name: true } },
        receivablePayments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ success: true, receivables });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
