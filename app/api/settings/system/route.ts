import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'allowPublicRegistration' }
    });
    return Response.json({ success: true, allowPublicRegistration: setting?.value || 'false' });
  } catch (error) {
    return Response.json({ success: false, message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { key, value } = await req.json();
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
  }
}
