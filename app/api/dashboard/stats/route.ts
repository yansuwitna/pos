import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let whereStore: any = {};
    if (session.role !== 'SUPER_ADMIN' && session.storeId) {
      whereStore = { storeId: session.storeId };
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Jumlah Barang (Seluruhnya untuk toko ini)
    const productCount = await prisma.product.count({
      where: whereStore
    });

    // 2. Jumlah Transaksi Bulan Ini (Toko ini)
    const transactions = await prisma.transaction.findMany({
      where: {
        ...whereStore,
        createdAt: {
          gte: firstDayOfMonth
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: { cost: true }
            }
          }
        }
      }
    });

    const transactionCount = transactions.length;

    // 3. Omset (Total Pendapatan) Bulan Ini
    let totalRevenue = 0;
    let totalCost = 0;

    transactions.forEach(trx => {
      totalRevenue += trx.grandTotal;
      trx.items.forEach(item => {
        totalCost += (item.product?.cost || 0) * item.quantity;
      });
    });

    // 4. Biaya Operasional Bulan Ini (Toko ini)
    const expenses = await prisma.expense.findMany({
      where: {
        ...whereStore,
        date: {
          gte: firstDayOfMonth
        }
      }
    });
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Keuntungan Bersih = Omset - HPP - Biaya Operasional
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpense;

    // 5. Total Hutang (Seluruh Sisa Hutang yang Belum Lunas Milik Toko Ini)
    const unpaidPurchases = await prisma.purchase.findMany({
      where: {
        ...whereStore,
        paymentStatus: { in: ['UNPAID', 'PARTIAL'] }
      }
    });
    const totalDebt = unpaidPurchases.reduce((acc, curr) => acc + (curr.totalCost - curr.amountPaid), 0);

    // 6. Total Piutang (Seluruh Sisa Piutang yang Belum Lunas Milik Toko Ini)
    const unpaidTransactions = await prisma.transaction.findMany({
      where: {
        ...whereStore,
        paymentStatus: { in: ['UNPAID', 'PARTIAL'] }
      }
    });
    const totalReceivable = unpaidTransactions.reduce((acc, curr) => acc + (curr.grandTotal - curr.amountPaid), 0);

    return Response.json({
      success: true,
      data: {
        productCount,
        transactionCount,
        totalRevenue,
        totalExpense,
        grossProfit,
        netProfit,
        totalDebt,
        totalReceivable
      }
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
