import { getSession } from '@/lib/auth';
import FinancesClient from './client';

export default async function FinancesPage() {
  const session = await getSession();
  const role = session?.role || 'ADMIN';
  
  return <FinancesClient role={role} />;
}
