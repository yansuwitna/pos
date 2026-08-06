import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const isSuperAdmin = session?.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      try {
        const setting = await prisma.systemSetting.findUnique({
          where: { key: 'allowPublicRegistration' }
        });

        if (setting?.value !== 'true') {
          return Response.json({ success: false, message: 'Pendaftaran toko publik sedang ditutup.' }, { status: 403 });
        }
      } catch (e) {
        return Response.json({ success: false, message: 'Pendaftaran toko publik sedang ditutup.' }, { status: 403 });
      }
    }

    const { storeName, storeCode, username, password, name } = await req.json();

    const cleanStoreCode = (storeCode || '').trim().replace(/\s+/g, '');
    const cleanUsername = (username || '').trim().replace(/\s+/g, '');
    const cleanStoreName = (storeName || '').trim();
    const cleanName = (name || '').trim();

    if (!cleanStoreName || !cleanStoreCode || !cleanUsername || !password || !cleanName) {
      return Response.json({ success: false, message: 'Harap lengkapi semua data' }, { status: 400 });
    }

    if (cleanStoreCode.includes('_')) {
      return Response.json({ success: false, message: 'Kode toko tidak boleh mengandung garis bawah (_)' }, { status: 400 });
    }

    // Check if store code exists
    const existingStore = await prisma.store.findUnique({ where: { code: cleanStoreCode } });
    if (existingStore) {
      return Response.json({ success: false, message: `Kode toko '${cleanStoreCode}' sudah digunakan` }, { status: 400 });
    }

    const compositeUsername = `${cleanStoreCode}_${cleanUsername}`;

    // Check if username exists
    const existingUser = await prisma.user.findUnique({ where: { username: compositeUsername } });
    if (existingUser) {
      return Response.json({ success: false, message: `Username '${compositeUsername}' sudah digunakan` }, { status: 400 });
    }

    // Create store and user within a transaction
    const store = await prisma.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          code: cleanStoreCode,
          name: cleanStoreName,
        }
      });

      await tx.user.create({
        data: {
          username: compositeUsername,
          password: password,
          name: cleanName,
          role: 'ADMIN',
          storeId: newStore.id,
        }
      });

      return newStore;
    });

    return Response.json({ success: true, store });
  } catch (error: any) {
    console.error('Error in POST /api/register:', error);
    return Response.json({ 
      success: false, 
      message: error?.message || 'Terjadi kesalahan pada server saat mendaftar toko' 
    }, { status: 500 });
  }
}
