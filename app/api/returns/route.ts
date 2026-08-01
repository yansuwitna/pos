import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let whereClause: any = {};
    if (session?.role !== 'SUPER_ADMIN') {
      whereClause.storeId = session?.storeId;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const returns = await prisma.return.findMany({
      where: whereClause,
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
        supplier: { select: { name: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return Response.json({ success: true, returns });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { items, supplierId, notes, createdAt } = body;

    if (!items || items.length === 0) {
      return Response.json({ success: false, message: "Daftar retur kosong" }, { status: 400 });
    }

    let userId = session?.id as string | undefined;

    if (!userId) {
      const fallbackUser = await prisma.user.findFirst();
      if (!fallbackUser) return Response.json({ success: false, message: "User tidak ditemukan." }, { status: 400 });
      userId = fallbackUser.id;
    }

    let storeId = body.storeId || session?.storeId;
    if (!storeId && userId) {
      const userObj = await prisma.user.findUnique({ where: { id: userId }, select: { storeId: true } });
      storeId = userObj?.storeId;
    }
    if (!storeId) {
      const fallbackStore = await prisma.store.findFirst();
      if (!fallbackStore) return Response.json({ success: false, message: "Toko tidak ditemukan." }, { status: 400 });
      storeId = fallbackStore.id;
    }

    const returnItemsData = items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName || item.product?.name || "Barang Retur",
      quantity: item.quantity,
      reason: item.reason
    }));

    // Prisma Transaction untuk Create Return & Decrement Stock
    const newReturn = await prisma.$transaction(async (tx) => {
      // 1. Buat data retur
      const returnDoc = await tx.return.create({
        data: {
          storeId,
          userId: userId!,
          supplierId: supplierId || null,
          notes: notes,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          items: {
            create: returnItemsData
          }
        },
        include: {
          items: true
        }
      });

      // 2. Kurangi stok produk
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity }
          }
        });
      }

      return returnDoc;
    });

    return Response.json({ success: true, return: newReturn });
  } catch (error: any) {
    console.error('[Return Error]', error);
    return Response.json({ success: false, message: error?.message || "Gagal menyimpan retur" }, { status: 500 });
  }
}
