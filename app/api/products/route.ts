import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

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
        _count: {
          select: {
            transactionItems: true,
            purchaseItems: true,
            returnItems: true,
            orderItems: true
          }
        }
      }
    });
    return Response.json({ success: true, products });
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
