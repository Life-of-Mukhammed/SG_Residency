'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft, Building2, ChevronLeft, ChevronRight, FileText,
  Rocket, UploadCloud, UserPlus,
} from 'lucide-react';
import { UZ_REGIONS } from '@/lib/regions';
import { DEFAULT_STARTUP_SPHERE, STARTUP_SPHERES } from '@/lib/startup-spheres';

type FormState = {
  applicationType: 'existing_resident' | 'new_applicant';
  startup_name: string;
  founder_name: string;
  region: string;
  startup_sphere: string;
  stage: 'idea' | 'mvp' | 'growth' | 'scale';
  description: string;
  phone: string;
  telegram: string;
  pitch_deck: string;
  startup_logo: string;
  resume_url: string;
  team_size: string;
  commitment: 'full-time' | 'part-time';
  mrr: string;
  users_count: string;
  investment_raised: string;
};

const EMPTY_FORM: FormState = {
  applicationType: 'new_applicant',
  startup_name: '',
  founder_name: '',
  region: 'Toshkent shahri',
  startup_sphere: DEFAULT_STARTUP_SPHERE,
  stage: 'mvp',
  description: '',
  phone: '',
  telegram: '',
  pitch_deck: '',
  startup_logo: '',
  resume_url: '',
  team_size: '1',
  commitment: 'full-time',
  mrr: '0',
  users_count: '0',
  investment_raised: '0',
};

