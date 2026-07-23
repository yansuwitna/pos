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
      await tx.transactionItem.deleteMany();
      await tx.transaction.deleteMany();
      
      await tx.returnItem.deleteMany();
      await tx.return.deleteMany();
      
      await tx.purchaseItem.deleteMany();
      await tx.purchase.deleteMany();

      await tx.orderItem.deleteMany();
      await tx.order.deleteMany();

      await tx.product.deleteMany();
      await tx.category.deleteMany();
      await tx.supplier.deleteMany();
      
      await tx.user.deleteMany({
        where: { role: { not: 'ADMIN' } }
      });
    });

    return Response.json({ success: true, message: "Database berhasil dikosongkan. Hanya akun Admin yang tersisa." });
  } catch (error: any) {
    console.error(error);
    return Response.json({ success: false, message: error?.message || "Terjadi kesalahan internal" }, { status: 500 });
  }
}
