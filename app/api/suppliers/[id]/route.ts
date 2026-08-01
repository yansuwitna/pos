import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { name, contact, address } = await req.json();

    if (!name || !name.trim()) {
      return Response.json({ success: false, message: 'Nama supplier wajib diisi' }, { status: 400 });
    }

    const where: any = { id: params.id };
    if (session.role !== 'SUPER_ADMIN') {
      where.storeId = session.storeId;
    }

    const supplier = await prisma.supplier.update({
      where,
      data: {
        name,
        contact: contact || null,
        address: address || null,
      },
    });

    return Response.json({ success: true, supplier });
  } catch (error: any) {
    console.error("Update Supplier Error:", error);
    return Response.json({ success: false, message: error?.message || "Gagal menyimpan perubahan supplier" }, { status: 500 });
  }
}
