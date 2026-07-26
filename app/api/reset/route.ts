import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.role !== 'ADMIN') {
      return Response.json({ success: false, message: "Akses ditolak. Hanya Admin yang bisa mereset database." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Hapus berurutan agar foreign key tidak bermasalah
      
      // 1. Hapus data transaksi dan relasinya
      await tx.transactionItem.deleteMany();
      await tx.transaction.deleteMany();
      
      await tx.returnItem.deleteMany();
      await tx.return.deleteMany();
      
      await tx.purchaseItem.deleteMany();
      await tx.purchase.deleteMany();

      await tx.orderItem.deleteMany();
      await tx.order.deleteMany();
      
      // 2. Hapus data stok opname dan keuangan
      await tx.stockOpnameItem.deleteMany();
      await tx.stockOpname.deleteMany();
      
      await tx.expense.deleteMany();
      
      await tx.receivablePayment.deleteMany();
      await tx.debtPayment.deleteMany();
      await tx.capital.deleteMany();

      // 3. Hapus data master
      await tx.product.deleteMany();
      await tx.category.deleteMany();
      await tx.supplier.deleteMany();
      await tx.customer.deleteMany();
      await tx.discountRule.deleteMany();
      
      // 4. Hapus user selain ADMIN (gunakan id dari session agar 100% aman jika ada bug Enum)
      await tx.user.deleteMany({
        where: { 
          AND: [
            { role: { not: 'ADMIN' } },
            { id: { not: session?.id } }
          ]
        }
      });
      
      // Pastikan minimal ada 1 admin tersisa
      const adminCount = await tx.user.count({ where: { role: 'ADMIN' } });
      if (adminCount === 0) {
        await tx.user.create({
          data: {
            username: 'admin',
            password: 'password',
            name: 'Admin Recovery',
            role: 'ADMIN'
          }
        });
      }
    });

    return Response.json({ success: true, message: "Database berhasil dikosongkan. Hanya akun Admin yang tersisa." });
  } catch (error: any) {
    console.error(error);
    return Response.json({ success: false, message: error?.message || "Terjadi kesalahan internal" }, { status: 500 });
  }
}
