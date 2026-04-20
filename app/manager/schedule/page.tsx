'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { Plus, X, Copy, RefreshCw, Clock, Calendar } from 'lucide-react';

const DAYS = [
  { key: 'sunday',    label: 'Sunday',    short: 'S' },
  { key: 'monday',    label: 'Monday',    short: 'M' },
  { key: 'tuesday',   label: 'Tuesday',   short: 'T' },
  { key: 'wednesday', label: 'Wednesday', short: 'W' },
  { key: 'thursday',  label: 'Thursday',  short: 'T' },
  { key: 'friday',    label: 'Friday',    short: 'F' },
  { key: 'saturday',  label: 'Saturday',  short: 'S' },
] as const;

type DayKey = typeof DAYS[number]['key'];

const TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIMES.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

interface DaySlot     { start: string; end: string }
interface DaySchedule { enabled: boolean; slots: DaySlot[] }

interface Schedule {
  sunday:    DaySchedule;
  monday:    DaySchedule;
  tuesday:   DaySchedule;
  wednesday: DaySchedule;
  thursday:  DaySchedule;
  friday:    DaySchedule;
  saturday:  DaySchedule;
  timezone:     string;
  slotDuration: number;
}

const DEFAULT: Schedule = {
  sunday:    { enabled: false, slots: [] },
  monday:    { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] },
  tuesday:   { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] },
  thursday:  { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] },
  friday:    { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] },
  saturday:  { enabled: false, slots: [] },
  timezone:     'Asia/Tashkent',
  slotDuration: 30,
};

function getDay(s: Schedule, k: DayKey): DaySchedule { return s[k]; }
function setDay(s: Schedule, k: DayKey, d: DaySchedule): Schedule { return { ...s, [k]: d }; }

