import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    let whereClause: any = {};
    if (session?.storeId && session.role !== 'SUPER_ADMIN') {
      whereClause.storeId = session.storeId;
    }

    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            purchases: true,
            returns: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ success: true, suppliers });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const data = await req.json();

    let storeId = session?.storeId as string | undefined;

    if (!storeId && session?.id) {
      const userObj = await prisma.user.findUnique({ where: { id: session.id }, select: { storeId: true } });
      storeId = userObj?.storeId || undefined;
    }

    if (!storeId) {
      const fallbackStore = await prisma.store.findFirst();
      if (!fallbackStore) {
        return Response.json({ success: false, message: "Toko tidak ditemukan." }, { status: 400 });
      }
      storeId = fallbackStore.id;
    }

    const newSupplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contact: data.contact,
        address: data.address,
        storeId: storeId
      }
    });
    return Response.json({ success: true, supplier: newSupplier });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.supplier.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ success: false, message: "Gagal menghapus supplier, mungkin masih ada data transaksi terkait." }, { status: 500 });
  }
}
