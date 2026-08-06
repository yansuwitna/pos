import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return Response.json({ success: false, message: 'Sesi login tidak valid. Harap login kembali.' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return Response.json({ success: false, message: 'Harap isi password lama, password baru, dan konfirmasi password.' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return Response.json({ success: false, message: 'Password baru minimal 4 karakter.' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return Response.json({ success: false, message: 'Konfirmasi password baru tidak cocok.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id }
    });

    if (!user) {
      return Response.json({ success: false, message: 'Akun penggguna tidak ditemukan.' }, { status: 404 });
    }

    if (user.password !== currentPassword) {
      return Response.json({ success: false, message: 'Password lama Anda tidak tepat.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.id },
      data: { password: newPassword }
    });

    return Response.json({ success: true, message: 'Password Anda berhasil diperbarui!' });
  } catch (error: any) {
    console.error('Error changing user password:', error);
    return Response.json({ success: false, message: error?.message || 'Terjadi kesalahan sistem saat merubah password.' }, { status: 500 });
  }
}
