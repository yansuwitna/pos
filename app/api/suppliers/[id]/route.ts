import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    
    // We shouldn't update the `id` field and relation fields, so we extract them out
    const { id, createdAt, updatedAt, _count, ...updateData } = data;

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: updateData,
    });

    return Response.json({ success: true, supplier });
  } catch (error) {
    console.error("Update Supplier Error:", error);
    return Response.json({ success: false, message: "Gagal menyimpan perubahan supplier" }, { status: 500 });
  }
}
