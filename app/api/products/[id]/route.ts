import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    
    // We shouldn't update the `id` field and relation fields, so we extract them out
    const { id, createdAt, updatedAt, _count, category, ...updateData } = data;

    // Convert price and cost to numbers if they are strings
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.cost !== undefined) updateData.cost = Number(updateData.cost);
    if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);
    if (updateData.discountPercent !== undefined) updateData.discountPercent = Number(updateData.discountPercent);

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    });

    return Response.json({ success: true, product });
  } catch (error) {
    console.error("Update Product Error:", error);
    return Response.json({ success: false, message: "Gagal menyimpan perubahan produk" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({
      where: { id: params.id }
    });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return Response.json({ success: false, message: "Gagal menghapus produk, mungkin masih terkait dengan transaksi" }, { status: 500 });
  }
}
