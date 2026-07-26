import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const { supplierId, items, createdAt, amountPaid, dueDate } = data;

    // Use transaction to update stock and purchase
    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Fetch old items
      const oldItems = await tx.purchaseItem.findMany({
        where: { purchaseId: params.id }
      });

      // 2. Revert old stock (decrease by old quantity) and revert old cost
      for (const oldItem of oldItems) {
        const currentProduct = await tx.product.findUnique({ where: { id: oldItem.productId } });
        if (currentProduct && currentProduct.type === 'GOODS') {
          const currentStock = currentProduct.stock;
          const currentCost = currentProduct.cost;
          const newStock = currentStock - oldItem.quantity;
          let newCost = currentCost;

          if (newStock > 0) {
            const totalCurrentValue = currentStock * currentCost;
            const oldValue = oldItem.quantity * oldItem.unitCost;
            const newTotalValue = Math.max(0, totalCurrentValue - oldValue);
            newCost = Math.round(newTotalValue / newStock);
          } else {
            newCost = 0;
          }

          await tx.product.update({
            where: { id: oldItem.productId },
            data: { stock: newStock, cost: newCost }
          });
        }
      }

      // 3. Delete old items
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: params.id }
      });

      // 4. Create new items and apply new stock
      let totalCost = 0;
      const newItemsData = [];
      for (const item of items) {
        const subtotal = item.quantity * item.unitCost;
        totalCost += subtotal;
        
        newItemsData.push({
          productId: item.productId || item.id,
          productName: item.productName || item.name,
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal: subtotal
        });

        // apply new stock and moving average cost
        const currentProduct = await tx.product.findUnique({ where: { id: item.productId || item.id } });
        if (currentProduct && currentProduct.type === 'GOODS') {
          const currentStock = currentProduct.stock;
          const currentCost = currentProduct.cost;
          const newStock = currentStock + item.quantity;
          let newCost = currentCost;
          
          if (newStock > 0) {
            newCost = Math.round(((currentStock * currentCost) + (item.quantity * item.unitCost)) / newStock);
          }
          
          await tx.product.update({
            where: { id: item.productId || item.id },
            data: { stock: newStock, cost: newCost }
          });
        }
      }

      let paymentStatus = 'PAID';
      let finalAmountPaid = totalCost; // Default lunas

      if (amountPaid !== undefined && amountPaid !== null && amountPaid !== '') {
        finalAmountPaid = Number(amountPaid);
        if (finalAmountPaid < totalCost) {
          if (finalAmountPaid > 0) paymentStatus = 'PARTIAL';
          else paymentStatus = 'UNPAID';
        } else {
          paymentStatus = 'PAID';
        }
      }

      // 5. Update purchase document
      const purchaseData: any = {
        totalCost,
        paymentStatus: paymentStatus as any,
        amountPaid: finalAmountPaid,
        dueDate: (finalAmountPaid < totalCost && dueDate) ? new Date(dueDate) : null,
        items: {
          create: newItemsData
        }
      };

      if (createdAt) {
        purchaseData.createdAt = new Date(createdAt);
      }

      if (supplierId) {
        purchaseData.supplierId = supplierId;
      } else {
        purchaseData.supplierId = null;
      }

      return await tx.purchase.update({
        where: { id: params.id },
        data: purchaseData,
        include: {
          items: true
        }
      });
    });

    return Response.json({ success: true, purchase });
  } catch (error: any) {
    console.error("Update Purchase Error:", error);
    return Response.json({ success: false, message: error?.message || "Gagal menyimpan perubahan pembelian" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch old items to revert stock
      const oldItems = await tx.purchaseItem.findMany({
        where: { purchaseId: params.id }
      });

      // 2. Revert stock (decrease by old quantity) and revert old cost
      for (const oldItem of oldItems) {
        const currentProduct = await tx.product.findUnique({ where: { id: oldItem.productId } });
        if (currentProduct && currentProduct.type === 'GOODS') {
          const currentStock = currentProduct.stock;
          const currentCost = currentProduct.cost;
          const newStock = currentStock - oldItem.quantity;
          let newCost = currentCost;

          if (newStock > 0) {
            const totalCurrentValue = currentStock * currentCost;
            const oldValue = oldItem.quantity * oldItem.unitCost;
            const newTotalValue = Math.max(0, totalCurrentValue - oldValue);
            newCost = Math.round(newTotalValue / newStock);
          } else {
            newCost = 0;
          }

          await tx.product.update({
            where: { id: oldItem.productId },
            data: { stock: newStock, cost: newCost }
          });
        }
      }

      // 3. Delete old items
      await tx.purchaseItem.deleteMany({ where: { purchaseId: params.id } });
      
      // 4. Delete purchase document
      await tx.purchase.delete({ where: { id: params.id } });
    });
    
    return Response.json({ success: true, message: "Pembelian berhasil dihapus dan stok telah disesuaikan" });
  } catch (error: any) {
    console.error("Delete Purchase Error:", error);
    return Response.json({ success: false, message: error?.message || "Gagal menghapus pembelian" }, { status: 500 });
  }
}
