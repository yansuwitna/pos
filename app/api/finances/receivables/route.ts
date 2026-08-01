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

    const receivables = await prisma.transaction.findMany({
      where: {
        ...storeFilter,
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
