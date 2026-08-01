import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    
    // Hanya Super Admin yang dapat menghapus toko
    if (session?.role !== 'SUPER_ADMIN') {
      return Response.json({ success: false, message: 'Unauthorized. Hanya Super Admin yang dapat melakukan tindakan ini.' }, { status: 403 });
    }

    const storeId = params.id;
    if (!storeId) {
      return Response.json({ success: false, message: 'Store ID tidak valid' }, { status: 400 });
    }

    // Pastikan toko ada di database
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return Response.json({ success: false, message: 'Toko tidak ditemukan' }, { status: 404 });
    }

    // Jalankan transaksi untuk menghapus seluruh data yang berhubungan dan tokonya sekaligus
    await prisma.$transaction(async (tx) => {
      // 1. Hapus item anak dari dokumen transaksi/pembelian/retur/order/opname
      await tx.transactionItem.deleteMany({ where: { transaction: { storeId } } });
      await tx.purchaseItem.deleteMany({ where: { purchase: { storeId } } });
      await tx.returnItem.deleteMany({ where: { return: { storeId } } });
      await tx.orderItem.deleteMany({ where: { order: { storeId } } });
      await tx.stockOpnameItem.deleteMany({ where: { opname: { storeId } } });

      // 2. Hapus data pembayaran dan keuangan
      await tx.receivablePayment.deleteMany({ where: { storeId } });
      await tx.debtPayment.deleteMany({ where: { storeId } });
      await tx.expense.deleteMany({ where: { storeId } });
      await tx.capital.deleteMany({ where: { storeId } });

      // 3. Hapus dokumen utama
      await tx.transaction.deleteMany({ where: { storeId } });
      await tx.purchase.deleteMany({ where: { storeId } });
      await tx.return.deleteMany({ where: { storeId } });
      await tx.order.deleteMany({ where: { storeId } });
      await tx.stockOpname.deleteMany({ where: { storeId } });

      // 4. Hapus data master
      await tx.discountRule.deleteMany({ where: { storeId } });
      await tx.product.deleteMany({ where: { storeId } });
      await tx.category.deleteMany({ where: { storeId } });
      await tx.customer.deleteMany({ where: { storeId } });
      await tx.supplier.deleteMany({ where: { storeId } });

      // 5. Hapus semua akun user yang terikat ke toko ini
      await tx.user.deleteMany({ where: { storeId } });

      // 6. Hapus data Toko itu sendiri
      await tx.store.delete({ where: { id: storeId } });
    }, {
      maxWait: 10000,
      timeout: 20000
    });

    return Response.json({ success: true, message: `Toko ${store.name} (${store.code}) beserta seluruh datanya berhasil dihapus permanen.` });
  } catch (error: any) {
    console.error("Error deleting store:", error);
    return Response.json({ success: false, message: error?.message || 'Gagal menghapus toko.' }, { status: 500 });
  }
}
