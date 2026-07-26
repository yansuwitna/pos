import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const { supplierId, items, notes, createdAt } = data;

    // Use transaction to update stock and return
    const updatedReturn = await prisma.$transaction(async (tx) => {
      // 1. Fetch old items
      const oldItems = await tx.returnItem.findMany({
        where: { returnId: params.id }
      });

      // 2. Revert old stock (increase by old quantity because returning decreased stock)
      for (const oldItem of oldItems) {
        await tx.product.update({
          where: { id: oldItem.productId },
          data: { stock: { increment: oldItem.quantity } }
        });
      }

      // 3. Delete old items
      await tx.returnItem.deleteMany({
        where: { returnId: params.id }
      });

      // 4. Create new items and apply new stock
      const newItemsData = [];
      for (const item of items) {
        newItemsData.push({
          productId: item.productId || item.id,
          productName: item.productName || item.name,
          quantity: item.quantity,
          reason: item.reason
        });

        // apply new stock (decrease stock)
        await tx.product.update({
          where: { id: item.productId || item.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // 5. Update return document
      return await tx.return.update({
        where: { id: params.id },
        data: {
          supplierId,
          notes,
          createdAt: createdAt ? new Date(createdAt) : undefined,
          items: {
            create: newItemsData
          }
        },
        include: {
          items: true
        }
      });
    });

    return Response.json({ success: true, return: updatedReturn });
  } catch (error: any) {
    console.error("Update Return Error:", error);
    return Response.json({ success: false, message: error?.message || "Gagal menyimpan perubahan retur" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch old items to revert stock
      const oldItems = await tx.returnItem.findMany({
        where: { returnId: params.id }
      });

      // 2. Revert stock (increase by old quantity)
      for (const oldItem of oldItems) {
        await tx.product.update({
          where: { id: oldItem.productId },
          data: { stock: { increment: oldItem.quantity } }
        });
      }

      // 3. Delete old items
      await tx.returnItem.deleteMany({ where: { returnId: params.id } });
      
      // 4. Delete return document
      await tx.return.delete({ where: { id: params.id } });
    });
    
    return Response.json({ success: true, message: "Retur berhasil dihapus dan stok telah dikembalikan" });
  } catch (error: any) {
    console.error("Delete Return Error:", error);
    return Response.json({ success: false, message: error?.message || "Gagal menghapus retur" }, { status: 500 });
  }
}
