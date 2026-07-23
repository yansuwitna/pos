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
