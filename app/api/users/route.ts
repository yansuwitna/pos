import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, username: true, name: true, role: true, isActive: true, createdAt: true,
        _count: {
          select: {
            transactions: true,
            purchases: true,
            returns: true,
            orders: true
          }
        }
      }
    });
    return Response.json({ success: true, users });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { username, password, name, role } = await req.json();
    
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return Response.json({ success: false, message: 'Username sudah digunakan' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { username, password, name, role },
      select: { id: true, username: true, name: true, role: true }
    });
    return Response.json({ success: true, user });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, username, name, role, password, isActive } = await req.json();
    const data: any = { username, name, role, isActive };
    if (password) data.password = password;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, role: true, isActive: true }
    });
    return Response.json({ success: true, user });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    
    // Cek apakah user yang akan dihapus adalah ADMIN
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return Response.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }
    if (user.role === 'ADMIN') {
      return Response.json({ success: false, message: 'Akun dengan role ADMIN tidak boleh dihapus untuk mencegah hilangnya akses manajemen!' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}
