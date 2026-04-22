'use client';

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import { Rocket, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = ['Personal Info', 'Startup Details', 'Team & Metrics', 'Review'];
const SPHERES = ['AI/ML', 'FinTech', 'EdTech', 'HealthTech', 'E-commerce', 'SaaS', 'AgriTech', 'CleanTech', 'HR Tech', 'LegalTech', 'Logistics', 'Media', 'Real Estate', 'Other'];
const REGIONS = ['Tashkent', 'Samarkand', 'Bukhara', 'Namangan', 'Andijan', 'Fergana', 'Nukus', 'Other'];

interface FormState {
  name: string; surname: string; gmail: string; founder_name: string;
  phone: string; telegram: string; startup_name: string; region: string;
  startup_logo: string; description: string; startup_sphere: string;
  stage: string; pitch_deck: string; team_size: string; commitment: string;
  mrr: string; users_count: string; investment_raised: string;
}

const INITIAL: FormState = {
  name: '', surname: '', gmail: '', founder_name: '', phone: '', telegram: '',
  startup_name: '', region: '', startup_logo: '', description: '', startup_sphere: '',
  stage: 'idea', pitch_deck: '', team_size: '1', commitment: 'full-time',
  mrr: '0', users_count: '0', investment_raised: '0',
};

export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const router = useRouter();

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = (s: number): boolean => {
    const errs: Partial<FormState> = {};
    if (s === 0) {
      if (!form.name) errs.name = 'Required';
      if (!form.surname) errs.surname = 'Required';
      if (!form.gmail || !form.gmail.includes('@')) errs.gmail = 'Valid email required';
      if (!form.founder_name) errs.founder_name = 'Required';
      if (!form.phone) errs.phone = 'Required';
      if (!form.telegram) errs.telegram = 'Required';
    }
    if (s === 1) {
      if (!form.startup_name) errs.startup_name = 'Required';
      if (!form.region) errs.region = 'Required';
      if (!form.description || form.description.length < 20) errs.description = 'Min 20 characters';
      if (!form.startup_sphere) errs.startup_sphere = 'Required';
    }
    if (s === 2) {
      if (!form.team_size || Number(form.team_size) < 1) errs.team_size = 'Min 1';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validate(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };

  const onSubmit = async () => {
    setLoading(true);
    try {
      await axios.post('/api/startups', {
        ...form,
        team_size: Number(form.team_size),
        mrr: Number(form.mrr),
        users_count: Number(form.users_count),
        investment_raised: Number(form.investment_raised),
      });
      toast.success('Application submitted! We\'ll review it soon.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const Err = ({ f }: { f: keyof FormState }) =>
    errors[f] ? <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors[f]}</p> : null;

  return (
    <div className="animate-fade-in">
      <Header title="Startup Application" subtitle="Apply to join the residency program" />
      <div className="p-8 max-w-3xl mx-auto">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: i <= step ? 'var(--accent)' : 'var(--bg-card)', border: '1px solid var(--border)', color: i <= step ? 'white' : 'var(--text-muted)' }}>
                  {i + 1}
                </div>
                <span className="text-sm hidden md:block" style={{ color: i === step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px mx-2" style={{ background: i < step ? 'var(--accent)' : 'var(--border)' }} />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">First Name *</label><input value={form.name} onChange={set('name')} className="input" placeholder="Aisha" /><Err f="name" /></div>
                <div><label className="label">Last Name *</label><input value={form.surname} onChange={set('surname')} className="input" placeholder="Karimova" /><Err f="surname" /></div>
              </div>
              <div><label className="label">Gmail Address *</label><input type="email" value={form.gmail} onChange={set('gmail')} className="input" placeholder="you@gmail.com" /><Err f="gmail" /></div>
              <div><label className="label">Your role in this startup *</label><input value={form.founder_name} onChange={set('founder_name')} className="input" placeholder="CEO / Founder / CTO" /><Err f="founder_name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Phone Number *</label><input value={form.phone} onChange={set('phone')} className="input" placeholder="+998 90 123 45 67" /><Err f="phone" /></div>
                <div><label className="label">Telegram Username *</label><input value={form.telegram} onChange={set('telegram')} className="input" placeholder="@username" /><Err f="telegram" /></div>
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Startup Details</h2>
              <div><label className="label">Startup Name *</label><input value={form.startup_name} onChange={set('startup_name')} className="input" placeholder="MagicStore AI" /><Err f="startup_name" /></div>
              <div>
                <label className="label">Region *</label>
                <select value={form.region} onChange={set('region')} className="input">
                  <option value="">Select region...</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <Err f="region" />
              </div>
              <div>
                <label className="label">Startup Description *</label>
                <textarea value={form.description} onChange={set('description')} className="input min-h-28 resize-none"
                  placeholder="Describe your startup, the problem it solves, and your unique approach..." />
                <Err f="description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Industry / Sphere *</label>
                  <select value={form.startup_sphere} onChange={set('startup_sphere')} className="input">
                    <option value="">Select sphere...</option>
                    {SPHERES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Err f="startup_sphere" />
                </div>
                <div>
                  <label className="label">Stage</label>
                  <select value={form.stage} onChange={set('stage')} className="input">
                    <option value="idea">💡 Idea</option>
                    <option value="mvp">🚀 MVP</option>
                    <option value="growth">📈 Growth</option>
                    <option value="scale">⚡ Scale</option>
                  </select>
                </div>
              </div>
              <div><label className="label">Startup Logo URL (optional)</label><input value={form.startup_logo} onChange={set('startup_logo')} className="input" placeholder="https://..." /></div>
              <div><label className="label">Pitch Deck URL (optional)</label><input value={form.pitch_deck} onChange={set('pitch_deck')} className="input" placeholder="https://docs.google.com/..." /></div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Team & Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Team Size *</label><input type="number" min="1" value={form.team_size} onChange={set('team_size')} className="input" /><Err f="team_size" /></div>
                <div>
                  <label className="label">Commitment</label>
                  <select value={form.commitment} onChange={set('commitment')} className="input">
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">MRR ($)</label><input type="number" min="0" value={form.mrr} onChange={set('mrr')} className="input" /></div>
                <div><label className="label">Total Users</label><input type="number" min="0" value={form.users_count} onChange={set('users_count')} className="input" /></div>
                <div><label className="label">Investment Raised ($)</label><input type="number" min="0" value={form.investment_raised} onChange={set('investment_raised')} className="input" /></div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  💡 Be honest with your metrics. We evaluate potential and coachability, not just current numbers.
                </p>
              </div>
            </div>
          )}

          {/* Step 3 - Review */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Review & Submit</h2>
              <div className="space-y-2">
                {[
                  ['Startup', form.startup_name], ['Founder', `${form.name} ${form.surname}`],
                  ['Gmail', form.gmail], ['Region', form.region], ['Sphere', form.startup_sphere],
                  ['Stage', form.stage], ['Team Size', form.team_size], ['Commitment', form.commitment],
                  ['MRR', `$${form.mrr}`], ['Users', form.users_count],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl mt-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-sm" style={{ color: '#10b981' }}>✅ By submitting you agree to participate in the residency program and commit to weekly reporting.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <button type="button" onClick={() => setStep((s) => Math.max(s - 1, 0))}
              className={`btn-secondary flex items-center gap-2 ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}>
              <ChevronLeft size={16} /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={onSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Rocket size={16} /> Submit Application</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
