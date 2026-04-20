import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import DashboardHome from '@/components/dashboard/DashboardHome';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const user = session.user as any;

  // Managers and admins → redirect to their panel
  if (['manager', 'super_admin'].includes(user.role)) {
    redirect('/manager');
  }

  return (
    <div className="animate-fade-in">
      <Header title={`👋 ${user.name?.split(' ')[0]}`} subtitle="Startapingiz holati" />
      <div className="p-6">
        <DashboardHome />
      </div>
    </div>
  );
}
