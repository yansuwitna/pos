import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { category, amount, description, date } = await req.json();
    
    if (!category || !amount) {
      return Response.json({ success: false, message: "Kategori dan Nominal wajib diisi" }, { status: 400 });
    }

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: { 
        category, 
        amount: parseFloat(amount), 
        description, 
        date: date ? new Date(date) : undefined
      }
    });
    return Response.json({ success: true, expense });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.expense.delete({
      where: { id: params.id }
    });
    return Response.json({ success: true, message: "Pengeluaran berhasil dihapus" });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
