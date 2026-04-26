'use client';

import { Suspense, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AuthPreferences } from '@/components/AuthPreferences';

const schema = z.object({
  email: z.string().email('Noto\'g\'ri email'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
});
type FormData = z.infer<typeof schema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetStep, setResetStep] = useState<'login' | 'request' | 'verify'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(true);
  const [smtpConfigured, setSmtpConfigured] = useState(true);
  const { t, theme } = useAppStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/auth/config', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setGoogleConfigured(Boolean(data.googleConfigured));
        setSmtpConfigured(Boolean(data.smtpConfigured));
      } catch {
        setGoogleConfigured(true);
        setSmtpConfigured(true);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    const error = searchParams.get('error');
    if (!error) return;

    const messages: Record<string, string> = {
      OAuthSignin: 'Google orqali kirish to\'g\'ri sozlanmagan. Vercel muhit o\'zgaruvchilarini va Google yo\'naltirish manzilini tekshiring.',
      OAuthCallback: 'Google callback xatosi. Google Cloud Console-da ishlab turgan yo\'naltirish manzilini tekshiring.',
      AccessDenied: 'Kirish rad etildi.',
      Configuration: 'Autentifikatsiya sozlamasi to\'liq emas.',
    };

    toast.error(messages[error] || 'Autentifikatsiya xatosi. Qayta urinib ko\'ring.');
  }, [searchParams]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error(res.error || 'Noto\'g\'ri ma\'lumotlar');
      } else {
        toast.success('Xush kelibsiz!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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

  const handleResetRequest = async () => {
    if (!smtpConfigured) {
      toast.error('Parolni tiklash hali sozlanmagan.');
      return;
    }

    if (!resetEmail) {
      toast.error('Iltimos, email manzilingizni kiriting');
      return;
    }

    setRequestLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password/request', {
        email: resetEmail,
      });
      toast.success(res.data.message || 'Kod yuborildi');
      setResetStep('verify');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Kodni yuborib bo\'lmadi');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleResetVerify = async () => {
    if (!resetEmail || !resetCode || !resetPassword) {
      toast.error('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      toast.error('Parollar mos kelmaydi');
      return;
    }

    setVerifyLoading(true);
    try {
      await axios.post('/api/auth/forgot-password/verify', {
        email: resetEmail,
        code: resetCode,
        password: resetPassword,
      });

      const res = await signIn('credentials', {
        email: resetEmail,
        password: resetPassword,
        redirect: false,
      });

      if (res?.error) {
        toast.success('Parol o\'zgartirildi. Iltimos, qayta kiring.');
        setResetStep('login');
        return;
      }

      toast.success('Parol muvaffaqiyatli yangilandi!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Kodni tasdiqlash xatosi');
    } finally {
      setVerifyLoading(false);
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
            <p className="text-5xl font-bold leading-tight" style={{ color: theme === 'light' ? '#0f172a' : '#fff' }}>Startup asoschilari uchun tezkor va qulay ish muhiti.</p>
            <p className="text-base mt-5 max-w-lg" style={{ color: theme === 'light' ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.7)' }}>Rezidentlikka ariza topshiring, qabul qilining, uchrashuvlarni belgilang, haftalik hisobotlar yuboring va GTM strategiyangiz hamda 18 oylik sprintga kiring — hammasi bitta ish muhitida.</p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-xl" />
        </div>

        <div className="flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md animate-fade-in">
            <AuthPreferences />
            <div className="card p-8 md:p-9" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.88)' : 'rgba(12, 15, 33, 0.88)', borderColor: theme === 'light' ? 'rgba(99,102,241,0.15)' : 'rgba(129,140,248,0.18)', boxShadow: '0 24px 90px rgba(0,0,0,0.18)' }}>
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#7dd3fc' }}>Xush kelibsiz</p>
                <h1 className="text-3xl font-bold mt-3" style={{ color: 'var(--text-primary)' }}>{t('signInAccount')}</h1>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{t('welcomeBack')} — keling, biror narsa quraylik.</p>
              </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!googleConfigured || googleLoading || loading || requestLoading || verifyLoading}
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
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div
                className="w-full border-t"
                style={{ borderColor: theme === 'light' ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.24em]">
              <span
                className="px-3"
                style={{
                  background: theme === 'light' ? 'rgba(255,255,255,0.88)' : 'rgba(12, 15, 33, 0.88)',
                  color: 'var(--text-muted)',
                }}
              >
                {resetStep === 'login' ? 'yoki email orqali kiring' : 'parolni tiklash'}
              </span>
            </div>
          </div>

          {resetStep === 'login' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">{t('email')}</label>
              <input
                {...register('email')}
                type="email"
                className="input notranslate"
                translate="no"
                placeholder="siz@example.com"
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
              disabled={loading || googleLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{t('signIn')} <ArrowRight size={16} /></>
              )}
            </button>

            <button
              type="button"
              onClick={() => setResetStep('request')}
              className="w-full text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              Parolni unutdingizmi?
            </button>
          </form>
          ) : null}

          {resetStep === 'request' ? (
            <div className="space-y-4">
              <div>
                <label className="label">Ro&apos;yxatdan o&apos;tgan email</label>
                <input
                  type="email"
                  className="input notranslate"
                  translate="no"
                  placeholder="siz@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleResetRequest}
                disabled={requestLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {requestLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Kod yuborish'}
              </button>
              <button
                type="button"
                onClick={() => setResetStep('login')}
                className="w-full text-sm font-medium"
                style={{ color: 'var(--accent)' }}
              >
                Kirishga qaytish
              </button>
            </div>
          ) : null}

          {resetStep === 'verify' ? (
            <div className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input notranslate"
                  translate="no"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">6 xonali kod</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input notranslate"
                  translate="no"
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div>
                <label className="label">Yangi parol</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input notranslate"
                  translate="no"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Yangi parolni tasdiqlang</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input notranslate"
                  translate="no"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleResetVerify}
                disabled={verifyLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {verifyLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Kodni tekshirish va kirish'}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setResetStep('request')}
                  style={{ color: 'var(--accent)' }}
                >
                  Qayta yuborish
                </button>
                <button
                  type="button"
                  onClick={() => setResetStep('login')}
                  style={{ color: 'var(--accent)' }}
                >
                  Kirishga qaytish
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('noAccount')}{' '}
              <Link href="/register" style={{ color: 'var(--accent)' }} className="font-medium hover:underline">
                {t('createAccount')}
              </Link>
            </p>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginPageContent />
    </Suspense>
  );
}
