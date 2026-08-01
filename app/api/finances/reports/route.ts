import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let storeFilter: any = {};
    if (session.role !== 'SUPER_ADMIN' && session.storeId) {
      storeFilter = { storeId: session.storeId };
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = { ...storeFilter };
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    // 1. PENDAPATAN (Penjualan)
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { items: { include: { product: true } } }
    });

    let totalPendapatan = 0;
    let totalHPP = 0; // Harga Pokok Penjualan (Modal)
    
    transactions.forEach(t => {
      totalPendapatan += t.grandTotal;
      t.items.forEach(item => {
        totalHPP += (item.product?.cost || 0) * item.quantity;
      });
    });

    let labaKotor = totalPendapatan - totalHPP;

    // 2. BEBAN (Pengeluaran Operasional)
    let expenseWhereClause: any = { ...storeFilter };
    if (startDate && endDate) {
      expenseWhereClause.date = {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    const expenses = await prisma.expense.findMany({ where: expenseWhereClause });
    let totalBeban = 0;
    expenses.forEach(e => totalBeban += e.amount);

    let labaBersih = labaKotor - totalBeban;

    // --- NERACA (Semua waktu, milik toko ini) ---
    
    // A. Kas di Tangan
    const allCapitals = await prisma.capital.findMany({ where: storeFilter });
    const allTransactions = await prisma.transaction.findMany({ where: storeFilter });
    const allReceivablePayments = await prisma.receivablePayment.findMany({ where: storeFilter });
    let totalKasMasuk = 0;
    
    allCapitals.forEach(c => totalKasMasuk += c.amount);

    allTransactions.forEach(t => {
      totalKasMasuk += (t.payment - t.change);
    });
    allReceivablePayments.forEach(p => totalKasMasuk += p.amount);

    // Kas Keluar
    const allPurchases = await prisma.purchase.findMany({ where: storeFilter });
    const allDebtPayments = await prisma.debtPayment.findMany({ where: storeFilter });
    const allExpenses = await prisma.expense.findMany({ where: storeFilter });
    
    let totalKasKeluar = 0;
    allPurchases.forEach(p => {
      if (p.amountPaid > 0) {
        totalKasKeluar += p.amountPaid;
      } else if (p.paymentStatus === 'PAID') {
        totalKasKeluar += p.totalCost;
      }
    });
    allDebtPayments.forEach(p => totalKasKeluar += p.amount);
    allExpenses.forEach(e => totalKasKeluar += e.amount);

    let kasSaatIni = totalKasMasuk - totalKasKeluar;

    // B. Piutang Usaha
    let totalPiutang = 0;
    allTransactions.forEach(t => {
      const validAmountPaid = Math.min(t.grandTotal, t.amountPaid);
      totalPiutang += (t.grandTotal - validAmountPaid);
    });

    // C. Persediaan Barang (Inventory Value)
    const allProducts = await prisma.product.findMany({ where: storeFilter });
    let nilaiPersediaan = 0;
    allProducts.forEach(p => {
      nilaiPersediaan += (p.stock * p.cost);
    });

    const totalAktiva = kasSaatIni + totalPiutang + nilaiPersediaan;

    // D. Kewajiban (Hutang Usaha)
    let totalHutang = 0;
    allPurchases.forEach(p => {
      totalHutang += (p.totalCost - p.amountPaid);
    });

    // E. Ekuitas
    const ekuitas = totalAktiva - totalHutang;

    return Response.json({
      success: true,
      data: {
        labaRugi: {
          pendapatan: totalPendapatan,
          hpp: totalHPP,
          labaKotor,
          beban: totalBeban,
          labaBersih
        },
        neraca: {
          aktiva: {
            kas: kasSaatIni,
            piutang: totalPiutang,
            persediaan: nilaiPersediaan,
            totalAktiva
          },
          pasiva: {
            hutang: totalHutang,
            ekuitas,
            totalPasiva: totalHutang + ekuitas
          }
        }
      }
    });

  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
