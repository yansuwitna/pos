import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany({
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
    const data = await req.json();
    const product = await prisma.product.create({
      data,
    });
    return Response.json({ success: true, product });
  } catch (error) {
    return Response.json({ success: false, message: "Gagal menyimpan produk" }, { status: 500 });
  }
}