export default function ManagerSchedulePage() {
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/schedule');
      const raw = res.data.schedule;
      setSchedule({ ...DEFAULT, ...raw });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleDay = (k: DayKey) => {
    setSchedule(prev => {
      const day = getDay(prev, k);
      return setDay(prev, k, {
        enabled: !day.enabled,
        slots: !day.enabled && day.slots.length === 0
          ? [{ start: '09:00', end: '17:00' }]
          : day.slots,
      });
    });
  };

  const addSlot = (k: DayKey) => {
    setSchedule(prev => {
      const day = getDay(prev, k);
      return setDay(prev, k, { ...day, slots: [...day.slots, { start: '09:00', end: '17:00' }] });
    });
  };

  const removeSlot = (k: DayKey, idx: number) => {
    setSchedule(prev => {
      const day   = getDay(prev, k);
      const slots = day.slots.filter((_, i) => i !== idx);
      return setDay(prev, k, { enabled: slots.length > 0, slots });
    });
  };

  const updateSlot = (k: DayKey, idx: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => {
      const day = getDay(prev, k);
      return setDay(prev, k, {
        ...day,
        slots: day.slots.map((s, i) => i === idx ? { ...s, [field]: value } : s),
      });
    });
  };

  const copyToAll = (k: DayKey) => {
    const src = getDay(schedule, k).slots;
    setSchedule(prev => {
      let next = prev;
      DAYS.forEach(d => {
        if (d.key !== k && getDay(prev, d.key).enabled) {
          next = setDay(next, d.key, { enabled: true, slots: [...src] });
        }
      });
      return next;
    });
    toast.success('Copied to all enabled days');
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put('/api/schedule', schedule);
      toast.success('Schedule saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div>
      <Header title="Schedule" subtitle="Set your weekly availability" />
      <div className="p-8 space-y-4 max-w-2xl mx-auto">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <Header title="Availability Schedule" subtitle="Set when founders can book meetings with you" />
      <div className="p-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Top controls */}
          <div className="card flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)' }}>
                <RefreshCw size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Weekly hours</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Set when you are typically available for meetings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={schedule.timezone}
                onChange={e => setSchedule(p => ({ ...p, timezone: e.target.value }))}
                className="input py-2 text-sm w-auto"
              >
                <option value="Asia/Tashkent">Uzbekistan Time</option>
                <option value="Europe/Moscow">Moscow Time</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">New York</option>
                <option value="Europe/London">London</option>
              </select>
              <select
                value={schedule.slotDuration}
                onChange={e => setSchedule(p => ({ ...p, slotDuration: Number(e.target.value) }))}
                className="input py-2 text-sm w-auto"
              >
                <option value={15}>15 min slots</option>
                <option value={30}>30 min slots</option>
                <option value={45}>45 min slots</option>
                <option value={60}>60 min slots</option>
              </select>
            </div>
          </div>

          {/* Days list */}
          <div className="card p-0 overflow-hidden">
            {DAYS.map((day, dayIdx) => {
              const d = getDay(schedule, day.key);
              return (
                <div
                  key={day.key}
                  className="p-5"
                  style={{ borderBottom: dayIdx < DAYS.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-start gap-4">
                    {/* Day toggle button */}
                    <button
                      onClick={() => toggleDay(day.key)}
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all mt-0.5"
                      style={{
                        background: d.enabled ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--bg-secondary)',
                        color:      d.enabled ? 'white' : 'var(--text-muted)',
                        border:     d.enabled ? 'none' : '1px solid var(--border)',
                      }}
                      title={d.enabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {day.short}
                    </button>

                    <div className="flex-1">
                      {!d.enabled ? (
                        <div className="flex items-center gap-3 h-10">
                          <span className="text-sm w-24" style={{ color: 'var(--text-secondary)' }}>
                            {day.label}
                          </span>
                          <span
                            className="text-sm px-3 py-1 rounded-full"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                          >
                            Unavailable
                          </span>
                          <button
                            onClick={() => toggleDay(day.key)}
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            {day.label}
                          </p>
                          {d.slots.map((slot, idx) => (
                            <div key={idx} className="flex items-center gap-3 flex-wrap">
                              <select
                                value={slot.start}
                                onChange={e => updateSlot(day.key, idx, 'start', e.target.value)}
                                className="input py-2 text-sm font-mono"
                                style={{ width: 110 }}
                              >
                                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>

                              <span style={{ color: 'var(--text-muted)' }}>-</span>

                              <select
                                value={slot.end}
                                onChange={e => updateSlot(day.key, idx, 'end', e.target.value)}
                                className="input py-2 text-sm font-mono"
                                style={{ width: 110 }}
                              >
                                {TIMES.filter(t => t > slot.start).map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>

                              {/* Remove */}
                              <button
                                onClick={() => removeSlot(day.key, idx)}
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                title="Remove this range"
                              >
                                <X size={14} />
                              </button>

                              {/* Add another range */}
                              <button
                                onClick={() => addSlot(day.key)}
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                title="Add another time range"
                              >
                                <Plus size={14} />
                              </button>

                              {/* Copy to all (only on first slot) */}
                              {idx === 0 && (
                                <button
                                  onClick={() => copyToAll(day.key)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                  title="Copy hours to all enabled days"
                                >
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>
                          ))}

                          {d.slots.length === 0 && (
                            <button
                              onClick={() => addSlot(day.key)}
                              className="btn-secondary text-xs flex items-center gap-1"
                            >
                              <Plus size={12} /> Add time range
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent)' }}>
              <Clock size={14} />
              <span>{schedule.timezone}</span>
            </div>
            <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Save Schedule'}
            </button>
          </div>

          {/* Info card */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} style={{ color: 'var(--accent)' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>How it works</p>
            </div>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>• Founders see your available days and time slots in a Calendly-style calendar</li>
              <li>• Each slot is <strong>{schedule.slotDuration} minutes</strong> long</li>
              <li>• Already-booked slots are automatically hidden from founders</li>
              <li>• A Google Meet link is auto-generated when a meeting is confirmed</li>
              <li>• Founders must provide their startup name and meeting topic when booking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
