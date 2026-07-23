import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
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
    const data = await req.json();
    const newSupplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contact: data.contact,
        address: data.address,
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
