import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const data = await req.json();

    const rule = await prisma.discountRule.update({
      where: { id },
      data: {
        name: data.name,
        minItemQuantity: data.minItemQuantity ? Number(data.minItemQuantity) : null,
        minTransaction: data.minTransaction ? Number(data.minTransaction) : null,
        discountPercent: Number(data.discountPercent),
        isActive: data.isActive
      }
    });

    return Response.json({ success: true, rule });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message || "Gagal update aturan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    await prisma.discountRule.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message || "Gagal menghapus aturan" }, { status: 500 });
  }
}
