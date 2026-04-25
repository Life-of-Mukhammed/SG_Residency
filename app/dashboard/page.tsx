import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import DashboardHome from '@/components/dashboard/DashboardHome';
import connectDB from '@/lib/db';
import { getUserStartup } from '@/lib/access';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const user = session.user as { name?: string | null; role?: string };

  // Managers and admins → redirect to their panel
  if (user.role && ['manager', 'super_admin'].includes(user.role)) {
    redirect('/manager');
  }

  await connectDB();
  const startup = await getUserStartup((session.user as { id: string }).id);
  if (!startup) {
    redirect('/dashboard/apply');
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
