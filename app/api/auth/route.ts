import { PrismaClient } from '@prisma/client';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { username },
      include: { store: true },
    });

    if (user && user.password === password) {
      if (!user.isActive) {
        return Response.json({ success: false, message: "Akun tidak aktif" }, { status: 401 });
      }

      // Create session
      const sessionData = { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        name: user.name,
        storeId: user.storeId,
        storeCode: user.store?.code,
        storeName: user.store?.name
      };
      const session = await encrypt(sessionData);
      
      cookies().set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return Response.json({ success: true, user: sessionData });
    }

    return Response.json({ success: false, message: "Kredensial tidak valid" }, { status: 401 });
  } catch (error) {
    return Response.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
