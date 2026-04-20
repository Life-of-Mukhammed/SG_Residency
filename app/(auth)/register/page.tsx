'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Rocket, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
  const { t } = useAppStore();

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
      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(139,92,246,0.08) 0%, transparent 50%)',
      }} />

      <div className="w-full max-w-md animate-fade-in">
        <AuthPreferences />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Rocket size={22} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Residency</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Startup Accelerator OS</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('createAccount')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Join the residency program today.</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('firstName')}</label>
                <input {...register('name')} className="input" placeholder="Aisha" />
                {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">{t('lastName')}</label>
                <input {...register('surname')} className="input" placeholder="Karimova" />
                {errors.surname && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.surname.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">{t('email')}</label>
              <input {...register('email')} type="email" className="input" placeholder="you@example.com" />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">{t('password')}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12"
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
                className="input"
                placeholder="Repeat password"
              />
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
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
  );
}
