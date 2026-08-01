import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const isSuperAdmin = session?.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'allowPublicRegistration' }
      });

      if (setting?.value !== 'true') {
        return Response.json({ success: false, message: 'Pendaftaran toko ditutup' }, { status: 403 });
      }
    }

    const { storeName, storeCode, username, password, name } = await req.json();

    if (!storeName || !storeCode || !username || !password || !name) {
      return Response.json({ success: false, message: 'Harap lengkapi semua data' }, { status: 400 });
    }

    // Check if store code exists
    const existingStore = await prisma.store.findUnique({ where: { code: storeCode } });
    if (existingStore) {
      return Response.json({ success: false, message: 'Kode toko sudah digunakan' }, { status: 400 });
    }

    const compositeUsername = `${storeCode}_${username}`;

    // Check if username exists
    const existingUser = await prisma.user.findUnique({ where: { username: compositeUsername } });
    if (existingUser) {
      return Response.json({ success: false, message: 'Username sudah digunakan' }, { status: 400 });
    }

    // Create store and user within a transaction
    const store = await prisma.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          code: storeCode,
          name: storeName,
        }
      });

      await tx.user.create({
        data: {
          username: compositeUsername,
          password: password, // In production this should be hashed
          name: name,
          role: 'ADMIN',
          storeId: newStore.id,
        }
      });

      return newStore;
    });

    return Response.json({ success: true, store });
  } catch (error) {
    return Response.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
