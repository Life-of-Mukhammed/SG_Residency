'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewReportPage() {
  const router = useRouter();
  const [startup, setStartup] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ completed: '', notCompleted: '', plans: '' });

  useEffect(() => {
    axios.get('/api/startups?limit=1')
      .then((res) => setStartup(res.data.startups?.[0] ?? null))
      .finally(() => setInitialLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.completed.trim() || !form.notCompleted.trim() || !form.plans.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/reports', form);
      toast.success('Report submitted successfully! 🎉');
      router.push('/dashboard/reports');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-8"><div className="skeleton h-64 rounded-2xl max-w-2xl mx-auto" /></div>;
  }

  if (!startup || startup.status !== 'active') {
    return (
      <div className="animate-fade-in">
        <Header title="Submit Weekly Report" subtitle="Approval required" />
        <div className="p-8 max-w-2xl mx-auto">
          <div className="card text-center py-14">
            <p className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Reports are locked</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Your startup must be approved before you can submit weekly reports.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title="Submit Weekly Report" subtitle="Share your progress for this week" />
      <div className="p-8 max-w-2xl mx-auto">
        <Link href="/dashboard/reports">
          <button className="btn-secondary flex items-center gap-2 mb-6 text-sm">
            <ArrowLeft size={14} /> Back to Reports
          </button>
        </Link>

        <div className="card p-8">
          <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>📅 Weekly Report</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Report for the week of {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">✅ What did you accomplish this week?</label>
              <textarea
                value={form.completed}
                onChange={(e) => setForm({ ...form, completed: e.target.value })}
                className="input min-h-32 resize-none"
                placeholder="List your key accomplishments, milestones reached, features shipped, customers acquired..."
              />
            </div>

            <div>
              <label className="label">⚠️ What didn't you complete?</label>
              <textarea
                value={form.notCompleted}
                onChange={(e) => setForm({ ...form, notCompleted: e.target.value })}
                className="input min-h-32 resize-none"
                placeholder="What was planned but not done? What blockers did you face? Be honest — this helps your manager support you."
              />
            </div>

            <div>
              <label className="label">📋 What's your plan for next week?</label>
              <textarea
                value={form.plans}
                onChange={(e) => setForm({ ...form, plans: e.target.value })}
                className="input min-h-32 resize-none"
                placeholder="Top 3-5 priorities for next week. Be specific with goals and metrics."
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send size={16} /> Submit Report</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
