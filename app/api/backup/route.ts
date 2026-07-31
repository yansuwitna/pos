import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

// Fungsi EXPORT (Backup)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const requestedStoreId = searchParams.get('storeId');

    let targetStoreId: string | undefined = undefined;

    if (session?.role === 'SUPER_ADMIN') {
      if (requestedStoreId) {
        targetStoreId = requestedStoreId;
      }
    } else {
      targetStoreId = session?.storeId;
    }

    // Jika storeId ditentukan (restore/backup khusus toko tertentu):
    if (targetStoreId) {
      const storeObj = await prisma.store.findUnique({ where: { id: targetStoreId } });
      const data: any = {
        store: storeObj,
        users: await prisma.user.findMany({ where: { storeId: targetStoreId } }),
        categories: await prisma.category.findMany({ where: { storeId: targetStoreId } }),
        products: await prisma.product.findMany({ where: { storeId: targetStoreId } }),
        suppliers: await prisma.supplier.findMany({ where: { storeId: targetStoreId } }),
        customers: await prisma.customer.findMany({ where: { storeId: targetStoreId } }),
        transactions: await prisma.transaction.findMany({ where: { storeId: targetStoreId } }),
        transactionItems: await prisma.transactionItem.findMany({ where: { transaction: { storeId: targetStoreId } } }),
        receivablePayments: await prisma.receivablePayment.findMany({ where: { storeId: targetStoreId } }),
        purchases: await prisma.purchase.findMany({ where: { storeId: targetStoreId } }),
        purchaseItems: await prisma.purchaseItem.findMany({ where: { purchase: { storeId: targetStoreId } } }),
        debtPayments: await prisma.debtPayment.findMany({ where: { storeId: targetStoreId } }),
        returns: await prisma.return.findMany({ where: { storeId: targetStoreId } }),
        returnItems: await prisma.returnItem.findMany({ where: { return: { storeId: targetStoreId } } }),
        orders: await prisma.order.findMany({ where: { storeId: targetStoreId } }),
        orderItems: await prisma.orderItem.findMany({ where: { order: { storeId: targetStoreId } } }),
        expenses: await prisma.expense.findMany({ where: { storeId: targetStoreId } }),
        stockOpnames: await prisma.stockOpname.findMany({ where: { storeId: targetStoreId } }),
        stockOpnameItems: await prisma.stockOpnameItem.findMany({ where: { opname: { storeId: targetStoreId } } }),
        discountRules: await prisma.discountRule.findMany({ where: { storeId: targetStoreId } }),
        capitals: await prisma.capital.findMany({ where: { storeId: targetStoreId } }),
      };

      return Response.json({ success: true, data });
    }

    // Full system export for Super Admin when no storeId param is passed
    const data: any = {
      stores: await prisma.store.findMany(),
      systemSettings: await prisma.systemSetting.findMany(),
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
      capitals: await prisma.capital.findMany(),
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
    const session = await getSession();
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedStoreId = searchParams.get('storeId');

    const backupData = await req.json();

    // Pastikan ini adalah file backup yang valid dengan mengecek keberadaan kunci (keys) utama
    if (!backupData || (!backupData.products && !backupData.categories && !backupData.transactions)) {
      return Response.json({ success: false, message: "File backup tidak valid atau rusak." }, { status: 400 });
    }

    let targetStoreId: string | undefined = undefined;

    if (session.role === 'SUPER_ADMIN') {
      if (requestedStoreId) {
        targetStoreId = requestedStoreId;
      }
    } else {
      targetStoreId = session.storeId;
      if (!targetStoreId && session.id) {
        const userObj = await prisma.user.findUnique({
          where: { id: session.id },
          select: { storeId: true }
        });
        targetStoreId = userObj?.storeId || undefined;
      }
    }

    await prisma.$transaction(async (tx) => {
      if (targetStoreId) {
        // --- RESTORE PER TOKO (STORE ISOLATION) ---
        const storeId = targetStoreId;

        // 1. Delete existing data for this store only
        await tx.transactionItem.deleteMany({ where: { transaction: { storeId } } });
        await tx.purchaseItem.deleteMany({ where: { purchase: { storeId } } });
        await tx.returnItem.deleteMany({ where: { return: { storeId } } });
        await tx.orderItem.deleteMany({ where: { order: { storeId } } });
        await tx.stockOpnameItem.deleteMany({ where: { opname: { storeId } } });

        await tx.receivablePayment.deleteMany({ where: { storeId } });
        await tx.debtPayment.deleteMany({ where: { storeId } });
        await tx.expense.deleteMany({ where: { storeId } });
        await tx.capital.deleteMany({ where: { storeId } });

        await tx.transaction.deleteMany({ where: { storeId } });
        await tx.purchase.deleteMany({ where: { storeId } });
        await tx.return.deleteMany({ where: { storeId } });
        await tx.order.deleteMany({ where: { storeId } });
        await tx.stockOpname.deleteMany({ where: { storeId } });

        await tx.discountRule.deleteMany({ where: { storeId } });
        await tx.product.deleteMany({ where: { storeId } });
        await tx.category.deleteMany({ where: { storeId } });
        await tx.customer.deleteMany({ where: { storeId } });
        await tx.supplier.deleteMany({ where: { storeId } });
        await tx.user.deleteMany({ where: { storeId, id: { not: session.id } } });

        // 2. Helper to assign storeId
        const ensureStore = (items: any[]) => items?.map(item => ({ ...item, storeId })) || [];

        if (backupData.categories?.length > 0) await tx.category.createMany({ data: ensureStore(backupData.categories), skipDuplicates: true });
        if (backupData.suppliers?.length > 0) await tx.supplier.createMany({ data: ensureStore(backupData.suppliers), skipDuplicates: true });
        if (backupData.customers?.length > 0) await tx.customer.createMany({ data: ensureStore(backupData.customers), skipDuplicates: true });
        if (backupData.products?.length > 0) await tx.product.createMany({ data: ensureStore(backupData.products), skipDuplicates: true });

        if (backupData.users?.length > 0) {
          const usersToInsert = ensureStore(backupData.users).filter((u: any) => u.id !== session.id);
          if (usersToInsert.length > 0) await tx.user.createMany({ data: usersToInsert, skipDuplicates: true });
        }

        if (backupData.transactions?.length > 0) await tx.transaction.createMany({ data: ensureStore(backupData.transactions), skipDuplicates: true });
        if (backupData.transactionItems?.length > 0) await tx.transactionItem.createMany({ data: backupData.transactionItems, skipDuplicates: true });
        if (backupData.receivablePayments?.length > 0) await tx.receivablePayment.createMany({ data: ensureStore(backupData.receivablePayments), skipDuplicates: true });

        if (backupData.purchases?.length > 0) await tx.purchase.createMany({ data: ensureStore(backupData.purchases), skipDuplicates: true });
        if (backupData.purchaseItems?.length > 0) await tx.purchaseItem.createMany({ data: backupData.purchaseItems, skipDuplicates: true });
        if (backupData.debtPayments?.length > 0) await tx.debtPayment.createMany({ data: ensureStore(backupData.debtPayments), skipDuplicates: true });

        if (backupData.returns?.length > 0) await tx.return.createMany({ data: ensureStore(backupData.returns), skipDuplicates: true });
        if (backupData.returnItems?.length > 0) await tx.returnItem.createMany({ data: backupData.returnItems, skipDuplicates: true });

        if (backupData.orders?.length > 0) await tx.order.createMany({ data: ensureStore(backupData.orders), skipDuplicates: true });
        if (backupData.orderItems?.length > 0) await tx.orderItem.createMany({ data: backupData.orderItems, skipDuplicates: true });

        if (backupData.stockOpnames?.length > 0) await tx.stockOpname.createMany({ data: ensureStore(backupData.stockOpnames), skipDuplicates: true });
        if (backupData.stockOpnameItems?.length > 0) await tx.stockOpnameItem.createMany({ data: backupData.stockOpnameItems, skipDuplicates: true });

        if (backupData.expenses?.length > 0) await tx.expense.createMany({ data: ensureStore(backupData.expenses), skipDuplicates: true });
        if (backupData.discountRules?.length > 0) await tx.discountRule.createMany({ data: ensureStore(backupData.discountRules), skipDuplicates: true });
        if (backupData.capitals?.length > 0) await tx.capital.createMany({ data: ensureStore(backupData.capitals), skipDuplicates: true });
      } else {
        // --- RESTORE SUPER ADMIN (FULL SYSTEM WIPE & RESTORE) ---
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
        await tx.capital.deleteMany();
        await tx.user.deleteMany();
        await tx.store.deleteMany();

        if (backupData.stores?.length > 0) await tx.store.createMany({ data: backupData.stores, skipDuplicates: true });
        if (backupData.systemSettings?.length > 0) await tx.systemSetting.createMany({ data: backupData.systemSettings, skipDuplicates: true });
        if (backupData.users?.length > 0) await tx.user.createMany({ data: backupData.users, skipDuplicates: true });
        if (backupData.categories?.length > 0) await tx.category.createMany({ data: backupData.categories, skipDuplicates: true });
        if (backupData.suppliers?.length > 0) await tx.supplier.createMany({ data: backupData.suppliers, skipDuplicates: true });
        if (backupData.customers?.length > 0) await tx.customer.createMany({ data: backupData.customers, skipDuplicates: true });
        if (backupData.products?.length > 0) await tx.product.createMany({ data: backupData.products, skipDuplicates: true });

        if (backupData.transactions?.length > 0) await tx.transaction.createMany({ data: backupData.transactions, skipDuplicates: true });
        if (backupData.transactionItems?.length > 0) await tx.transactionItem.createMany({ data: backupData.transactionItems, skipDuplicates: true });
        if (backupData.receivablePayments?.length > 0) await tx.receivablePayment.createMany({ data: ensureStore(backupData.receivablePayments), skipDuplicates: true });

        if (backupData.purchases?.length > 0) await tx.purchase.createMany({ data: backupData.purchases, skipDuplicates: true });
        if (backupData.purchaseItems?.length > 0) await tx.purchaseItem.createMany({ data: backupData.purchaseItems, skipDuplicates: true });
        if (backupData.debtPayments?.length > 0) await tx.debtPayment.createMany({ data: backupData.debtPayments, skipDuplicates: true });

        if (backupData.returns?.length > 0) await tx.return.createMany({ data: backupData.returns, skipDuplicates: true });
        if (backupData.returnItems?.length > 0) await tx.returnItem.createMany({ data: backupData.returnItems, skipDuplicates: true });

        if (backupData.orders?.length > 0) await tx.order.createMany({ data: backupData.orders, skipDuplicates: true });
        if (backupData.orderItems?.length > 0) await tx.orderItem.createMany({ data: backupData.orderItems, skipDuplicates: true });

        if (backupData.stockOpnames?.length > 0) await tx.stockOpname.createMany({ data: backupData.stockOpnames, skipDuplicates: true });
        if (backupData.stockOpnameItems?.length > 0) await tx.stockOpnameItem.createMany({ data: backupData.stockOpnameItems, skipDuplicates: true });

        if (backupData.expenses?.length > 0) await tx.expense.createMany({ data: backupData.expenses, skipDuplicates: true });
        if (backupData.discountRules?.length > 0) await tx.discountRule.createMany({ data: backupData.discountRules, skipDuplicates: true });
        if (backupData.capitals?.length > 0) await tx.capital.createMany({ data: backupData.capitals, skipDuplicates: true });
      }
    }, {
      maxWait: 10000,
      timeout: 30000
    });

    return Response.json({ success: true, message: "Database toko berhasil dipulihkan dari file backup." });
  } catch (error: any) {
    console.error("Restore Error:", error);
    return Response.json({ success: false, message: error.message || "Gagal memulihkan database toko." }, { status: 500 });
  }
}
