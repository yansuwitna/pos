import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // CASHIER tidak boleh edit produk
    if (session.role === 'CASHIER') {
      return Response.json({ success: false, message: 'Akses ditolak. Kasir tidak dapat mengubah data produk.' }, { status: 403 });
    }

    const data = await req.json();

    // Strip semua field yang bukan kolom produk (relasi, computed, metadata)
    const {
      id, createdAt, updatedAt,
      _count, category,
      purchaseItems, returnItems, transactionItems,
      totalBought, totalReturned, totalSold,
      storeId,           // jangan izinkan pindah toko lewat edit
      ...updateData
    } = data;

    // Convert angka
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.cost !== undefined) updateData.cost = Number(updateData.cost);
    if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);
    if (updateData.discountPercent !== undefined) updateData.discountPercent = Number(updateData.discountPercent);

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    });

    return Response.json({ success: true, product });
  } catch (error: any) {
    console.error("Update Product Error:", error);
    return Response.json({ success: false, message: error?.message || "Gagal menyimpan perubahan produk" }, { status: 500 });
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
