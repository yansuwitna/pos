import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, message: 'Akses Ditolak: Hanya Super Admin' }, { status: 403 });
  }

  const { id: storeId } = await params;

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, code: true, name: true, address: true, phone: true, isActive: true, createdAt: true }
    });

    if (!store) {
      return NextResponse.json({ success: false, message: 'Toko tidak ditemukan' }, { status: 404 });
    }

    const users = await prisma.user.findMany({
      where: { storeId },
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    const transactions = await prisma.transaction.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const purchases = await prisma.purchase.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const returns = await prisma.return.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const opnames = await prisma.stockOpname.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const orders = await prisma.order.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const expenses = await prisma.expense.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    const capitals = await prisma.capital.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    return NextResponse.json({
      success: true,
      store,
      users,
      activities: {
        transactions,
        purchases,
        returns,
        opnames,
        orders,
        expenses,
        capitals
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Gagal memuat kegiatan toko' }, { status: 500 });
  }
}
