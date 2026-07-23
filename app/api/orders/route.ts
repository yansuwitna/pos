import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (session?.role !== 'ADMIN' && session?.role !== 'WAREHOUSE') {
      return Response.json({ success: false, message: "Akses ditolak" }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        user: true,
        items: {
          include: { product: true }
        }
      }
    });

    return Response.json({ success: true, orders });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.role !== 'WAREHOUSE' && session?.role !== 'ADMIN') {
      return Response.json({ success: false, message: "Akses ditolak" }, { status: 403 });
    }

    const userId = session.id;
    const { items, supplierId, notes, createdAt } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({ success: false, message: "Daftar pesanan kosong" }, { status: 400 });
    }

    const orderItemsData = items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName || item.product?.name || "Barang Pesanan",
      quantity: item.quantity
    }));

    // Buat data order TANPA mengubah stok produk
    const orderDoc = await prisma.order.create({
      data: {
        userId: userId!,
        supplierId: supplierId || null,
        notes: notes,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        items: {
          create: orderItemsData
        }
      },
      include: {
        supplier: true,
        user: true,
        items: {
          include: { product: true }
        }
      }
    });

    return Response.json({ success: true, order: orderDoc, message: "Pesanan berhasil dicatat" });
  } catch (error: any) {
    console.error("Order POST Error:", error);
    return Response.json({ success: false, message: error?.message || "Terjadi kesalahan saat menyimpan pesanan" }, { status: 500 });
  }
}
