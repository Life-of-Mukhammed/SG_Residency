'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, FileText, Rocket, UploadCloud, X } from 'lucide-react';
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
  applicationType: 'existing_resident',
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

  const steps = useMemo(() => {
    return form.applicationType === 'existing_resident'
      ? ['Residency Type', 'Startup Request', 'Review']
      : ['Residency Type', 'Founder & Startup', 'Files & Metrics', 'Review'];
  }, [form.applicationType]);

  useEffect(() => {
    if (!open) return;

    const fullName = session?.user?.name || '';
    const baseForm: FormState = startup
      ? {
          applicationType: startup.applicationType || 'new_applicant',
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
      nextErrors.applicationType = 'Choose one option';
    }

    if (form.applicationType === 'existing_resident') {
      if (step === 1) {
        if (!form.startup_name.trim()) nextErrors.startup_name = 'Startup name is required';
        if (!form.pitch_deck.trim()) nextErrors.pitch_deck = 'Pitch deck is required';
      }
    } else {
      if (step === 1) {
        if (!form.startup_name.trim()) nextErrors.startup_name = 'Startup name is required';
        if (!form.founder_name.trim()) nextErrors.founder_name = 'Founder role is required';
        if (!form.region.trim()) nextErrors.region = 'Region is required';
        if (!form.startup_sphere.trim()) nextErrors.startup_sphere = 'Sphere is required';
        if (!form.description.trim() || form.description.trim().length < 20) nextErrors.description = 'Description must be at least 20 characters';
        if (!form.phone.trim()) nextErrors.phone = 'Phone is required';
        if (!form.telegram.trim()) nextErrors.telegram = 'Telegram is required';
      }
      if (step === 2) {
        if (!form.pitch_deck.trim()) nextErrors.pitch_deck = 'Pitch deck is required';
        if (!form.resume_url.trim()) nextErrors.resume_url = 'Resume URL is required';
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
        applicationAnswers: [],
      });

      toast.success('Application submitted successfully');
      onSubmitted?.();
      onClose?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not submit application');
    } finally {
      setLoading(false);
    }
  };

  const currentReviewItems =
    form.applicationType === 'existing_resident'
      ? [
          ['Residency Type', 'Already a Startup Garage resident'],
          ['Startup Name', form.startup_name],
          ['Pitch Deck', form.pitch_deck],
        ]
      : [
          ['Residency Type', 'Applying for new residency'],
          ['Startup Name', form.startup_name],
          ['Founder Role', form.founder_name],
          ['Region', form.region],
          ['Sphere', form.startup_sphere],
          ['Stage', form.stage],
          ['Pitch Deck', form.pitch_deck],
          ['Resume', form.resume_url],
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.72)', backdropFilter: 'blur(10px)' }}>
      <div className="card w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>Apply To Residency</p>
            <h2 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
              {startup?.status === 'rejected' ? 'Re-apply to Residency' : 'Residency Request'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Existing residents can send a quick request. New applicants complete the lead form with resume and pitch deck.
            </p>
          </div>
          {!lockOpen && (
            <button onClick={onClose} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-6 pt-5 flex items-center gap-3">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
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

        <div className="px-6 py-6 overflow-y-auto flex-1">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  key: 'existing_resident' as const,
                  title: 'Men Startup Garage residentiman',
                  description: 'Agar siz allaqachon resident bo‘lsangiz, faqat request yuborasiz. Pitch deck majburiy.',
                },
                {
                  key: 'new_applicant' as const,
                  title: 'Endi residentlikka topshirmoqchiman',
                  description: 'Bu oqimda savollar, resume va pitch deck so‘raladi. Ariza New Leads ro‘yxatiga tushadi.',
                },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setField('applicationType', option.key)}
                  className="rounded-3xl p-6 text-left transition-all"
                  style={{
                    border: form.applicationType === option.key ? '1px solid rgba(99,102,241,0.45)' : '1px solid var(--border)',
                    background: form.applicationType === option.key ? 'rgba(99,102,241,0.10)' : 'var(--bg-card)',
                  }}
                >
                  <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{option.title}</p>
                  <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>{option.description}</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && form.applicationType === 'existing_resident' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="label">Startup Name *</label>
                <input value={form.startup_name} onChange={(e) => setField('startup_name', e.target.value)} className="input" placeholder="Startup name" />
                {errors.startup_name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.startup_name}</p>}
              </div>
              <div>
                <label className="label">Pitch Deck URL *</label>
                <input value={form.pitch_deck} onChange={(e) => setField('pitch_deck', e.target.value)} className="input" placeholder="https://docs.google.com/..." />
                {errors.pitch_deck && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.pitch_deck}</p>}
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border)' }}>
                <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                  If you are an existing resident, this request will be sent to an admin or manager. Once they confirm your residency access, your full dashboard will be unlocked.
                </p>
              </div>
            </div>
          )}

          {step === 1 && form.applicationType === 'new_applicant' && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Startup Name *</label>
                  <input value={form.startup_name} onChange={(e) => setField('startup_name', e.target.value)} className="input" placeholder="Startup name" />
                  {errors.startup_name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.startup_name}</p>}
                </div>
                <div>
                  <label className="label">Founder Role *</label>
                  <input value={form.founder_name} onChange={(e) => setField('founder_name', e.target.value)} className="input" placeholder="CEO / Founder / CTO" />
                  {errors.founder_name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.founder_name}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Region *</label>
                  <select value={form.region} onChange={(e) => setField('region', e.target.value)} className="input">
                    {REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
                  </select>
                  {errors.region && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.region}</p>}
                </div>
                <div>
                  <label className="label">Startup Sphere *</label>
                  <select value={form.startup_sphere} onChange={(e) => setField('startup_sphere', e.target.value)} className="input">
                    {STARTUP_SPHERES.map((sphere) => <option key={sphere} value={sphere}>{sphere}</option>)}
                  </select>
                  {errors.startup_sphere && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.startup_sphere}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Stage</label>
                  <select value={form.stage} onChange={(e) => setField('stage', e.target.value)} className="input">
                    <option value="idea">Idea</option>
                    <option value="mvp">MVP</option>
                    <option value="growth">Growth</option>
                    <option value="scale">Scale</option>
                  </select>
                </div>
                <div>
                  <label className="label">Phone *</label>
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
                <label className="label">Startup Description *</label>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} className="input min-h-28 resize-none" placeholder="Describe your startup, problem and traction..." />
                {errors.description && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.description}</p>}
              </div>
            </div>
          )}

          {step === 2 && form.applicationType === 'new_applicant' && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Pitch Deck URL *</label>
                  <input value={form.pitch_deck} onChange={(e) => setField('pitch_deck', e.target.value)} className="input" placeholder="https://docs.google.com/..." />
                  {errors.pitch_deck && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.pitch_deck}</p>}
                </div>
                <div>
                  <label className="label">Resume URL *</label>
                  <input value={form.resume_url} onChange={(e) => setField('resume_url', e.target.value)} className="input" placeholder="https://drive.google.com/..." />
                  {errors.resume_url && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.resume_url}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Team Size</label>
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
                  <label className="label">Users</label>
                  <input type="number" min="0" value={form.users_count} onChange={(e) => setField('users_count', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Investment</label>
                  <input type="number" min="0" value={form.investment_raised} onChange={(e) => setField('investment_raised', e.target.value)} className="input" />
                </div>
              </div>

              <div className="rounded-3xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <UploadCloud size={18} style={{ color: 'var(--accent)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Startup package</h3>
                </div>
                <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                  Submit your pitch deck, resume, and key startup metrics here. Application screening questions are handled separately by the admin or manager.
                </p>
              </div>
            </div>
          )}

          {step === steps.length - 1 && (
            <div className="space-y-5">
              <div className="rounded-3xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} style={{ color: 'var(--accent)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Review Your Request</h3>
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
              <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-sm leading-6" style={{ color: '#10b981' }}>
                  Submit bo‘lgach arizangiz `New Leads` ga tushadi. Accept qilinsa residency access beriladi, reject qilinsa sabab sizga ko‘rinadi.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            className={`btn-secondary flex items-center gap-2 ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < steps.length - 1 ? (
            <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? 'Submitting...' : <><Rocket size={16} /> Submit Request</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
