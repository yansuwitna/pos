import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const { supplierId, notes, items, createdAt } = data;

    // Use transaction to delete old items and create new ones
    const order = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing items
      await tx.orderItem.deleteMany({
        where: { orderId: params.id }
      });

      // 2. Update the main order info and create new items
      return await tx.order.update({
        where: { id: params.id },
        data: {
          supplierId,
          notes,
          createdAt: createdAt ? new Date(createdAt) : undefined,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity
            }))
          }
        },
        include: {
          items: true
        }
      });
    });

    return Response.json({ success: true, order });
  } catch (error) {
    console.error("Update Order Error:", error);
    return Response.json({ success: false, message: "Gagal menyimpan perubahan pesanan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // We just delete the order. The orderItems will be deleted automatically if there's cascade,
    // but to be safe we can use transaction or just prisma.order.delete (assuming cascade is set up)
    // We already used deleteMany in PUT, so let's do it explicitly if cascade is not set.
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: params.id } });
      await tx.order.delete({ where: { id: params.id } });
    });
    
    return Response.json({ success: true, message: "Pesanan berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete Order Error:", error);
    return Response.json({ success: false, message: "Gagal menghapus pesanan" }, { status: 500 });
  }
}
