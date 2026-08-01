import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (!session.storeId && session.role !== 'SUPER_ADMIN')) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const where = session.role === 'SUPER_ADMIN' ? {} : { storeId: session.storeId };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        purchaseItems: { select: { quantity: true } },
        returnItems: { select: { quantity: true } },
        transactionItems: { select: { quantity: true } },
        _count: {
          select: {
            transactionItems: true,
            purchaseItems: true,
            returnItems: true,
            orderItems: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedProducts = products.map(p => {
      const totalBought = p.purchaseItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalReturned = p.returnItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalSold = p.transactionItems.reduce((sum, item) => sum + item.quantity, 0);

      const { purchaseItems, returnItems, transactionItems, ...rest } = p;
      return {
        ...rest,
        totalBought,
        totalReturned,
        totalSold
      };
    });

    return Response.json({ success: true, products: formattedProducts });
  } catch (error) {
    return Response.json({ success: false, message: "Gagal mengambil data produk" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.storeId) {
      return Response.json({ success: false, message: 'Unauthorized or no store' }, { status: 401 });
    }

    const data = await req.json();
    const product = await prisma.product.create({
      data: { ...data, storeId: session.storeId },
    });
    return Response.json({ success: true, product });
  } catch (error) {
    return Response.json({ success: false, message: "Gagal menyimpan produk" }, { status: 500 });
  }
}
