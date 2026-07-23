import { getSession } from '@/lib/auth';
import SettingsClient from './client';

export default async function SettingsPage() {
  const session = await getSession();
  const role = session?.role as string ?? '';
  return <SettingsClient role={role} />;
}
