import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const where = session.role === 'SUPER_ADMIN' ? {} : { storeId: session.storeId };

    const users = await prisma.user.findMany({
      where,
      select: { 
        id: true, username: true, name: true, role: true, isActive: true, createdAt: true, storeId: true,
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
    return Response.json({ success: true, users, currentUserId: session.id });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { username, password, name, role } = await req.json();
    
    // Check if creating first SUPER_ADMIN
    if (role === 'SUPER_ADMIN') {
      const superAdminExists = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
      if (superAdminExists) {
        return Response.json({ success: false, message: 'SUPER_ADMIN sudah ada' }, { status: 400 });
      }
      
      const user = await prisma.user.create({
        data: { username, password, name, role },
        select: { id: true, username: true, name: true, role: true }
      });
      return Response.json({ success: true, user });
    }

    // Otherwise require session
    const session = await getSession();
    if (!session) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    
    const storeId = session.storeId;
    if (!storeId) {
       return Response.json({ success: false, message: 'Toko belum ditentukan' }, { status: 400 });
    }

    // Format username to include store code if it's not already
    // Usually Admin/Manager creates staff users. So username should be prefixed.
    // Wait, the client might pass the storeCode, but we can fetch it from session.storeCode
    const storeCode = session.storeCode;
    let finalUsername = username;
    if (storeCode && !username.startsWith(storeCode + '_')) {
       finalUsername = `${storeCode}_${username}`;
    }

    const existing = await prisma.user.findUnique({ where: { username: finalUsername } });
    if (existing) {
      return Response.json({ success: false, message: 'Username sudah digunakan' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { username: finalUsername, password, name, role, storeId },
      select: { id: true, username: true, name: true, role: true }
    });
    return Response.json({ success: true, user });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id, username, name, role, password, isActive } = await req.json();

    if (id === session.id) {
      if (isActive === false) {
        return Response.json({ success: false, message: 'Anda tidak dapat menonaktifkan akun Anda sendiri' }, { status: 400 });
      }
      if (role && role !== session.role) {
        return Response.json({ success: false, message: 'Anda tidak dapat mengubah role Anda sendiri' }, { status: 400 });
      }
    }

    const data: any = { username, name, role, isActive };
    if (password) data.password = password;

    const where: any = { id };
    if (session.role !== 'SUPER_ADMIN') {
      where.storeId = session.storeId;
    }

    const user = await prisma.user.update({
      where,
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
    const session = await getSession();
    if (!session) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    
    const where: any = { id };
    if (session.role !== 'SUPER_ADMIN') {
      where.storeId = session.storeId;
    }

    const user = await prisma.user.findUnique({ where });
    if (!user) {
      return Response.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }
    if (id === session.id) {
      return Response.json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri' }, { status: 400 });
    }
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return Response.json({ success: false, message: 'Akun ADMIN/SUPER_ADMIN tidak boleh dihapus' }, { status: 403 });
    }

    await prisma.user.delete({ where });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ success: false, message: error?.message }, { status: 500 });
  }
}
