import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fungsi EXPORT (Backup)
export async function GET() {
  try {
    const data = {
      users: await prisma.user.findMany(),
      categories: await prisma.category.findMany(),
      products: await prisma.product.findMany(),
      suppliers: await prisma.supplier.findMany(),
      customers: await prisma.customer.findMany(),
      transactions: await prisma.transaction.findMany(),
      transactionItems: await prisma.transactionItem.findMany(),
      receivablePayments: await prisma.receivablePayment.findMany(),
      purchases: await prisma.purchase.findMany(),
      purchaseItems: await prisma.purchaseItem.findMany(),
      debtPayments: await prisma.debtPayment.findMany(),
      returns: await prisma.return.findMany(),
      returnItems: await prisma.returnItem.findMany(),
      orders: await prisma.order.findMany(),
      orderItems: await prisma.orderItem.findMany(),
      expenses: await prisma.expense.findMany(),
      stockOpnames: await prisma.stockOpname.findMany(),
      stockOpnameItems: await prisma.stockOpnameItem.findMany(),
      discountRules: await prisma.discountRule.findMany(),
    };

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Backup Error:", error);
    return Response.json({ success: false, message: "Gagal membuat file backup." }, { status: 500 });
  }
}

// Fungsi IMPORT (Restore)
export async function POST(req: Request) {
  try {
    const backupData = await req.json();

    // Pastikan ini adalah file backup yang valid dengan mengecek keberadaan kunci (keys) utama
    if (!backupData || !backupData.products || !backupData.users) {
      return Response.json({ success: false, message: "File backup tidak valid atau rusak." }, { status: 400 });
    }

    // Gunakan transaksi untuk menghapus semua data dan memasukkan data baru
    // Urutan penghapusan sangat penting untuk menghindari Foreign Key Constraint error.
    // Hapus dari tabel anak (child) terlebih dahulu, baru tabel induk (parent).
    await prisma.$transaction(async (tx) => {
      // 1. DELETE ALL DATA (Child first, then Parent)
      await tx.transactionItem.deleteMany();
      await tx.receivablePayment.deleteMany();
      await tx.transaction.deleteMany();
      
      await tx.purchaseItem.deleteMany();
      await tx.debtPayment.deleteMany();
      await tx.purchase.deleteMany();
      
      await tx.returnItem.deleteMany();
      await tx.return.deleteMany();
      
      await tx.orderItem.deleteMany();
      await tx.order.deleteMany();
      
      await tx.stockOpnameItem.deleteMany();
      await tx.stockOpname.deleteMany();
      
      await tx.expense.deleteMany();
      
      await tx.product.deleteMany();
      await tx.category.deleteMany();
      await tx.supplier.deleteMany();
      await tx.customer.deleteMany();
      await tx.discountRule.deleteMany();
      await tx.user.deleteMany();

      // 2. INSERT BACKUP DATA
      // Urutan insert dari tabel induk (parent) ke anak (child)
      if (backupData.users?.length > 0) await tx.user.createMany({ data: backupData.users });
      if (backupData.categories?.length > 0) await tx.category.createMany({ data: backupData.categories });
      if (backupData.suppliers?.length > 0) await tx.supplier.createMany({ data: backupData.suppliers });
      if (backupData.customers?.length > 0) await tx.customer.createMany({ data: backupData.customers });
      if (backupData.products?.length > 0) await tx.product.createMany({ data: backupData.products });
      
      if (backupData.transactions?.length > 0) await tx.transaction.createMany({ data: backupData.transactions });
      if (backupData.transactionItems?.length > 0) await tx.transactionItem.createMany({ data: backupData.transactionItems });
      if (backupData.receivablePayments?.length > 0) await tx.receivablePayment.createMany({ data: backupData.receivablePayments });
      
      if (backupData.purchases?.length > 0) await tx.purchase.createMany({ data: backupData.purchases });
      if (backupData.purchaseItems?.length > 0) await tx.purchaseItem.createMany({ data: backupData.purchaseItems });
      if (backupData.debtPayments?.length > 0) await tx.debtPayment.createMany({ data: backupData.debtPayments });
      
      if (backupData.returns?.length > 0) await tx.return.createMany({ data: backupData.returns });
      if (backupData.returnItems?.length > 0) await tx.returnItem.createMany({ data: backupData.returnItems });
      
      if (backupData.orders?.length > 0) await tx.order.createMany({ data: backupData.orders });
      if (backupData.orderItems?.length > 0) await tx.orderItem.createMany({ data: backupData.orderItems });
      
      if (backupData.stockOpnames?.length > 0) await tx.stockOpname.createMany({ data: backupData.stockOpnames });
      if (backupData.stockOpnameItems?.length > 0) await tx.stockOpnameItem.createMany({ data: backupData.stockOpnameItems });
      
      if (backupData.expenses?.length > 0) await tx.expense.createMany({ data: backupData.expenses });
      
      if (backupData.discountRules?.length > 0) await tx.discountRule.createMany({ data: backupData.discountRules });
    }, {
      maxWait: 10000,
      timeout: 30000 // Berikan waktu yang cukup panjang untuk restore data besar
    });

    return Response.json({ success: true, message: "Database berhasil dipulihkan dari file backup." });
  } catch (error: any) {
    console.error("Restore Error:", error);
    return Response.json({ success: false, message: error.message || "Gagal memulihkan database." }, { status: 500 });
  }
}
