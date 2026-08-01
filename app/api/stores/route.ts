import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stores = await prisma.store.findMany({
      include: {
        users: {
          select: { id: true, username: true, name: true, role: true }
        },
        _count: {
          select: {
            users: true,
            products: true,
            transactions: true,
          },
        },
        transactions: {
          include: {
            items: {
              include: {
                product: {
                  select: { cost: true }
                }
              }
            }
          }
        },
        expenses: true,
        purchases: {
          where: { paymentStatus: { in: ['UNPAID', 'PARTIAL'] } }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedStores = stores.map(store => {
      let totalRevenue = 0;
      let totalCost = 0;
      let totalReceivable = 0;

      store.transactions.forEach(t => {
        totalRevenue += t.grandTotal;
        if (t.paymentStatus === 'UNPAID' || t.paymentStatus === 'PARTIAL') {
          totalReceivable += (t.grandTotal - Math.min(t.grandTotal, t.amountPaid));
        }
        t.items.forEach(item => {
          totalCost += (item.product?.cost || 0) * item.quantity;
        });
      });

      const totalExpense = store.expenses.reduce((acc, curr) => acc + curr.amount, 0);
      const grossProfit = totalRevenue - totalCost;
      const netProfit = grossProfit - totalExpense;

      const totalDebt = store.purchases.reduce((acc, curr) => acc + (curr.totalCost - curr.amountPaid), 0);

      const { transactions, expenses, purchases, ...rest } = store;

      return {
        ...rest,
        stats: {
          transactionCount: store._count.transactions,
          totalRevenue,
          grossProfit,
          totalExpense,
          netProfit,
          totalDebt,
          totalReceivable
        }
      };
    });

    const globalStats = formattedStores.reduce((acc, s) => {
      acc.transactionCount += s.stats.transactionCount;
      acc.totalRevenue += s.stats.totalRevenue;
      acc.grossProfit += s.stats.grossProfit;
      acc.totalExpense += s.stats.totalExpense;
      acc.netProfit += s.stats.netProfit;
      acc.totalDebt += s.stats.totalDebt;
      acc.totalReceivable += s.stats.totalReceivable;
      return acc;
    }, {
      transactionCount: 0,
      totalRevenue: 0,
      grossProfit: 0,
      totalExpense: 0,
      netProfit: 0,
      totalDebt: 0,
      totalReceivable: 0
    });

    return Response.json({ success: true, stores: formattedStores, globalStats });
  } catch (error) {
    return Response.json({ success: false, message: 'Failed to fetch stores' }, { status: 500 });
  }
}
