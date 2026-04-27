'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, FileText, Rocket, UploadCloud, X, Building2, UserPlus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { UZ_REGIONS } from '@/lib/regions';
import { DEFAULT_STARTUP_SPHERE, STARTUP_SPHERES } from '@/lib/startup-spheres';

const REGIONS = UZ_REGIONS;

type Props = {
  open: boolean;
  onClose?: () => void;
  onSubmitted?: () => void;
  startup?: any | null;
  lockOpen?: boolean;
};

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
  resume_url: '',
  team_size: '1',
  commitment: 'full-time',
  mrr: '0',
  users_count: '0',
  investment_raised: '0',
};

export default function ResidencyApplicationModal({ open, onClose, onSubmitted, startup, lockOpen = false }: Props) {
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const steps = useMemo(() => {
    return form.applicationType === 'existing_resident'
      ? ['Rezidentlik turi', 'Startup ma\'lumotlari', 'Ko\'rib chiqish']
      : ['Rezidentlik turi', 'Asoschi va startup', 'Savollar', 'Fayllar va metrikalar', 'Ko\'rib chiqish'];
  }, [form.applicationType]);

  useEffect(() => {
    if (!open) return;
    axios.get('/api/residency-questions').then((r) => {
      const active = (r.data.questions || []).filter((q: any) => q.isActive !== false);
      setQuestions(active);
      const init: Record<string, string> = {};
      active.forEach((q: any) => { init[q._id] = ''; });
      setAnswers(init);
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const fullName = session?.user?.name || '';
    const baseForm: FormState = startup
      ? {
          applicationType: startup.applicationType || 'existing_resident',
          startup_name: startup.startup_name || '',
          founder_name: startup.founder_name || fullName,
          region: startup.region || 'Toshkent shahri',
          startup_sphere: startup.startup_sphere || DEFAULT_STARTUP_SPHERE,
          stage: startup.stage || 'mvp',
          description: startup.description || '',
          phone: startup.phone === 'Not provided' ? '' : startup.phone || '',
          telegram: startup.telegram === '@not_provided' ? '' : startup.telegram || '',
          pitch_deck: startup.pitch_deck || '',
          resume_url: startup.resume_url || '',
          team_size: String(startup.team_size ?? 1),
          commitment: startup.commitment || 'full-time',
          mrr: String(startup.mrr ?? 0),
          users_count: String(startup.users_count ?? 0),
          investment_raised: String(startup.investment_raised ?? 0),
        }
      : {
          ...EMPTY_FORM,
          founder_name: fullName,
        };

    setForm(baseForm);
    setStep(0);
    setErrors({});
  }, [open, session?.user?.name, startup]);

  if (!open) return null;

  const setField = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value as never }));

  const validateCurrentStep = () => {
    const nextErrors: Record<string, string> = {};

    if (step === 0 && !form.applicationType) {
      nextErrors.applicationType = 'Birini tanlang';
    }

    if (form.applicationType === 'existing_resident') {
      if (step === 1) {
        if (!form.startup_name.trim()) nextErrors.startup_name = 'Startup nomi kiritilishi shart';
        if (!form.description.trim() || form.description.trim().length < 20) nextErrors.description = 'Tavsif kamida 20 ta belgidan iborat bo\'lishi kerak';
        if (!form.pitch_deck.trim()) nextErrors.pitch_deck = 'Pitch deck manzili kiritilishi shart';
      }
    } else {
      if (step === 1) {
        if (!form.startup_name.trim()) nextErrors.startup_name = 'Startup nomi kiritilishi shart';
        if (!form.founder_name.trim()) nextErrors.founder_name = 'Asoschi roli kiritilishi shart';
        if (!form.region.trim()) nextErrors.region = 'Hudud kiritilishi shart';
        if (!form.startup_sphere.trim()) nextErrors.startup_sphere = 'Soha kiritilishi shart';
        if (!form.description.trim() || form.description.trim().length < 20) nextErrors.description = 'Tavsif kamida 20 ta belgidan iborat bo\'lishi kerak';
        if (!form.phone.trim()) nextErrors.phone = 'Telefon kiritilishi shart';
        if (!form.telegram.trim()) nextErrors.telegram = 'Telegram kiritilishi shart';
      }
      if (step === 2) {
        questions.forEach((q) => {
          if (q.required && !answers[q._id]?.trim()) {
            nextErrors[`q_${q._id}`] = 'Bu maydon to\'ldirilishi shart';
          }
        });
      }
      if (step === 3) {
        if (!form.pitch_deck.trim()) nextErrors.pitch_deck = 'Pitch deck manzili kiritilishi shart';
        if (!form.resume_url.trim()) nextErrors.resume_url = 'Rezyume manzili kiritilishi shart';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const submit = async () => {
    if (!validateCurrentStep()) return;

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
      onSubmitted?.();
      onClose?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ariza yuborib bo\'lmadi');
    } finally {
      setLoading(false);
    }
  };

  const currentReviewItems =
    form.applicationType === 'existing_resident'
      ? [
          ['Rezidentlik turi', 'Allaqachon Startup Garage residenti'],
          ['Startup nomi', form.startup_name],
          ['Startup tavsifi', form.description],
          ['Pitch Deck', form.pitch_deck],
          ['MRR ($)', form.mrr],
          ['Jalb qilingan investitsiya ($)', form.investment_raised],
        ]
      : [
          ['Rezidentlik turi', 'Yangi rezidentlikka ariza'],
          ['Startup nomi', form.startup_name],
          ['Asoschi roli', form.founder_name],
          ['Hudud', form.region],
          ['Soha', form.startup_sphere],
          ['Bosqich', form.stage],
          ['Pitch Deck', form.pitch_deck],
          ['Rezyume', form.resume_url],
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.72)', backdropFilter: 'blur(10px)' }}>
      <div className="card w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>Rezidentlikka ariza</p>
            <h2 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
              {startup?.status === 'rejected' ? 'Arizani yangilash' : 'Rezidentlik so\'rovi'}
            </h2>
          </div>
          {!lockOpen && (
            <button onClick={onClose} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Step indicators */}
        <div className="px-6 pt-5 flex items-center gap-3">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: index <= step ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: index <= step ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {index + 1}
                </div>
                <span className="text-sm hidden md:block" style={{ color: index === step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && <div className="h-px flex-1" style={{ background: index < step ? 'var(--accent)' : 'var(--border)' }} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1">

          {/* Step 0: Rezidentlik turi tanlash */}
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  key: 'existing_resident' as const,
                  icon: <Building2 size={28} />,
                  title: 'Men Startup Garage residentiman',
                  description: 'Siz allaqachon rezident bo\'lsangiz, qisqa so\'rov yuboring. Startup tavsifi, MRR va pitch deck so\'raladi.',
                  color: '#6366f1',
                  bg: 'rgba(99,102,241,0.1)',
                },
                {
                  key: 'new_applicant' as const,
                  icon: <UserPlus size={28} />,
                  title: 'Endi residentlikka topshirmoqchiman',
                  description: 'Bu yo\'nalishda savollar, resume va pitch deck to\'ldirasiz. Ariza Yangi Leadlar ro\'yxatiga tushadi.',
                  color: '#10b981',
                  bg: 'rgba(16,185,129,0.1)',
                },
              ].map((option) => {
                const isSelected = form.applicationType === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setField('applicationType', option.key)}
                    className="rounded-3xl p-7 text-left transition-all hover:scale-[1.02] active:scale-[0.99]"
                    style={{
                      border: isSelected ? `2px solid ${option.color}` : '2px solid var(--border)',
                      background: isSelected ? option.bg : 'var(--bg-secondary)',
                      boxShadow: isSelected ? `0 0 0 4px ${option.color}18` : 'none',
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                      style={{
                        background: isSelected ? option.color : 'var(--bg-card)',
                        color: isSelected ? '#fff' : option.color,
                      }}
                    >
                      {option.icon}
                    </div>
                    <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{option.title}</p>
                    <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>{option.description}</p>
                    <div
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                      style={{
                        background: isSelected ? option.color : 'var(--bg-card)',
                        color: isSelected ? '#fff' : option.color,
                      }}
                    >
                      {isSelected ? 'Tanlangan' : 'Tanlash'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 1: Mavjud rezident uchun */}
          {step === 1 && form.applicationType === 'existing_resident' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="label">Startup nomi *</label>
                <input value={form.startup_name} onChange={(e) => setField('startup_name', e.target.value)} className="input" placeholder="Startapingiz nomi" />
                {errors.startup_name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.startup_name}</p>}
              </div>

              <div>
                <label className="label">Startup tavsifi *</label>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} className="input min-h-28 resize-none" placeholder="Startapingiz haqida qisqacha: muammo, yechim, hozirgi holat..." />
                {errors.description && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.description}</p>}
              </div>

              <div>
                <label className="label">Pitch Deck manzili *</label>
                <input value={form.pitch_deck} onChange={(e) => setField('pitch_deck', e.target.value)} className="input" placeholder="https://docs.google.com/..." />
                {errors.pitch_deck && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.pitch_deck}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">MRR ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
                    <input type="number" min="0" value={form.mrr} onChange={(e) => setField('mrr', e.target.value)} className="input pl-8" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="label">Jalb qilingan investitsiya ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
                    <input type="number" min="0" value={form.investment_raised} onChange={(e) => setField('investment_raised', e.target.value)} className="input pl-8" placeholder="0" />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Foydalanuvchilar soni</label>
                <input type="number" min="0" value={form.users_count} onChange={(e) => setField('users_count', e.target.value)} className="input" placeholder="0" />
              </div>
            </div>
          )}

          {/* Step 1: Yangi ariza beruvchi uchun */}
          {step === 1 && form.applicationType === 'new_applicant' && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Startup nomi *</label>
                  <input value={form.startup_name} onChange={(e) => setField('startup_name', e.target.value)} className="input" placeholder="Startapingiz nomi" />
                  {errors.startup_name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.startup_name}</p>}
                </div>
                <div>
                  <label className="label">Asoschi roli *</label>
                  <input value={form.founder_name} onChange={(e) => setField('founder_name', e.target.value)} className="input" placeholder="CEO / Asoschi / CTO" />
                  {errors.founder_name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.founder_name}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Hudud *</label>
                  <select value={form.region} onChange={(e) => setField('region', e.target.value)} className="input">
                    {REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
                  </select>
                  {errors.region && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.region}</p>}
                </div>
                <div>
                  <label className="label">Startup sohasi *</label>
                  <select value={form.startup_sphere} onChange={(e) => setField('startup_sphere', e.target.value)} className="input">
                    {STARTUP_SPHERES.map((sphere) => <option key={sphere} value={sphere}>{sphere}</option>)}
                  </select>
                  {errors.startup_sphere && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.startup_sphere}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
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
                  <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className="input" placeholder="+998..." />
                  {errors.phone && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.phone}</p>}
                </div>
                <div>
                  <label className="label">Telegram *</label>
                  <input value={form.telegram} onChange={(e) => setField('telegram', e.target.value)} className="input" placeholder="@username" />
                  {errors.telegram && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.telegram}</p>}
                </div>
              </div>

              <div>
                <label className="label">Startup tavsifi *</label>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} className="input min-h-28 resize-none" placeholder="Startapingiz, muammo va hozirgi natijalar haqida yozing..." />
                {errors.description && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.description}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Savollar (yangi ariza) */}
          {step === 2 && form.applicationType === 'new_applicant' && questions.length > 0 && (
            <div className="space-y-5">
              {questions.map((q) => (
                <div key={q._id}>
                  <label className="label">
                    {q.question}
                    {q.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                  </label>
                  {q.type === 'textarea' ? (
                    <textarea
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q._id]: e.target.value }))}
                      className="input min-h-28 resize-none"
                      placeholder={q.placeholder || ''}
                    />
                  ) : (
                    <input
                      type={q.type === 'url' ? 'url' : 'text'}
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q._id]: e.target.value }))}
                      className="input"
                      placeholder={q.placeholder || ''}
                    />
                  )}
                  {errors[`q_${q._id}`] && (
                    <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors[`q_${q._id}`]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Fayllar va metrikalar (yangi ariza) */}
          {step === 3 && form.applicationType === 'new_applicant' && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Pitch Deck manzili *</label>
                  <input value={form.pitch_deck} onChange={(e) => setField('pitch_deck', e.target.value)} className="input" placeholder="https://docs.google.com/..." />
                  {errors.pitch_deck && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.pitch_deck}</p>}
                </div>
                <div>
                  <label className="label">Rezyume manzili *</label>
                  <input value={form.resume_url} onChange={(e) => setField('resume_url', e.target.value)} className="input" placeholder="https://drive.google.com/..." />
                  {errors.resume_url && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.resume_url}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Jamoa hajmi</label>
                  <input type="number" min="1" value={form.team_size} onChange={(e) => setField('team_size', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">MRR ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
                    <input type="number" min="0" value={form.mrr} onChange={(e) => setField('mrr', e.target.value)} className="input pl-8" />
                  </div>
                </div>
                <div>
                  <label className="label">Foydalanuvchilar</label>
                  <input type="number" min="0" value={form.users_count} onChange={(e) => setField('users_count', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Investitsiya ($)</label>
                  <input type="number" min="0" value={form.investment_raised} onChange={(e) => setField('investment_raised', e.target.value)} className="input" />
                </div>
              </div>

              {/* <div className="rounded-3xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <UploadCloud size={18} style={{ color: 'var(--accent)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Startup to\'plami</h3>
                </div>
                <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                  Pitch deck, rezyume va asosiy metrikalarni kiriting. Ariza savollari admin yoki menejer tomonidan alohida ko'rib chiqiladi.
                </p>
              </div> */}
            </div>
          )}

          {/* Oxirgi qadam: Ko'rib chiqish */}
          {step === steps.length - 1 && (
            <div className="space-y-5">
              <div className="rounded-3xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} style={{ color: 'var(--accent)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>So\'rovingizni ko\'rib chiqing</h3>
                </div>
                <div className="space-y-3">
                  {currentReviewItems.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-6 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="text-sm font-medium max-w-[60%] text-right break-all" style={{ color: 'var(--text-primary)' }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
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
              {loading ? 'Yuborilmoqda...' : <><Rocket size={16} /> Ariza yuborish</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
