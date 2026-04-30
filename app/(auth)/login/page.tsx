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
import { ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AuthPreferences } from '@/components/AuthPreferences';

const schema = z.object({
  email: z.string().email('Noto\'g\'ri email'),
});
type FormData = z.infer<typeof schema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpResident, setOtpResident] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(true);
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
      OAuthSignin: 'Google orqali kirish to\'g\'ri sozlanmagan. Vercel muhit o\'zgaruvchilarini va Google yo\'naltirish manzilini tekshiring.',
      OAuthCallback: 'Google callback xatosi. Google Cloud Console-da ishlab turgan yo\'naltirish manzilini tekshiring.',
      AccessDenied: 'Kirish rad etildi.',
      Configuration: 'Autentifikatsiya sozlamasi to\'liq emas.',
    };

    toast.error(messages[error] || 'Autentifikatsiya xatosi. Qayta urinib ko\'ring.');
  }, [searchParams]);

  const requestLoginOtp = async (email: string) => {
    const res = await axios.post('/api/auth/login/request', { email });
    setOtpSent(true);
    setOtpResident(Boolean(res.data.isResident));
    toast.success(res.data.isResident
      ? 'Rezident emailingizga kirish kodi yuborildi'
      : 'Kirish kodi emailingizga yuborildi');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (!otpSent) {
        await requestLoginOtp(data.email);
        return;
      }
      if (!/^\d{6}$/.test(otp)) {
        toast.error('6 raqamli kod kiriting');
        return;
      }
      const res = await signIn('otp', {
        email: data.email,
        otp,
        redirect: false,
      });
      if (res?.error) {
        toast.error(res.error || 'Kod noto\'g\'ri');
      } else {
        toast.success('Xush kelibsiz!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const resendLoginOtp = async () => {
    const email = (document.querySelector('input[name="email"]') as HTMLInputElement | null)?.value;
    if (!email) {
      toast.error('Email kiriting');
      return;
    }
    setResending(true);
    try {
      await requestLoginOtp(email);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Kod qayta yuborilmadi');
    } finally {
      setResending(false);
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
                yoki email orqali kiring
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">{t('email')}</label>
              <input
                {...register('email')}
                name="email"
                type="email"
                className="input notranslate"
                translate="no"
                placeholder="siz@example.com"
                autoComplete="email"
                disabled={otpSent}
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
            </div>

            {otpSent && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}>
                {otpResident && (
                  <p className="text-xs mb-3" style={{ color: '#10b981' }}>
                    ✅ Rezident emailingizga kirish kodi yuborildi
                  </p>
                )}
                <label className="label">Kirish kodi (6 raqam)</label>
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
                  onClick={resendLoginOtp}
                  disabled={resending}
                  className="text-xs mt-2"
                  style={{ color: 'var(--accent)' }}
                >
                  {resending ? 'Yuborilmoqda...' : 'Kodni qayta yuborish'}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : otpSent
                  ? <>Tasdiqlash va kirish <ArrowRight size={16} /></>
                  : <>Kirish kodini olish <ArrowRight size={16} /></>}
            </button>

            {otpSent && (
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(''); }}
                className="w-full text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                Boshqa email kiritish
              </button>
            )}
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
