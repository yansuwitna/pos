import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let storeFilter: any = {};
    if (session.role !== 'SUPER_ADMIN' && session.storeId) {
      storeFilter = { storeId: session.storeId };
    }

    const debts = await prisma.purchase.findMany({
      where: {
        ...storeFilter,
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
