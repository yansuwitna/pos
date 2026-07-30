import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const rules = await prisma.discountRule.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ success: true, rules });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message || "Gagal mengambil aturan diskon" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    if (!data.name || !data.discountPercent) {
      return Response.json({ success: false, message: "Nama dan persen diskon harus diisi" }, { status: 400 });
    }

    let storeId = data.storeId || session?.storeId;
    if (!storeId) {
      const fallbackStore = await prisma.store.findFirst();
      if (!fallbackStore) {
        return Response.json({ success: false, message: "Toko tidak ditemukan." }, { status: 400 });
      }
      storeId = fallbackStore.id;
    }

    const rule = await prisma.discountRule.create({
      data: {
        storeId,
        name: data.name,
        minItemQuantity: data.minItemQuantity ? Number(data.minItemQuantity) : null,
        minTransaction: data.minTransaction ? Number(data.minTransaction) : null,
        discountPercent: Number(data.discountPercent),
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    return Response.json({ success: true, rule });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message || "Gagal menyimpan aturan" }, { status: 500 });
  }
}
