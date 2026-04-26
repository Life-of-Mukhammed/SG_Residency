'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import {
  Check, ChevronDown, ExternalLink, MapPin, MessageCircle,
  Phone, Plus, Save, Search, Send, Trash2, User, X,
} from 'lucide-react';
import { UZ_REGIONS } from '@/lib/regions';

type LeadQuestion = {
  _id: string;
  question: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'url';
  required: boolean;
  order: number;
  isActive: boolean;
};

const EMPTY_QUESTION = {
  question: '',
  placeholder: '',
  type: 'textarea',
  required: true,
  order: 0,
  isActive: true,
};

const STAGE_COLORS: Record<string, string> = {
  idea: '#8b5cf6',
  mvp: '#6366f1',
  growth: '#10b981',
  scale: '#f59e0b',
};

const REGION_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b',
  '#3b82f6','#ef4444','#14b8a6','#f97316','#06b6d4',
  '#84cc16','#a855f7','#e11d48','#0ea5e9',
];

function regionColor(region: string) {
  const idx = UZ_REGIONS.indexOf(region as never);
  return REGION_COLORS[idx >= 0 ? idx % REGION_COLORS.length : 0];
}

export default function NewLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [questions, setQuestions] = useState<LeadQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acceptTarget, setAcceptTarget] = useState<any | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<any | null>(null);

  const [draftQuestion, setDraftQuestion] = useState(EMPTY_QUESTION);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, questionsRes] = await Promise.all([
        axios.get('/api/startups?limit=200'),
        axios.get('/api/residency-questions'),
      ]);
      setLeads(
        (leadsRes.data.startups || []).filter((item: any) =>
          ['pending', 'lead_accepted'].includes(item.status)
        )
      );
      setQuestions(questionsRes.data.questions || []);
    } catch {
      toast.error('Could not load new leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter && lead.status !== statusFilter) return false;
      if (regionFilter && lead.region !== regionFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !lead.startup_name?.toLowerCase().includes(q) &&
          !lead.founder_name?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [leads, statusFilter, regionFilter, searchQuery]);

  const toggleExpanded = (id: string) => {
    setExpandedLeads((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openEditQuestion = (question: LeadQuestion) => {
    setEditingQuestionId(question._id);
    setDraftQuestion({
      question: question.question,
      placeholder: question.placeholder || '',
      type: question.type,
      required: question.required,
      order: question.order,
      isActive: question.isActive,
    });
  };

  const saveQuestion = async () => {
    if (!draftQuestion.question.trim()) {
      toast.error('Question is required');
      return;
    }
    setSavingQuestion(true);
    try {
      if (editingQuestionId) {
        await axios.patch(`/api/residency-questions/${editingQuestionId}`, draftQuestion);
        toast.success('Question updated');
      } else {
        await axios.post('/api/residency-questions', draftQuestion);
        toast.success('Question added');
      }
      setDraftQuestion(EMPTY_QUESTION);
      setEditingQuestionId(null);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not save question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await axios.delete(`/api/residency-questions/${id}`);
      toast.success('Question deleted');
      load();
    } catch {
      toast.error('Could not delete question');
    }
  };

  const approveLead = async () => {
    if (!acceptTarget) return;
    setReviewLoading(true);
    try {
      const nextStatus = acceptTarget.applicationType === 'existing_resident' ? 'active' : 'lead_accepted';
      await axios.patch(`/api/startups/${acceptTarget._id}`, { status: nextStatus });
      toast.success(nextStatus === 'active' ? 'Residency access granted' : 'Lead moved to interview stage');
      setAcceptTarget(null);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not approve lead');
    } finally {
      setReviewLoading(false);
    }
  };

  const promoteToResidency = async () => {
    if (!promoteTarget) return;
    setReviewLoading(true);
    try {
      await axios.patch(`/api/startups/${promoteTarget._id}`, { status: 'active' });
      toast.success('Lead added to residents');
      setPromoteTarget(null);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not add lead to residents');
    } finally {
      setReviewLoading(false);
    }
  };

  const rejectLead = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('Reject reason is required');
      return;
    }
    setReviewLoading(true);
    try {
      await axios.patch(`/api/startups/${rejectTarget._id}`, {
        status: 'rejected',
        rejectionReason: rejectReason.trim(),
      });
      toast.success('Lead rejected');
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not reject lead');
    } finally {
      setReviewLoading(false);
    }
  };

  const pendingCount   = leads.filter((l) => l.status === 'pending').length;
  const interviewCount = leads.filter((l) => l.status === 'lead_accepted').length;
  const usedRegions    = Array.from(new Set(leads.map((l) => l.region).filter(Boolean)));

  return (
    <div className="animate-fade-in">
      <Header title="New Leads" subtitle="Pending applications and leads in the interview stage" />

      <div className="p-6 space-y-6">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Yangi leadlar',
              value: pendingCount,
              sub: 'Birinchi ko\'rib chiqishni kutmoqda',
              color: '#6366f1',
              bg: 'rgba(99,102,241,0.10)',
            },
            {
              label: 'Intervyu bosqichi',
              value: interviewCount,
              sub: 'Intervyu tayinlashga tayyor',
              color: '#10b981',
              bg: 'rgba(16,185,129,0.10)',
            },
            {
              label: 'Savol banki',
              value: questions.length,
              sub: 'Maxsus kirish savollari',
              color: '#f59e0b',
              bg: 'rgba(245,158,11,0.10)',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="card flex items-center gap-4 py-5"
              style={{ borderLeft: `3px solid ${stat.color}` }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-bold"
                style={{ background: stat.bg, color: stat.color }}
              >
                {stat.value}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">

          {/* ── Left: Leads ── */}
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-44">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-9 text-sm"
                    placeholder="Qidirish..."
                  />
                </div>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="input text-sm w-auto"
                >
                  <option value="">Barcha hududlar</option>
                  {UZ_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Status tabs */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: '', label: `Barchasi (${leads.length})` },
                  { key: 'pending', label: `Yangi (${pendingCount})` },
                  { key: 'lead_accepted', label: `Intervyu (${interviewCount})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: statusFilter === tab.key ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: statusFilter === tab.key ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Active region chips */}
              {usedRegions.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {usedRegions.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRegionFilter(regionFilter === r ? '' : r)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: regionFilter === r ? `${regionColor(r)}22` : 'var(--bg-secondary)',
                        color: regionFilter === r ? regionColor(r) : 'var(--text-muted)',
                        border: regionFilter === r ? `1px solid ${regionColor(r)}44` : '1px solid var(--border)',
                      }}
                    >
                      <MapPin size={10} />
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lead list */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-44 rounded-3xl" />
                ))}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="card rounded-3xl p-12 text-center">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--accent)' }}
                >
                  <User size={28} />
                </div>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Lead topilmadi</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                  {searchQuery || regionFilter || statusFilter
                    ? 'Filtrni o\'zgartirib ko\'ring'
                    : 'Yangi ariza kelganda bu yerda ko\'rinadi'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead) => {
                  const isInterview = lead.status === 'lead_accepted';
                  const rColor = regionColor(lead.region || '');
                  const sColor = STAGE_COLORS[lead.stage] || '#6366f1';
                  const expanded = expandedLeads.has(lead._id);

                  return (
                    <div
                      key={lead._id}
                      className="rounded-[28px] overflow-hidden"
                      style={{
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                      }}
                    >
                      {/* Color bar top */}
                      <div
                        className="h-1 w-full"
                        style={{ background: `linear-gradient(90deg, ${isInterview ? '#10b981' : '#6366f1'}, ${isInterview ? '#34d399' : '#8b5cf6'})` }}
                      />

                      <div className="p-5">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${sColor}, ${sColor}99)` }}
                            >
                              {lead.startup_name?.[0]?.toUpperCase() || '?'}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3
                                  className="text-base font-bold notranslate"
                                  translate="no"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {lead.startup_name}
                                </h3>
                                <span
                                  className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                                  style={{
                                    background: isInterview ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
                                    color: isInterview ? '#10b981' : '#6366f1',
                                  }}
                                >
                                  {isInterview ? 'Intervyu bosqichi' : 'Yangi lead'}
                                </span>
                                {lead.applicationType === 'existing_resident' && (
                                  <span className="px-2 py-0.5 rounded-lg text-xs font-medium"
                                    style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                                    Resident so&apos;rovi
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span
                                  className="flex items-center gap-1 text-xs notranslate"
                                  translate="no"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  <User size={11} /> {lead.founder_name}
                                </span>
                                {lead.region && (
                                  <span
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
                                    style={{ background: `${rColor}15`, color: rColor }}
                                  >
                                    <MapPin size={10} /> {lead.region}
                                  </span>
                                )}
                                {lead.stage && (
                                  <span
                                    className="px-2 py-0.5 rounded-lg text-xs capitalize"
                                    style={{ background: `${sColor}15`, color: sColor }}
                                  >
                                    {lead.stage}
                                  </span>
                                )}
                                {lead.startup_sphere && (
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {lead.startup_sphere}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {lead.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => setAcceptTarget(lead)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
                                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                                >
                                  <Check size={13} />
                                  {lead.applicationType === 'existing_resident' ? 'Kirish berish' : 'Intervyuga o\'tkazish'}
                                </button>
                                <button
                                  onClick={() => { setRejectTarget(lead); setRejectReason(''); }}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
                                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                                >
                                  <X size={13} /> Rad etish
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setPromoteTarget(lead)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
                                style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}
                              >
                                <Send size={13} /> Rezidentlikka qo&apos;shish
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Info row */}
                        <div
                          className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-2xl"
                          style={{ background: 'var(--bg-secondary)' }}
                        >
                          {lead.phone && (
                            <div className="flex items-center gap-2">
                              <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                              <span className="text-xs notranslate" translate="no" style={{ color: 'var(--text-primary)' }}>{lead.phone}</span>
                            </div>
                          )}
                          {lead.telegram && (
                            <div className="flex items-center gap-2">
                              <MessageCircle size={12} style={{ color: 'var(--text-muted)' }} />
                              <span className="text-xs notranslate" translate="no" style={{ color: 'var(--accent)' }}>{lead.telegram}</span>
                            </div>
                          )}
                          {lead.pitch_deck && (
                            <a
                              href={lead.pitch_deck}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 hover:underline"
                            >
                              <ExternalLink size={12} style={{ color: 'var(--accent)' }} />
                              <span className="text-xs" style={{ color: 'var(--accent)' }}>Pitch Deck</span>
                            </a>
                          )}
                          {lead.resume_url && (
                            <a
                              href={lead.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 hover:underline"
                            >
                              <ExternalLink size={12} style={{ color: 'var(--accent)' }} />
                              <span className="text-xs" style={{ color: 'var(--accent)' }}>Resume</span>
                            </a>
                          )}
                        </div>

                        {/* Description */}
                        {lead.description && (
                          <p
                            className="text-sm leading-6 mt-3 px-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {lead.description}
                          </p>
                        )}

                        {/* Application answers toggle */}
                        {lead.applicationAnswers?.length > 0 && (
                          <div className="mt-3">
                            <button
                              onClick={() => toggleExpanded(lead._id)}
                              className="flex items-center gap-1.5 text-xs font-medium"
                              style={{ color: 'var(--accent)' }}
                            >
                              <ChevronDown
                                size={14}
                                style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                              />
                              {expanded ? 'Javoblarni yig\'ish' : `${lead.applicationAnswers.length} savol javoblarini ko'rish`}
                            </button>

                            {expanded && (
                              <div
                                className="rounded-2xl p-4 mt-2 space-y-3"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                              >
                                {lead.applicationAnswers.map((item: any, index: number) => (
                                  <div
                                    key={`${lead._id}-${index}`}
                                    className="pb-3 border-b last:border-b-0"
                                    style={{ borderColor: 'var(--border)' }}
                                  >
                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                      {item.question}
                                    </p>
                                    <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                                      {item.answer || '—'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right: Question bank ── */}
          <div className="card sticky top-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Application questions</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Shown only to new applicants
                </p>
              </div>
              <button
                onClick={() => { setEditingQuestionId(null); setDraftQuestion(EMPTY_QUESTION); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'rgba(99,102,241,0.10)', color: 'var(--accent)' }}
              >
                <Plus size={13} /> New
              </button>
            </div>

            {/* Draft form */}
            <div
              className="rounded-2xl p-4 mb-5 space-y-3"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {editingQuestionId ? 'Savolni tahrirlash' : 'Yangi savol qo\'shish'}
              </p>
              <div>
                <label className="label">Savol</label>
                <textarea
                  value={draftQuestion.question}
                  onChange={(e) => setDraftQuestion((prev) => ({ ...prev, question: e.target.value }))}
                  className="input min-h-20 resize-none text-sm"
                />
              </div>
              <div>
                <label className="label">Placeholder</label>
                <input
                  value={draftQuestion.placeholder}
                  onChange={(e) => setDraftQuestion((prev) => ({ ...prev, placeholder: e.target.value }))}
                  className="input text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={draftQuestion.type}
                  onChange={(e) => setDraftQuestion((prev) => ({ ...prev, type: e.target.value as LeadQuestion['type'] }))}
                  className="input text-sm"
                >
                  <option value="textarea">Textarea</option>
                  <option value="text">Text</option>
                  <option value="url">URL</option>
                </select>
                <input
                  type="number"
                  value={draftQuestion.order}
                  onChange={(e) => setDraftQuestion((prev) => ({ ...prev, order: Number(e.target.value) }))}
                  className="input text-sm"
                  placeholder="Tartib"
                />
                <select
                  value={draftQuestion.required ? 'yes' : 'no'}
                  onChange={(e) => setDraftQuestion((prev) => ({ ...prev, required: e.target.value === 'yes' }))}
                  className="input text-sm"
                >
                  <option value="yes">Majburiy</option>
                  <option value="no">Ixtiyoriy</option>
                </select>
              </div>
              <button
                onClick={saveQuestion}
                disabled={savingQuestion}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Save size={13} />
                {savingQuestion ? 'Saqlanmoqda...' : editingQuestionId ? 'Yangilash' : 'Qo\'shish'}
              </button>
            </div>

            {/* Question list */}
            <div className="space-y-2">
              {questions.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  Savol qo&apos;shilmagan
                </p>
              ) : (
                questions.map((question, i) => (
                  <div
                    key={question._id}
                    className="rounded-xl p-3 flex items-start justify-between gap-3"
                    style={{ background: 'var(--bg-secondary)', border: editingQuestionId === question._id ? '1px solid var(--accent)' : '1px solid transparent' }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium leading-5" style={{ color: 'var(--text-primary)' }}>
                          {question.question}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {question.type} · {question.required ? 'majburiy' : 'ixtiyoriy'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditQuestion(question)}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteQuestion(question._id)}
                        className="p-1.5 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Accept modal ── */}
      {acceptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}>
          <div className="card w-full max-w-md p-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
            >
              <Check size={22} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Confirm</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {acceptTarget.applicationType === 'existing_resident'
                ? `Grant full residency access to ${acceptTarget.startup_name}?`
                : `Move ${acceptTarget.startup_name} to the interview stage? Only meetings will be unlocked.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setAcceptTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={approveLead} disabled={reviewLoading} className="btn-primary flex-1">
                {reviewLoading ? 'Saving...' : acceptTarget.applicationType === 'existing_resident' ? 'Grant access' : 'Move to interview'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Promote modal ── */}
      {promoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}>
          <div className="card w-full max-w-md p-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
            >
              <Send size={22} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Add to residency</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Add {promoteTarget.startup_name} to the residents list and unlock the full workspace?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPromoteTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={promoteToResidency} disabled={reviewLoading} className="btn-primary flex-1">
                {reviewLoading ? 'Saving...' : 'Add to residency'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject modal ── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}>
          <div className="card w-full max-w-lg p-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
            >
              <X size={22} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Reject lead</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Enter the rejection reason. The founder will see this message and their dashboard will remain locked.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input min-h-28 resize-none"
              placeholder="Why is this lead being rejected?"
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={rejectLead}
                disabled={reviewLoading || !rejectReason.trim()}
                className="btn-danger flex-1"
              >
                {reviewLoading ? 'Saving...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
