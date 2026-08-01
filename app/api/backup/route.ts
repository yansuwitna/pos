import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Helper untuk mengubah string ISO Date kembali ke Javascript Date Object secara otomatis
function formatBackupDates(items: any[] | undefined) {
  if (!items || !Array.isArray(items)) return [];
  return items.map(item => {
    const newItem = { ...item };
    for (const key of Object.keys(newItem)) {
      if ((key.endsWith('At') || key === 'date') && typeof newItem[key] === 'string') {
        const parsedDate = new Date(newItem[key]);
        if (!isNaN(parsedDate.getTime())) {
          newItem[key] = parsedDate;
        }
      }
    }
    return newItem;
  });
}

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

    // Jika storeId ditentukan (backup khusus toko tertentu):
    if (targetStoreId) {
      const storeObj = await prisma.store.findUnique({ where: { id: targetStoreId } });
      const data: any = {
        store: storeObj,
        users: await prisma.user.findMany({ where: { storeId: targetStoreId, role: { not: 'ADMIN' } } }),
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

    // Full system export untuk Super Admin jika tanpa parameter storeId
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

    let payload = await req.json();

    // Dukung struktur JSON langsung maupun yang terbungkus { success: true, data: {...} }
    if (payload && payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      payload = payload.data;
    }
    const backupData = payload;

    // Validasi struktur utama file backup
    if (!backupData || (!backupData.products && !backupData.categories && !backupData.transactions && !backupData.stores)) {
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

    if (targetStoreId) {
      const currentStore = await prisma.store.findUnique({ where: { id: targetStoreId } });
      
      // Validasi Isolasi Toko: File backup Toko 1 TIDAK BISA digunakan untuk Toko 2!
      const backupStoreId = backupData.store?.id || backupData.storeId;
      const backupStoreCode = backupData.store?.code || backupData.storeCode;
      const backupStoreName = backupData.store?.name || backupData.storeName;

      if (backupStoreId && backupStoreId !== targetStoreId) {
        return Response.json({
          success: false,
          message: `Gagal Restore: File backup ini milik "${backupStoreName || backupStoreCode || 'Toko Lain'}" (${backupStoreCode || ''}), tidak dapat digunakan pada "${currentStore?.name}" (${currentStore?.code}).`
        }, { status: 400 });
      }

      if (backupStoreCode && currentStore?.code && backupStoreCode !== currentStore.code) {
        return Response.json({
          success: false,
          message: `Gagal Restore: Kode toko pada file backup (${backupStoreCode}) tidak cocok dengan toko ini (${currentStore.code}).`
        }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      if (targetStoreId) {
        // --- RESTORE PER TOKO (STORE ISOLATION) ---
        const storeId = targetStoreId;

        // 1. Hapus data lama khusus toko ini (urutan child -> parent)
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
        await tx.user.deleteMany({ where: { storeId, role: { notIn: ['ADMIN', 'SUPER_ADMIN'] } } });

        // 2. Helper assign storeId & konversi Tanggal
        const prepareData = (items: any[]) => formatBackupDates(items?.map(item => ({ ...item, storeId })));

        const categories = prepareData(backupData.categories);
        const suppliers = prepareData(backupData.suppliers);
        const customers = prepareData(backupData.customers);
        const products = prepareData(backupData.products);

        if (categories.length > 0) await tx.category.createMany({ data: categories, skipDuplicates: true });
        if (suppliers.length > 0) await tx.supplier.createMany({ data: suppliers, skipDuplicates: true });
        if (customers.length > 0) await tx.customer.createMany({ data: customers, skipDuplicates: true });
        if (products.length > 0) await tx.product.createMany({ data: products, skipDuplicates: true });

        if (backupData.users?.length > 0) {
          const usersToInsert = prepareData(backupData.users).filter((u: any) => u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN');
          if (usersToInsert.length > 0) await tx.user.createMany({ data: usersToInsert, skipDuplicates: true });
        }

        const transactions = prepareData(backupData.transactions);
        const transactionItems = formatBackupDates(backupData.transactionItems);
        const receivablePayments = prepareData(backupData.receivablePayments);

        if (transactions.length > 0) await tx.transaction.createMany({ data: transactions, skipDuplicates: true });
        if (transactionItems.length > 0) await tx.transactionItem.createMany({ data: transactionItems, skipDuplicates: true });
        if (receivablePayments.length > 0) await tx.receivablePayment.createMany({ data: receivablePayments, skipDuplicates: true });

        const purchases = prepareData(backupData.purchases);
        const purchaseItems = formatBackupDates(backupData.purchaseItems);
        const debtPayments = prepareData(backupData.debtPayments);

        if (purchases.length > 0) await tx.purchase.createMany({ data: purchases, skipDuplicates: true });
        if (purchaseItems.length > 0) await tx.purchaseItem.createMany({ data: purchaseItems, skipDuplicates: true });
        if (debtPayments.length > 0) await tx.debtPayment.createMany({ data: debtPayments, skipDuplicates: true });

        const returns = prepareData(backupData.returns);
        const returnItems = formatBackupDates(backupData.returnItems);

        if (returns.length > 0) await tx.return.createMany({ data: returns, skipDuplicates: true });
        if (returnItems.length > 0) await tx.returnItem.createMany({ data: returnItems, skipDuplicates: true });

        const orders = prepareData(backupData.orders);
        const orderItems = formatBackupDates(backupData.orderItems);

        if (orders.length > 0) await tx.order.createMany({ data: orders, skipDuplicates: true });
        if (orderItems.length > 0) await tx.orderItem.createMany({ data: orderItems, skipDuplicates: true });

        const stockOpnames = prepareData(backupData.stockOpnames);
        const stockOpnameItems = formatBackupDates(backupData.stockOpnameItems);

        if (stockOpnames.length > 0) await tx.stockOpname.createMany({ data: stockOpnames, skipDuplicates: true });
        if (stockOpnameItems.length > 0) await tx.stockOpnameItem.createMany({ data: stockOpnameItems, skipDuplicates: true });

        const expenses = prepareData(backupData.expenses);
        const discountRules = prepareData(backupData.discountRules);
        const capitals = prepareData(backupData.capitals);

        if (expenses.length > 0) await tx.expense.createMany({ data: expenses, skipDuplicates: true });
        if (discountRules.length > 0) await tx.discountRule.createMany({ data: discountRules, skipDuplicates: true });
        if (capitals.length > 0) await tx.capital.createMany({ data: capitals, skipDuplicates: true });
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

        const stores = formatBackupDates(backupData.stores);
        const systemSettings = formatBackupDates(backupData.systemSettings);
        const users = formatBackupDates(backupData.users);
        const categories = formatBackupDates(backupData.categories);
        const suppliers = formatBackupDates(backupData.suppliers);
        const customers = formatBackupDates(backupData.customers);
        const products = formatBackupDates(backupData.products);

        if (stores.length > 0) await tx.store.createMany({ data: stores, skipDuplicates: true });
        if (systemSettings.length > 0) await tx.systemSetting.createMany({ data: systemSettings, skipDuplicates: true });
        if (users.length > 0) await tx.user.createMany({ data: users, skipDuplicates: true });
        if (categories.length > 0) await tx.category.createMany({ data: categories, skipDuplicates: true });
        if (suppliers.length > 0) await tx.supplier.createMany({ data: suppliers, skipDuplicates: true });
        if (customers.length > 0) await tx.customer.createMany({ data: customers, skipDuplicates: true });
        if (products.length > 0) await tx.product.createMany({ data: products, skipDuplicates: true });

        const transactions = formatBackupDates(backupData.transactions);
        const transactionItems = formatBackupDates(backupData.transactionItems);
        const receivablePayments = formatBackupDates(backupData.receivablePayments);

        if (transactions.length > 0) await tx.transaction.createMany({ data: transactions, skipDuplicates: true });
        if (transactionItems.length > 0) await tx.transactionItem.createMany({ data: transactionItems, skipDuplicates: true });
        if (receivablePayments.length > 0) await tx.receivablePayment.createMany({ data: receivablePayments, skipDuplicates: true });

        const purchases = formatBackupDates(backupData.purchases);
        const purchaseItems = formatBackupDates(backupData.purchaseItems);
        const debtPayments = formatBackupDates(backupData.debtPayments);

        if (purchases.length > 0) await tx.purchase.createMany({ data: purchases, skipDuplicates: true });
        if (purchaseItems.length > 0) await tx.purchaseItem.createMany({ data: purchaseItems, skipDuplicates: true });
        if (debtPayments.length > 0) await tx.debtPayment.createMany({ data: debtPayments, skipDuplicates: true });

        const returns = formatBackupDates(backupData.returns);
        const returnItems = formatBackupDates(backupData.returnItems);

        if (returns.length > 0) await tx.return.createMany({ data: returns, skipDuplicates: true });
        if (returnItems.length > 0) await tx.returnItem.createMany({ data: returnItems, skipDuplicates: true });

        const orders = formatBackupDates(backupData.orders);
        const orderItems = formatBackupDates(backupData.orderItems);

        if (orders.length > 0) await tx.order.createMany({ data: orders, skipDuplicates: true });
        if (orderItems.length > 0) await tx.orderItem.createMany({ data: orderItems, skipDuplicates: true });

        const stockOpnames = formatBackupDates(backupData.stockOpnames);
        const stockOpnameItems = formatBackupDates(backupData.stockOpnameItems);

        if (stockOpnames.length > 0) await tx.stockOpname.createMany({ data: stockOpnames, skipDuplicates: true });
        if (stockOpnameItems.length > 0) await tx.stockOpnameItem.createMany({ data: stockOpnameItems, skipDuplicates: true });

        const expenses = formatBackupDates(backupData.expenses);
        const discountRules = formatBackupDates(backupData.discountRules);
        const capitals = formatBackupDates(backupData.capitals);

        if (expenses.length > 0) await tx.expense.createMany({ data: expenses, skipDuplicates: true });
        if (discountRules.length > 0) await tx.discountRule.createMany({ data: discountRules, skipDuplicates: true });
        if (capitals.length > 0) await tx.capital.createMany({ data: capitals, skipDuplicates: true });
      }
    }, {
      maxWait: 15000,
      timeout: 60000
    });

    return Response.json({ success: true, message: "Database toko berhasil dipulihkan dari file backup." });
  } catch (error: any) {
    console.error("Restore Error:", error);
    return Response.json({ success: false, message: error.message || "Gagal memulihkan database toko." }, { status: 500 });
  }
}
