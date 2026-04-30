'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
  surname: z.string().min(2, 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak'),
  email: z.string().email('Noto\'g\'ri email'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Parollar mos kelmaydi',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(true);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpResident, setOtpResident] = useState<{ startupName: string | null } | null>(null);
  const [resending, setResending] = useState(false);
  const { t, theme } = useAppStore();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/auth/config', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setGoogleConfigured(Boolean(data.googleConfigured));
      } catch {
        setGoogleConfigured(true);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    const error = searchParams.get('error');
    if (!error) return;

    const messages: Record<string, string> = {
      OAuthSignin: 'Google orqali ro\'yxatdan o\'tish to\'g\'ri sozlanmagan.',
      OAuthCallback: 'Google callback xatosi. Yo\'naltirish manzilini tekshiring.',
      Configuration: 'Autentifikatsiya sozlamasi to\'liq emas.',
    };

    toast.error(messages[error] || 'Autentifikatsiya xatosi. Qayta urinib ko\'ring.');
  }, [searchParams]);

  const requestOtp = async (email: string) => {
    const res = await axios.post('/api/auth/register/request', { email });
    setOtpSent(true);
    setOtpResident({ startupName: res.data.startupName ?? null });
    toast.success(res.data.isResident
      ? `Tasdiqlash kodi rezident emailingizga yuborildi`
      : 'Tasdiqlash kodi emailingizga yuborildi');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Step 1: ask for OTP if we don't have it yet
      if (!otpSent) {
        await requestOtp(data.email);
        return;
      }

      // Step 2: submit registration with OTP
      if (!/^\d{6}$/.test(otp)) {
        toast.error('6 raqamli tasdiqlash kodi kiriting');
        return;
      }

      await axios.post('/api/auth/register', {
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: data.password,
        otp,
      });

      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        toast.success('Hisob yaratildi. Iltimos, kiring.');
        router.push('/login');
        return;
      }

      toast.success('Hisob muvaffaqiyatli yaratildi!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ro\'yxatdan o\'tish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    const email = getValues('email');
    if (!email) {
      toast.error('Email kiriting');
      return;
    }
    setResending(true);
    try {
      await requestOtp(email);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Kod qayta yuborilmadi');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!googleConfigured) {
      toast.error('Google orqali kirish hali sozlanmagan.');
      return;
    }

    setGoogleLoading(true);
    try {
      const res = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      });

      if (res?.error) {
        toast.error('Google orqali kirish xatosi. GOOGLE_CLIENT_ID va GOOGLE_CLIENT_SECRET-ni tekshiring.');
        return;
      }

      if (res?.url) {
        router.push(res.url);
      }
    } catch {
      toast.error('Google orqali kirish amalga oshmadi');
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
                <p className="text-xs" style={{ color: theme === 'light' ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.6)' }}>Startup Akselerator Tizimi</p>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: theme === 'light' ? '#059669' : '#6ee7b7' }}>Rezidentlikka qo&apos;shiling</p>
            <h1 className="text-5xl font-bold leading-tight mt-4" style={{ color: theme === 'light' ? '#0f172a' : '#fff' }}>Bitta hisob bilan to&apos;liq asoschi ish jarayonini boshlang.</h1>
            <div className="grid grid-cols-3 gap-4 mt-8" />
          </div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg animate-fade-in">
            <AuthPreferences />
            <div className="card p-8 md:p-9" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(11, 18, 32, 0.9)', borderColor: theme === 'light' ? 'rgba(16,185,129,0.15)' : 'rgba(52,211,153,0.18)', boxShadow: '0 24px 90px rgba(0,0,0,0.18)' }}>
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#6ee7b7' }}>Hisob yaratish</p>
                <h1 className="text-3xl font-bold mt-3" style={{ color: 'var(--text-primary)' }}>{t('createAccount')}</h1>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Bugun rezidentlik dasturiga qo&apos;shiling.</p>
              </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={!googleConfigured || googleLoading || loading}
            className="w-full rounded-2xl border px-4 py-3 text-sm font-medium transition hover:translate-y-[-1px] mb-4 flex items-center justify-center gap-3"
            style={{
              borderColor: theme === 'light' ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.12)',
              background: theme === 'light' ? '#ffffff' : 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
              opacity: googleConfigured ? 1 : 0.55,
            }}
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-base leading-none">G</span>
                <span>{googleConfigured ? 'Google orqali davom etish' : 'Google orqali kirish mavjud emas'}</span>
              </>
            )}
          </button>

          {!googleConfigured && (
            <p className="text-xs mb-4" style={{ color: 'var(--danger)' }}>
              Google OAuth sozlanmagan. Vercel-ga `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` va yo&apos;naltirish manzilini qo&apos;shing.
            </p>
          )}

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
                yoki email orqali ro&apos;yxatdan o&apos;ting
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
              <input
                {...register('email')}
                type="email"
                className="input notranslate"
                translate="no"
                placeholder="siz@example.com"
                disabled={otpSent}
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
            </div>

            {otpSent && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}>
                {otpResident?.startupName && (
                  <p className="text-xs mb-3" style={{ color: '#10b981' }}>
                    ✅ <strong>{otpResident.startupName}</strong> rezidentingiz uchun kod yuborildi
                  </p>
                )}
                <label className="label">Tasdiqlash kodi (6 raqam)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resending}
                  className="text-xs mt-2"
                  style={{ color: 'var(--accent)' }}
                >
                  {resending ? 'Yuborilmoqda...' : 'Kodni qayta yuborish'}
                </button>
              </div>
            )}

            <div>
              <label className="label">{t('password')}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12 notranslate"
                  translate="no"
                  placeholder="Kamida 6 ta belgi"
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
                placeholder="Parolni takrorlang"
              />
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : otpSent
                  ? <>Tasdiqlash va hisob yaratish <ArrowRight size={16} /></>
                  : <>Tasdiqlash kodini olish <ArrowRight size={16} /></>}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <RegisterPageContent />
    </Suspense>
  );
}
