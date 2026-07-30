import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia-banget';

export async function GET() {
  try {
    const opnames = await prisma.stockOpname.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        items: {
          include: {
            product: { select: { sku: true, name: true } }
          }
        }
      }
    });
    return NextResponse.json({ success: true, opnames });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    const { items, notes } = body; // items: [{ productId, systemStock, actualStock, difference, notes }]

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada barang yang di-opname' }, { status: 400 });
    }

    let storeId = body.storeId || session?.storeId;
    if (!storeId && session?.id) {
      const userObj = await prisma.user.findUnique({ where: { id: session.id }, select: { storeId: true } });
      storeId = userObj?.storeId;
    }
    if (!storeId) {
      const fallbackStore = await prisma.store.findFirst();
      if (!fallbackStore) return NextResponse.json({ success: false, message: 'Toko tidak ditemukan' }, { status: 400 });
      storeId = fallbackStore.id;
    }

    // Gunakan transaction untuk memastikan opname dan update stock berjalan bersamaan
    const opname = await prisma.$transaction(async (tx) => {
      // 1. Buat record Stok Opname
      const createdOpname = await tx.stockOpname.create({
        data: {
          storeId,
          userId: session.id,
          notes: notes || '',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              systemStock: item.systemStock,
              actualStock: item.actualStock,
              difference: item.difference,
              notes: item.notes || ''
            }))
          }
        }
      });

      // 2. Update stock masing-masing barang sesuai dengan actualStock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: item.actualStock }
        });
      }

      return createdOpname;
    });

    return NextResponse.json({ success: true, opname });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
