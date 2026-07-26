import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        items: { include: { product: { select: { name: true, cost: true } } } },
        user: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ success: true, transactions });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message || "Gagal mengambil laporan transaksi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { items, payment, customerId, dueDate, discount = 0 } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({ success: false, message: "Keranjang kosong" }, { status: 400 });
    }

    // Ambil user dari session, fallback ke admin jika belum ada session
    let userId = session?.id as string | undefined;

    // Jika session tidak ada, cari user pertama yang tersedia sebagai fallback
    if (!userId) {
      const fallbackUser = await prisma.user.findFirst();
      if (!fallbackUser) {
        return Response.json({ success: false, message: "Tidak ada user di database. Buat akun terlebih dahulu." }, { status: 400 });
      }
      userId = fallbackUser.id;
    }

    let total = 0;
    items.forEach((item: any) => {
      total += item.subtotal;
    });
    
    const grandTotal = Math.max(0, total - discount);

    const transactionItemsData = items.map((item: any) => ({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    }));

    let paymentStatus = 'PAID';
    if (payment < grandTotal) {
      if (payment > 0) paymentStatus = 'PARTIAL';
      else paymentStatus = 'UNPAID';
      
      if (!customerId) {
        return Response.json({ success: false, message: "Pelanggan harus dipilih untuk kasbon (pembayaran kurang)." }, { status: 400 });
      }
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const transactionCreateData: any = {
        userId: userId as string,
        total: total,
        discount: discount,
        grandTotal: grandTotal,
        payment: payment,
        change: payment > grandTotal ? payment - grandTotal : 0,
        paymentStatus: paymentStatus as any,
        amountPaid: payment,
        dueDate: (payment < grandTotal && dueDate) ? new Date(dueDate) : null,
        items: {
          create: transactionItemsData
        }
      };

      if (customerId) {
        transactionCreateData.customerId = customerId;
      }

      const createdTx = await tx.transaction.create({
        data: transactionCreateData
      });

      // Kurangi stok barang
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return createdTx;
    });

    return Response.json({ success: true, transaction });
  } catch (error: any) {
    console.error('[Transaction Error]', error);
    return Response.json({ 
      success: false, 
      message: error?.message || "Gagal menyimpan transaksi"
    }, { status: 500 });
  }
}
