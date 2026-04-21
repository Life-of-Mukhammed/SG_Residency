'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Rocket, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AuthPreferences } from '@/components/AuthPreferences';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t, theme } = useAppStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error(res.error || 'Invalid credentials');
      } else {
        toast.success('Welcome back!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: theme === 'light'
          ? 'linear-gradient(160deg, #f8fbff 0%, #eef4ff 48%, #f6fbf8 100%)'
          : 'linear-gradient(160deg, #09090f 0%, #11142b 45%, #181b37 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: theme === 'light'
            ? 'radial-gradient(circle at 15% 20%, rgba(14,165,233,0.14) 0%, transparent 28%), radial-gradient(circle at 85% 15%, rgba(99,102,241,0.14) 0%, transparent 30%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.10) 0%, transparent 26%)'
            : 'radial-gradient(circle at 15% 20%, rgba(56,189,248,0.16) 0%, transparent 28%), radial-gradient(circle at 85% 15%, rgba(129,140,248,0.18) 0%, transparent 30%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.12) 0%, transparent 26%)',
        }}
      />
      <div className="relative min-h-screen grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-3 mb-8 rounded-2xl px-4 py-3" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.06)', border: theme === 'light' ? '1px solid rgba(99,102,241,0.12)' : '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22d3ee, #6366f1)' }}>
                <Rocket size={22} className="text-white" />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: theme === 'light' ? '#0f172a' : '#fff' }}>Residency</p>
                <p className="text-xs" style={{ color: theme === 'light' ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.6)' }}>Startup Accelerator OS</p>
              </div>
            </div>
            <p className="text-5xl font-bold leading-tight" style={{ color: theme === 'light' ? '#0f172a' : '#fff' }}>Founderlar uchun tezkor, toza va nazoratli workspace.</p>
            <p className="text-base mt-5 max-w-lg" style={{ color: theme === 'light' ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.7)' }}>Profil, residency approval, weekly reporting, meetings, sprint va GTM bir joyda boshqariladi.</p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-xl">
            {['Approval workflow', 'Manager visibility', 'Weekly execution'].map((item) => (
              <div key={item} className="rounded-2xl p-4" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.05)', border: theme === 'light' ? '1px solid rgba(99,102,241,0.12)' : '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-sm font-medium" style={{ color: theme === 'light' ? '#0f172a' : '#fff' }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md animate-fade-in">
            <AuthPreferences />
            <div className="card p-8 md:p-9" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.88)' : 'rgba(12, 15, 33, 0.88)', borderColor: theme === 'light' ? 'rgba(99,102,241,0.15)' : 'rgba(129,140,248,0.18)', boxShadow: '0 24px 90px rgba(0,0,0,0.18)' }}>
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#7dd3fc' }}>Welcome back</p>
                <h1 className="text-3xl font-bold mt-3" style={{ color: 'var(--text-primary)' }}>{t('signInAccount')}</h1>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{t('welcomeBack')} — let&apos;s build something great.</p>
              </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">{t('email')}</label>
              <input
                {...register('email')}
                type="email"
                className="input notranslate"
                translate="no"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">{t('password')}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12 notranslate"
                  translate="no"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{t('signIn')} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('noAccount')}{' '}
              <Link href="/register" style={{ color: 'var(--accent)' }} className="font-medium hover:underline">
                {t('createAccount')}
              </Link>
            </p>
          </div>
            </div>
            <div className="mt-4 p-4 rounded-2xl text-center" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.74)' : 'rgba(255,255,255,0.06)', border: theme === 'light' ? '1px solid rgba(99,102,241,0.12)' : '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>New here?</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('createAccount')} to get started</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
