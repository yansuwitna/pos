import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = {};
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
        // HPP dihitung dari (harga modal x qty terjual)
        totalHPP += (item.product?.cost || 0) * item.quantity;
      });
    });

    let labaKotor = totalPendapatan - totalHPP;

    // 2. BEBAN (Pengeluaran Operasional)
    let expenseWhereClause: any = {};
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

    // --- NERACA (Semua waktu, tidak peduli startDate/endDate) ---
    
    // A. Kas di Tangan
    // Kas Masuk = Modal Awal + Pembayaran Tunai Transaksi + Pembayaran Cicilan Piutang
    const allCapitals = await prisma.capital.findMany();
    const allTransactions = await prisma.transaction.findMany();
    const allReceivablePayments = await prisma.receivablePayment.findMany();
    let totalKasMasuk = 0;
    
    // Tambahkan semua Suntikan Modal
    allCapitals.forEach(c => totalKasMasuk += c.amount);

    allTransactions.forEach(t => {
      // Kas nyata yang masuk adalah jumlah uang yang dibayar dikurangi kembalian
      totalKasMasuk += (t.payment - t.change);
    });
    allReceivablePayments.forEach(p => totalKasMasuk += p.amount);

    // Kas Keluar = Pembayaran Tunai Pembelian + Pembayaran Cicilan Hutang + Semua Pengeluaran
    const allPurchases = await prisma.purchase.findMany();
    const allDebtPayments = await prisma.debtPayment.findMany();
    const allExpenses = await prisma.expense.findMany();
    
    let totalKasKeluar = 0;
    allPurchases.forEach(p => {
      // Fallback ke totalCost jika amountPaid 0 tapi statusnya PAID (untuk data lama)
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
      // Pastikan amountPaid tidak melebihi grandTotal (untuk menghindari piutang negatif pada data lama)
      const validAmountPaid = Math.min(t.grandTotal, t.amountPaid);
      totalPiutang += (t.grandTotal - validAmountPaid);
    });

    // C. Persediaan Barang (Inventory Value)
    const allProducts = await prisma.product.findMany();
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

    // E. Ekuitas (Modal Sendiri = Aktiva - Kewajiban)
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
