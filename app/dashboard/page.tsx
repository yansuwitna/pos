import { getSession } from '@/lib/auth';
import DashboardClient from './client';

export default async function DashboardPage() {
  const session = await getSession();
  const role = session?.role as string ?? '';
  const name = session?.name as string ?? '';
  return <DashboardClient role={role} name={name} />;
}
