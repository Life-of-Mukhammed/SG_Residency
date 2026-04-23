'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AuthPreferences } from '@/components/AuthPreferences';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  surname: z.string().min(2, 'Surname must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { t, theme } = useAppStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: data.password,
      });

      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        toast.success('Account created. Please sign in.');
        router.push('/login');
        return;
      }

      toast.success('Account created successfully!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const res = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      });

      if (res?.error) {
        toast.error('Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local and restart the server.');
        return;
      }

      if (res?.url) {
        router.push(res.url);
      }
    } catch {
      toast.error('Google sign in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: theme === 'light'
          ? 'linear-gradient(160deg, #f6fbf8 0%, #eef7ff 45%, #f9fafb 100%)'
          : 'linear-gradient(160deg, #08111f 0%, #13223b 45%, #0f172a 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: theme === 'light'
            ? 'radial-gradient(circle at 20% 15%, rgba(16,185,129,0.12) 0%, transparent 28%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.13) 0%, transparent 30%), radial-gradient(circle at 55% 85%, rgba(56,189,248,0.08) 0%, transparent 26%)'
            : 'radial-gradient(circle at 20% 15%, rgba(16,185,129,0.16) 0%, transparent 28%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.18) 0%, transparent 30%), radial-gradient(circle at 55% 85%, rgba(56,189,248,0.10) 0%, transparent 26%)',
        }}
      />
      <div className="relative min-h-screen grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden lg:flex items-end p-10 xl:p-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-3 mb-8 rounded-2xl px-4 py-3" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.06)', border: theme === 'light' ? '1px solid rgba(99,102,241,0.12)' : '1px solid rgba(255,255,255,0.08)' }}>
              <img
                src="/sg-logo.png"
                alt="SG Residency"
                className="w-12 h-12 rounded-2xl object-cover border"
                style={{ borderColor: theme === 'light' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.08)' }}
              />
              <div>
                <p className="text-lg font-bold" style={{ color: theme === 'light' ? '#0f172a' : '#fff' }}>SG Residency</p>
                <p className="text-xs" style={{ color: theme === 'light' ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.6)' }}>Startup Accelerator OS</p>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: theme === 'light' ? '#059669' : '#6ee7b7' }}>Join residency</p>
            <h1 className="text-5xl font-bold leading-tight mt-4" style={{ color: theme === 'light' ? '#0f172a' : '#fff' }}>Bitta account bilan founder workflow’ni to‘liq ishga tushiring.</h1>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {['Profile setup', 'Application review', 'Execution tools'].map((item) => (
                <div key={item} className="rounded-2xl p-4" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.06)', border: theme === 'light' ? '1px solid rgba(16,185,129,0.12)' : '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium" style={{ color: theme === 'light' ? '#0f172a' : '#fff' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg animate-fade-in">
            <AuthPreferences />
            <div className="card p-8 md:p-9" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(11, 18, 32, 0.9)', borderColor: theme === 'light' ? 'rgba(16,185,129,0.15)' : 'rgba(52,211,153,0.18)', boxShadow: '0 24px 90px rgba(0,0,0,0.18)' }}>
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#6ee7b7' }}>Create account</p>
                <h1 className="text-3xl font-bold mt-3" style={{ color: 'var(--text-primary)' }}>{t('createAccount')}</h1>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Join the residency program today.</p>
              </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading || loading}
            className="w-full rounded-2xl border px-4 py-3 text-sm font-medium transition hover:translate-y-[-1px] mb-4 flex items-center justify-center gap-3"
            style={{
              borderColor: theme === 'light' ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.12)',
              background: theme === 'light' ? '#ffffff' : 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
            }}
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-base leading-none">G</span>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative my-5">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div
                className="w-full border-t"
                style={{ borderColor: theme === 'light' ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.24em]">
              <span
                className="px-3"
                style={{
                  background: theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(11, 18, 32, 0.9)',
                  color: 'var(--text-muted)',
                }}
              >
                or register with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('firstName')}</label>
                <input {...register('name')} className="input notranslate" translate="no" placeholder="Aisha" />
                {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">{t('lastName')}</label>
                <input {...register('surname')} className="input notranslate" translate="no" placeholder="Karimova" />
                {errors.surname && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.surname.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">{t('email')}</label>
              <input {...register('email')} type="email" className="input notranslate" translate="no" placeholder="you@example.com" />
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
                  placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">{t('confirmPassword')}</label>
              <input
                {...register('confirmPassword')}
                type={showPass ? 'text' : 'password'}
                className="input notranslate"
                translate="no"
                placeholder="Repeat password"
              />
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('createAccount')} <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('alreadyHaveAccount')}{' '}
              <Link href="/login" style={{ color: 'var(--accent)' }} className="font-medium hover:underline">{t('signIn')}</Link>
            </p>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
