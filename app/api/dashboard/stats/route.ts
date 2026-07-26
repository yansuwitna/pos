import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Jumlah Barang (Seluruhnya)
    const productCount = await prisma.product.count();

    // 2. Jumlah Transaksi Bulan Ini
    const transactions = await prisma.transaction.findMany({
      where: {
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
      totalRevenue += trx.total;
      trx.items.forEach(item => {
        totalCost += (item.product?.cost || 0) * item.quantity;
      });
    });

    // 4. Biaya Operasional Bulan Ini
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: firstDayOfMonth
        }
      }
    });
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Keuntungan Bersih = Omset - HPP - Biaya Operasional
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpense;

    // 5. Total Hutang (Seluruh Sisa Hutang yang Belum Lunas)
    const unpaidPurchases = await prisma.purchase.findMany({
      where: {
        paymentStatus: { in: ['UNPAID', 'PARTIAL'] }
      }
    });
    const totalDebt = unpaidPurchases.reduce((acc, curr) => acc + (curr.totalCost - curr.amountPaid), 0);

    // 6. Total Piutang (Seluruh Sisa Piutang yang Belum Lunas)
    const unpaidTransactions = await prisma.transaction.findMany({
      where: {
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
