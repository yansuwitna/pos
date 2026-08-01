import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const opname = await prisma.stockOpname.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true } },
        items: {
          include: {
            product: { select: { sku: true, name: true, cost: true, price: true } }
          }
        }
      }
    });

    if (!opname) {
      return NextResponse.json({ success: false, message: 'Data opname tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, opname });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Menghapus data opname
    await prisma.stockOpname.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
