import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { name, phone, address } = await req.json();
    if (!name) return Response.json({ success: false, message: "Nama pelanggan wajib diisi" }, { status: 400 });

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: { name, phone, address }
    });
    return Response.json({ success: true, customer });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.customer.delete({
      where: { id: params.id }
    });
    return Response.json({ success: true, message: "Pelanggan berhasil dihapus" });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
