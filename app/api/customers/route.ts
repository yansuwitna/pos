import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    let whereClause: any = {};
    if (session?.storeId && session.role !== 'SUPER_ADMIN') {
      whereClause.storeId = session.storeId;
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ success: true, customers });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { name, phone, address } = await req.json();
    if (!name) return Response.json({ success: false, message: "Nama pelanggan wajib diisi" }, { status: 400 });

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

    const customer = await prisma.customer.create({
      data: { name, phone, address, storeId }
    });
    return Response.json({ success: true, customer });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    const { id, name, phone, address } = await req.json();

    if (!id) {
      return Response.json({ success: false, message: "ID pelanggan tidak valid" }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return Response.json({ success: false, message: "Nama pelanggan wajib diisi" }, { status: 400 });
    }

    const where: any = { id };
    if (session?.role !== 'SUPER_ADMIN' && session?.storeId) {
      where.storeId = session.storeId;
    }

    const customer = await prisma.customer.update({
      where,
      data: { name, phone: phone || null, address: address || null }
    });
    return Response.json({ success: true, customer });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
