import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.storeId) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const store = await prisma.store.findUnique({
      where: { id: session.storeId }
    });

    if (!store) {
      return Response.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      storeInfo: {
        name: store.name,
        address: store.address || '',
        phone: store.phone || '',
        greeting: (store as any).greeting || 'Terima Kasih Telah Berbelanja',
        logo: (store as any).logo || ''
      }
    });
  } catch (error) {
    return Response.json({ success: false, message: 'Failed to fetch store settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.storeId) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { name, address, phone, greeting, logo } = await req.json();

    if (!name || name.trim() === '') {
      return Response.json({ success: false, message: 'Nama toko wajib diisi' }, { status: 400 });
    }

    await prisma.store.update({
      where: { id: session.storeId },
      data: {
        name,
        address: address || '',
        phone: phone || '',
        greeting: greeting || 'Terima Kasih Telah Berbelanja',
        logo: logo || ''
      } as any
    });

    return Response.json({ success: true, message: 'Profil toko berhasil disimpan' });
  } catch (error) {
    return Response.json({ success: false, message: 'Gagal memperbarui profil toko' }, { status: 500 });
  }
}
