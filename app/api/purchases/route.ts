import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    let whereClause: any = {};
    if (session?.storeId && session.role !== 'SUPER_ADMIN') {
      whereClause.storeId = session.storeId;
    }

    const purchases = await prisma.purchase.findMany({
      where: whereClause,
      include: {
        items: true,
        supplier: { select: { name: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ success: true, purchases });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { items, supplierId, createdAt, amountPaid, dueDate, storeId: reqStoreId } = body;

    if (!items || items.length === 0) {
      return Response.json({ success: false, message: "Keranjang kosong" }, { status: 400 });
    }

    let userId = session?.id as string | undefined;

    if (!userId) {
      const fallbackUser = await prisma.user.findFirst();
      if (!fallbackUser) {
        return Response.json({ success: false, message: "Tidak ada user di database." }, { status: 400 });
      }
      userId = fallbackUser.id;
    }

    let storeId = reqStoreId || session?.storeId;
    if (!storeId && userId) {
      const userObj = await prisma.user.findUnique({ where: { id: userId }, select: { storeId: true } });
      storeId = userObj?.storeId || undefined;
    }
    if (!storeId) {
      const fallbackStore = await prisma.store.findFirst();
      if (!fallbackStore) {
        return Response.json({ success: false, message: "Toko tidak ditemukan." }, { status: 400 });
      }
      storeId = fallbackStore.id;
    }

    let totalCost = 0;
    const purchaseItemsData = items.map((item: any) => {
      const subtotal = item.quantity * item.unitCost;
      totalCost += subtotal;
      return {
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: subtotal
      };
    });

    let paymentStatus = 'PAID';
    let finalAmountPaid = totalCost; // Default lunas

    if (amountPaid !== undefined && amountPaid !== null && amountPaid !== '') {
      finalAmountPaid = Number(amountPaid);
      if (finalAmountPaid < totalCost) {
        if (finalAmountPaid > 0) paymentStatus = 'PARTIAL';
        else paymentStatus = 'UNPAID';
      } else {
        paymentStatus = 'PAID';
      }
    }

    // Gunakan Prisma Transaction untuk menyimpan Purchase dan Update Stock Product
    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Buat Purchase
      const purchaseCreateData: any = {
        storeId: storeId,
        userId: userId!,
        totalCost: totalCost,
        paymentStatus: paymentStatus as any,
        amountPaid: finalAmountPaid,
        dueDate: (finalAmountPaid < totalCost && dueDate) ? new Date(dueDate) : null,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        items: {
          create: purchaseItemsData
        }
      };

      if (supplierId) {
        purchaseCreateData.supplierId = supplierId;
      }

      const newPurchase = await tx.purchase.create({
        data: purchaseCreateData
      });

      // 2. Update stock dan cost setiap produk menggunakan rata-rata bergerak (Moving Average)
      for (const item of items) {
        const currentProduct = await tx.product.findUnique({
          where: { id: item.id }
        });
        
        if (currentProduct && currentProduct.type === 'GOODS') {
          const currentStock = currentProduct.stock;
          const currentCost = currentProduct.cost;
          const newStock = currentStock + item.quantity;
          let newCost = currentCost;
          
          if (newStock > 0) {
            newCost = Math.round(((currentStock * currentCost) + (item.quantity * item.unitCost)) / newStock);
          }
          
          await tx.product.update({
            where: { id: item.id },
            data: {
              stock: newStock,
              cost: newCost
            }
          });
        }
      }

      return newPurchase;
    });

    return Response.json({ success: true, purchase });
  } catch (error: any) {
    console.error('[Purchase Error]', error);
    return Response.json({ 
      success: false, 
      message: error?.message || "Gagal menyimpan data pembelian"
    }, { status: 500 });
  }
}
