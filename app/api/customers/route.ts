import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ success: true, customers });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, phone, address } = await req.json();
    if (!name) return Response.json({ success: false, message: "Nama pelanggan wajib diisi" }, { status: 400 });

    const customer = await prisma.customer.create({
      data: { name, phone, address }
    });
    return Response.json({ success: true, customer });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
