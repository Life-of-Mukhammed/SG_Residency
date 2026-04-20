import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import Sidebar from '@/components/dashboard/Sidebar';
import DynamicMain from '@/components/dashboard/DynamicMain';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const user = session.user as any;
  if (user.role !== 'super_admin') redirect('/dashboard');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <DynamicMain>{children}</DynamicMain>
    </div>
  );
}