export default function ApplyPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startup, setStartup] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [sr, qr] = await Promise.all([
          axios.get('/api/startups?limit=1'),
          axios.get('/api/residency-questions'),
        ]);
        const existingStartup = sr.data.startups?.[0] ?? null;
        setStartup(existingStartup);

        const active = (qr.data.questions || []).filter((q: any) => q.isActive !== false);
        setQuestions(active);
        const init: Record<string, string> = {};
        active.forEach((q: any) => { init[q._id] = ''; });
        setAnswers(init);

        const fullName = session?.user?.name || '';
        if (existingStartup) {
          setForm({
            applicationType: existingStartup.applicationType || 'new_applicant',
            startup_name: existingStartup.startup_name || '',
            founder_name: existingStartup.founder_name || fullName,
            region: existingStartup.region || 'Toshkent shahri',
            startup_sphere: existingStartup.startup_sphere || DEFAULT_STARTUP_SPHERE,
            stage: existingStartup.stage || 'mvp',
            description: existingStartup.description || '',
            phone: existingStartup.phone === 'Not provided' || existingStartup.phone === 'Kiritilmagan' ? '' : existingStartup.phone || '',
            telegram: existingStartup.telegram === '@not_provided' ? '' : existingStartup.telegram || '',
            pitch_deck: existingStartup.pitch_deck || '',
            startup_logo: existingStartup.startup_logo || '',
            resume_url: existingStartup.resume_url || '',
            team_size: String(existingStartup.team_size ?? 1),
            commitment: existingStartup.commitment || 'full-time',
            mrr: String(existingStartup.mrr ?? 0),
            users_count: String(existingStartup.users_count ?? 0),
            investment_raised: String(existingStartup.investment_raised ?? 0),
          });
        } else {
          setForm({ ...EMPTY_FORM, founder_name: fullName });
        }
      } catch { /* ignore */ }
      finally { setInitialLoading(false); }
    };
    init();
  }, [session?.user?.name]);

  const steps = useMemo(() => {
    return form.applicationType === 'existing_resident'
      ? ['Rezidentlik turi', 'Startup ma\'lumotlari', 'Ko\'rib chiqish']
      : ['Rezidentlik turi', 'Asoschi va startup', 'Savollar', 'Fayllar va metrikalar', 'Ko\'rib chiqish'];
  }, [form.applicationType]);

  const setField = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value as never }));

  const validateStep = () => {
    const errs: Record<string, string> = {};
    if (step === 0 && !form.applicationType) errs.applicationType = 'Birini tanlang';

    if (form.applicationType === 'existing_resident') {
      if (step === 1) {
        if (!form.startup_name.trim()) errs.startup_name = 'Startup nomi kiritilishi shart';
        if (!form.description.trim()) errs.description = 'Tavsif kiritilishi shart';
        if (!form.pitch_deck.trim()) errs.pitch_deck = 'Taqdimot havolasi kiritilishi shart';
      }
    } else {
      if (step === 1) {
        if (!form.startup_name.trim()) errs.startup_name = 'Startup nomi kiritilishi shart';
        if (!form.founder_name.trim()) errs.founder_name = 'Asoschi roli kiritilishi shart';
        if (!form.description.trim()) errs.description = 'Tavsif kiritilishi shart';
        if (!form.phone.trim()) errs.phone = 'Telefon kiritilishi shart';
        if (!form.telegram.trim()) errs.telegram = 'Telegram kiritilishi shart';
      }
      if (step === 2) {
        questions.forEach((q) => {
          if (q.required && !answers[q._id]?.trim()) errs[`q_${q._id}`] = 'Bu maydon to\'ldirilishi shart';
        });
      }
      if (step === 3) {
        if (!form.pitch_deck.trim()) errs.pitch_deck = 'Taqdimot havolasi kiritilishi shart';
        if (!form.resume_url.trim()) errs.resume_url = 'Rezyume manzili kiritilishi shart';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep((p) => Math.min(p + 1, steps.length - 1)); };

  const submit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      await axios.post('/api/startups', {
        applicationType: form.applicationType,
        startup_name: form.startup_name,
        founder_name: form.founder_name,
        region: form.region,
        startup_sphere: form.startup_sphere,
        stage: form.stage,
        description: form.description,
        phone: form.phone,
        telegram: form.telegram,
        pitch_deck: form.pitch_deck,
        startup_logo: form.startup_logo,
        resume_url: form.resume_url,
        team_size: Number(form.team_size),
        commitment: form.commitment,
        mrr: Number(form.mrr),
        users_count: Number(form.users_count),
        investment_raised: Number(form.investment_raised),
        applicationAnswers: questions.map((q) => ({
          questionId: q._id,
          question: q.question,
          answer: answers[q._id] || '',
        })).filter((a) => a.answer.trim()),
      });
      toast.success('Ariza muvaffaqiyatli yuborildi');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ariza yuborib bo\'lmadi');
    } finally {
      setLoading(false);
    }
  };

  const reviewItems =
    form.applicationType === 'existing_resident'
      ? [
          ['Rezidentlik turi', 'Allaqachon Startup Garage rezidenti'],
          ['Startup nomi', form.startup_name],
          ['Startup tavsifi', form.description],
          ['Taqdimot havolasi', form.pitch_deck],
          ['Logo havolasi', form.startup_logo],
          ['Oylik takroriy daromad', form.mrr],
          ['Jalb qilingan investitsiya', form.investment_raised],
        ]
      : [
          ['Rezidentlik turi', 'Yangi rezidentlikka ariza'],
          ['Startup nomi', form.startup_name],
          ['Asoschi roli', form.founder_name],
          ['Hudud', form.region],
          ['Soha', form.startup_sphere],
          ['Bosqich', form.stage],
          ['Taqdimot havolasi', form.pitch_deck],
          ['Logo havolasi', form.startup_logo],
          ['Rezyume', form.resume_url],
        ];

  if (initialLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-3xl mx-auto">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">

      {/* Bosh navigatsiya */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl transition-all"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
            <ArrowLeft size={15} /> Orqaga
          </button>
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
            Rezidentlikka ariza
          </p>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {startup?.status === 'rejected' ? 'Arizani yangilash' : 'Rezidentlik so\'rovi'}
          </h1>
        </div>
      </div>

      {/* Qadam ko'rsatkichlari */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: i <= step ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: i <= step ? '#fff' : 'var(--text-muted)',
                }}
              >
                {i + 1}
              </div>
              <span className="text-xs hidden sm:block" style={{ color: i === step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px flex-1" style={{ background: i < step ? 'var(--accent)' : 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Forma tanasi */}
      <div className="card">

        {/* Qadam 0: Rezidentlik turini tanlash */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Ariza turini tanlang
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  key: 'new_applicant' as const,
                  icon: <UserPlus size={26} />,
                  title: 'Endi rezidentlikka topshirmoqchiman',
                  description: 'Bu yo\'nalishda savollar, rezyume va taqdimot havolasini to\'ldirasiz. Ariza yangi nomzodlar ro\'yxatiga tushadi.',
                  color: '#10b981',
                  bg: 'rgba(16,185,129,0.1)',
                },
                {
                  key: 'existing_resident' as const,
                  icon: <Building2 size={26} />,
                  title: 'Men Startup Garage rezidentiman',
                  description: 'Siz allaqachon rezident bo\'lsangiz, qisqa so\'rov yuboring. Startup tavsifi, daromad va taqdimot havolasi so\'raladi.',
                  color: '#6366f1',
                  bg: 'rgba(99,102,241,0.1)',
                },
              ].map((opt) => {
                const selected = form.applicationType === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => { setField('applicationType', opt.key); }}
                    className="rounded-2xl p-5 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      border: selected ? `2px solid ${opt.color}` : '2px solid var(--border)',
                      background: selected ? opt.bg : 'var(--bg-secondary)',
                      boxShadow: selected ? `0 0 0 4px ${opt.color}15` : 'none',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{
                        background: selected ? opt.color : 'var(--bg-card)',
                        color: selected ? '#fff' : opt.color,
                      }}
                    >
                      {opt.icon}
                    </div>
                    <p className="font-bold text-sm mb-1.5" style={{ color: 'var(--text-primary)' }}>{opt.title}</p>
                    <p className="text-xs leading-5" style={{ color: 'var(--text-muted)' }}>{opt.description}</p>
                    <div
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        background: selected ? opt.color : 'var(--bg-card)',
                        color: selected ? '#fff' : opt.color,
                        border: selected ? 'none' : `1px solid ${opt.color}33`,
                      }}
                    >
                      {selected ? '✓ Tanlandi' : 'Tanlash'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Qadam 1: Mavjud rezident */}
        {step === 1 && form.applicationType === 'existing_resident' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Startup ma'lumotlari</h2>

            <div>
              <label className="label">Startup nomi *</label>
              <input value={form.startup_name} onChange={(e) => setField('startup_name', e.target.value)}
                className="input" placeholder="Startapingiz nomi" />
              {errors.startup_name && <p className="err">{errors.startup_name}</p>}
            </div>

            <div>
              <label className="label">Startup tavsifi *</label>
              <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
                className="input min-h-28 resize-none"
                placeholder="Startapingiz haqida qisqacha: muammo, yechim, hozirgi holat..." />
              {errors.description && <p className="err">{errors.description}</p>}
            </div>

            <div>
              <label className="label">Taqdimot havolasi *</label>
              <input value={form.pitch_deck} onChange={(e) => setField('pitch_deck', e.target.value)}
                className="input" placeholder="https://docs.google.com/..." />
              {errors.pitch_deck && <p className="err">{errors.pitch_deck}</p>}
            </div>

            <div>
              <label className="label">Logo havolasi</label>
              <input value={form.startup_logo} onChange={(e) => setField('startup_logo', e.target.value)}
                className="input" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Oylik daromad</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
                  <input type="number" value={form.mrr}
                    onChange={(e) => setField('mrr', e.target.value)} className="input pl-8" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="label">Jalb qilingan investitsiya</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
                  <input type="number" value={form.investment_raised}
                    onChange={(e) => setField('investment_raised', e.target.value)} className="input pl-8" placeholder="0" />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Foydalanuvchilar soni</label>
              <input type="number" value={form.users_count}
                onChange={(e) => setField('users_count', e.target.value)} className="input" placeholder="0" />
            </div>
          </div>
        )}

        {/* Qadam 1: Yangi ariza */}
        {step === 1 && form.applicationType === 'new_applicant' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Asoschi va startup</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Startup nomi *</label>
                <input value={form.startup_name} onChange={(e) => setField('startup_name', e.target.value)}
                  className="input" placeholder="Startapingiz nomi" />
                {errors.startup_name && <p className="err">{errors.startup_name}</p>}
              </div>
              <div>
                <label className="label">Asoschi roli *</label>
                <input value={form.founder_name} onChange={(e) => setField('founder_name', e.target.value)}
                  className="input" placeholder="Asoschi yoki texnik rahbar" />
                {errors.founder_name && <p className="err">{errors.founder_name}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Hudud</label>
                <select value={form.region} onChange={(e) => setField('region', e.target.value)} className="input">
                  {UZ_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Startup sohasi</label>
                <select value={form.startup_sphere} onChange={(e) => setField('startup_sphere', e.target.value)} className="input">
                  {STARTUP_SPHERES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Bosqich</label>
                <select value={form.stage} onChange={(e) => setField('stage', e.target.value)} className="input">
                  <option value="idea">G'oya</option>
                  <option value="mvp">MVP</option>
                  <option value="growth">O'sish</option>
                  <option value="scale">Kengayish</option>
                </select>
              </div>
              <div>
                <label className="label">Telefon *</label>
                <input value={form.phone} onChange={(e) => setField('phone', e.target.value)}
                  className="input" placeholder="+998..." />
                {errors.phone && <p className="err">{errors.phone}</p>}
              </div>
              <div>
                <label className="label">Telegram *</label>
                <input value={form.telegram} onChange={(e) => setField('telegram', e.target.value)}
                  className="input" placeholder="@username" />
                {errors.telegram && <p className="err">{errors.telegram}</p>}
              </div>
            </div>

            <div>
              <label className="label">Startup tavsifi *</label>
              <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
                className="input min-h-28 resize-none"
                placeholder="Startapingiz, muammo va hozirgi natijalar haqida yozing..." />
              {errors.description && <p className="err">{errors.description}</p>}
            </div>
          </div>
        )}

        {/* Qadam 2: Savollar (yangi ariza) */}
        {step === 2 && form.applicationType === 'new_applicant' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Ariza savollari</h2>
            {questions.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Hozircha savollar qo'shilmagan</p>
            ) : questions.map((q) => (
              <div key={q._id}>
                <label className="label">
                  {q.question}
                  {q.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                </label>
                {q.type === 'textarea' ? (
                  <textarea value={answers[q._id] || ''} onChange={(e) => setAnswers((p) => ({ ...p, [q._id]: e.target.value }))}
                    className="input min-h-28 resize-none" placeholder={q.placeholder || ''} />
                ) : (
                  <input type={q.type === 'url' ? 'url' : 'text'} value={answers[q._id] || ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [q._id]: e.target.value }))}
                    className="input" placeholder={q.placeholder || ''} />
                )}
                {errors[`q_${q._id}`] && <p className="err">{errors[`q_${q._id}`]}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Qadam 3: Fayllar va metrikalar */}
        {step === 3 && form.applicationType === 'new_applicant' && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Fayllar va metrikalar</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Taqdimot havolasi *</label>
                <input value={form.pitch_deck} onChange={(e) => setField('pitch_deck', e.target.value)}
                  className="input" placeholder="https://docs.google.com/..." />
                {errors.pitch_deck && <p className="err">{errors.pitch_deck}</p>}
              </div>
              <div>
                <label className="label">Rezyume manzili *</label>
                <input value={form.resume_url} onChange={(e) => setField('resume_url', e.target.value)}
                  className="input" placeholder="https://drive.google.com/..." />
                {errors.resume_url && <p className="err">{errors.resume_url}</p>}
              </div>
            </div>

            <div>
              <label className="label">Logo havolasi</label>
              <input value={form.startup_logo} onChange={(e) => setField('startup_logo', e.target.value)}
                className="input" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="label">Jamoa hajmi</label>
                <input type="number" value={form.team_size}
                  onChange={(e) => setField('team_size', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Oylik daromad</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>$</span>
                  <input type="number" value={form.mrr}
                    onChange={(e) => setField('mrr', e.target.value)} className="input pl-7" />
                </div>
              </div>
              <div>
                <label className="label">Foydalanuvchilar</label>
                <input type="number" value={form.users_count}
                  onChange={(e) => setField('users_count', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Investitsiya</label>
                <input type="number" value={form.investment_raised}
                  onChange={(e) => setField('investment_raised', e.target.value)} className="input" />
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <UploadCloud size={16} style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Startup to'plami</p>
              </div>
              <p className="text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
                Taqdimot, rezyume va asosiy ko‘rsatkichlarni kiriting. Ariza savollari admin yoki menejer tomonidan alohida ko‘rib chiqiladi.
              </p>
            </div>
          </div>
        )}

        {/* Oxirgi qadam: Ko'rib chiqish */}
        {step === steps.length - 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>So'rovingizni ko'rib chiqing</h2>

            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {reviewItems.map(([label, value], i) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                  style={{
                    borderBottom: i < reviewItems.length - 1 ? '1px solid var(--border)' : 'none',
                    background: i % 2 === 0 ? 'var(--bg-secondary)' : 'transparent',
                  }}
                >
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="text-xs font-medium text-right break-all max-w-[60%]" style={{ color: 'var(--text-primary)' }}>
                    {value || '—'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: 'var(--accent)' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {form.applicationType === 'existing_resident'
                    ? 'So\'rovingiz Panel bo\'limida ko\'rinadi va menejer ko\'rib chiqadi.'
                    : 'Arizangiz Yangi Leadlar bo\'limiga tushadi va menejer ko\'rib chiqadi.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigatsiya tugmalari */}
      <div className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={() => setStep((p) => Math.max(p - 1, 0))}
          className={`btn-secondary flex items-center gap-2 ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
        >
          <ChevronLeft size={16} /> Orqaga
        </button>

        {step < steps.length - 1 ? (
          <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">
            Keyingi <ChevronRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? 'Yuborilmoqda...' : <><Rocket size={15} /> Ariza yuborish</>}
          </button>
        )}
      </div>
    </div>
  );
}
