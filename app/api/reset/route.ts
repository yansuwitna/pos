import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return Response.json({ success: false, message: "Akses ditolak. Hanya Admin yang bisa mereset database." }, { status: 403 });
    }

    let storeId = session.storeId as string | undefined;

    if (!storeId && session.id) {
      const userObj = await prisma.user.findUnique({
        where: { id: session.id },
        select: { storeId: true }
      });
      storeId = userObj?.storeId || undefined;
    }

    await prisma.$transaction(async (tx) => {
      if (storeId) {
        // Hapus data yang terikat khusus ke toko ini (Store Isolation)
        
        // 1. Hapus child items transaksi & operasional toko ini
        await tx.transactionItem.deleteMany({ where: { transaction: { storeId } } });
        await tx.purchaseItem.deleteMany({ where: { purchase: { storeId } } });
        await tx.returnItem.deleteMany({ where: { return: { storeId } } });
        await tx.orderItem.deleteMany({ where: { order: { storeId } } });
        await tx.stockOpnameItem.deleteMany({ where: { opname: { storeId } } });

        // 2. Hapus data keuangan & pembayaran toko ini
        await tx.receivablePayment.deleteMany({ where: { storeId } });
        await tx.debtPayment.deleteMany({ where: { storeId } });
        await tx.expense.deleteMany({ where: { storeId } });
        await tx.capital.deleteMany({ where: { storeId } });

        // 3. Hapus dokumen utama toko ini
        await tx.transaction.deleteMany({ where: { storeId } });
        await tx.purchase.deleteMany({ where: { storeId } });
        await tx.return.deleteMany({ where: { storeId } });
        await tx.order.deleteMany({ where: { storeId } });
        await tx.stockOpname.deleteMany({ where: { storeId } });

        // 4. Hapus data master toko ini
        await tx.discountRule.deleteMany({ where: { storeId } });
        await tx.product.deleteMany({ where: { storeId } });
        await tx.category.deleteMany({ where: { storeId } });
        await tx.supplier.deleteMany({ where: { storeId } });
        await tx.customer.deleteMany({ where: { storeId } });

        // 5. Hapus kasir / pegawai toko ini (selain user Admin yang sedang login)
        await tx.user.deleteMany({
          where: {
            storeId: storeId,
            id: { not: session.id }
          }
        });
      } else if (session.role === 'SUPER_ADMIN') {
        // Super Admin tanpa toko khusus menghapus seluruh database
        await tx.transactionItem.deleteMany();
        await tx.transaction.deleteMany();
        await tx.returnItem.deleteMany();
        await tx.return.deleteMany();
        await tx.purchaseItem.deleteMany();
        await tx.purchase.deleteMany();
        await tx.orderItem.deleteMany();
        await tx.order.deleteMany();
        await tx.stockOpnameItem.deleteMany();
        await tx.stockOpname.deleteMany();
        await tx.expense.deleteMany();
        await tx.receivablePayment.deleteMany();
        await tx.debtPayment.deleteMany();
        await tx.capital.deleteMany();
        await tx.product.deleteMany();
        await tx.category.deleteMany();
        await tx.supplier.deleteMany();
        await tx.customer.deleteMany();
        await tx.discountRule.deleteMany();
        await tx.user.deleteMany({
          where: {
            AND: [
              { role: { not: 'SUPER_ADMIN' } },
              { id: { not: session.id } }
            ]
          }
        });
      } else {
        throw new Error("Toko tidak ditemukan untuk akun Admin ini.");
      }
    }, {
      maxWait: 10000,
      timeout: 20000
    });

    return Response.json({ 
      success: true, 
      message: storeId ? "Seluruh data operasional toko Anda telah berhasil dikosongkan." : "Seluruh database berhasil dikosongkan." 
    });
  } catch (error: any) {
    console.error("Reset Error:", error);
    return Response.json({ success: false, message: error?.message || "Terjadi kesalahan internal saat mereset data" }, { status: 500 });
  }
}
