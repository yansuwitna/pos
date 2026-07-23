import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const purchases = await prisma.purchase.findMany({
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
    const { items, supplierId, createdAt } = await req.json();

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

    // Gunakan Prisma Transaction untuk menyimpan Purchase dan Update Stock Product
    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Buat Purchase
      const newPurchase = await tx.purchase.create({
        data: {
          userId: userId!,
          supplierId: supplierId || null,
          totalCost: totalCost,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          items: {
            create: purchaseItemsData
          }
        }
      });

      // 2. Update stock setiap produk
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: { increment: item.quantity }
          }
        });
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
