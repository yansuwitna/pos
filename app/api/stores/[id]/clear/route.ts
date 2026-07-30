import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    
    // Only SUPER_ADMIN can wipe store data
    if (session?.role !== 'SUPER_ADMIN') {
      return Response.json({ success: false, message: 'Unauthorized. Hanya Super Admin yang dapat melakukan ini.' }, { status: 403 });
    }

    const storeId = params.id;
    if (!storeId) {
      return Response.json({ success: false, message: 'Store ID tidak valid' }, { status: 400 });
    }

    // Check if store exists
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return Response.json({ success: false, message: 'Toko tidak ditemukan' }, { status: 404 });
    }

    // Execute in a transaction to ensure all or nothing is deleted
    await prisma.$transaction(async (tx) => {
      // 1. Delete child items without cascade or those that depend on transactions/orders
      await tx.transactionItem.deleteMany({ where: { transaction: { storeId } } });
      await tx.purchaseItem.deleteMany({ where: { purchase: { storeId } } });
      
      // Items that have cascade will be automatically deleted if we delete parents, 
      // but to be absolutely safe and clear, we delete them via relation or just rely on cascade.
      // Let's delete the parents explicitly for those that are isolated, or delete children just in case.
      
      // 2. Delete Payments
      await tx.receivablePayment.deleteMany({ where: { storeId } });
      await tx.debtPayment.deleteMany({ where: { storeId } });

      // 3. Delete Main Transactions
      await tx.transaction.deleteMany({ where: { storeId } });
      await tx.purchase.deleteMany({ where: { storeId } });
      await tx.return.deleteMany({ where: { storeId } }); // Cascade handles return items
      await tx.order.deleteMany({ where: { storeId } }); // Cascade handles order items
      await tx.expense.deleteMany({ where: { storeId } });
      await tx.stockOpname.deleteMany({ where: { storeId } }); // Cascade handles opname items
      await tx.capital.deleteMany({ where: { storeId } });

      // 4. Delete Master Data
      await tx.discountRule.deleteMany({ where: { storeId } });
      await tx.product.deleteMany({ where: { storeId } });
      await tx.category.deleteMany({ where: { storeId } });
      await tx.customer.deleteMany({ where: { storeId } });
      await tx.supplier.deleteMany({ where: { storeId } });
    }, {
      maxWait: 10000, // 10 seconds max wait for transaction
      timeout: 20000  // 20 seconds timeout since deleting a lot of data might take time
    });

    return Response.json({ success: true, message: 'Seluruh data operasional toko berhasil dikosongkan.' });
  } catch (error: any) {
    console.error("Error wiping store data:", error);
    return Response.json({ success: false, message: 'Terjadi kesalahan saat mengosongkan data. Pastikan tidak ada data yang tersangkut.' }, { status: 500 });
  }
}
