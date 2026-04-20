'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { Plus, Video, Trash2, ChevronLeft, ChevronRight, Clock, MapPin, User, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay } from 'date-fns';

export default function SchedulesPage() {
  const [meetings, setMeetings]           = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [currentMonth, setCurrentMonth]   = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [createModal, setCreateModal]     = useState(false);
  const [newSlot, setNewSlot]             = useState({ title: '', scheduledAt: '', duration: 30 });
  const [creating, setCreating]           = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/meetings');
      setMeetings(res.data.meetings ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteMeeting = async (id: string) => {
    if (!confirm('Delete this meeting?')) return;
    try {
      await axios.delete(`/api/meetings/${id}`);
      toast.success('Deleted');
      setSelectedMeeting(null);
      load();
    } catch { toast.error('Failed'); }
  };

  const createSlot = async () => {
    if (!newSlot.title || !newSlot.scheduledAt) { toast.error('Fill all fields'); return; }
    setCreating(true);
    try {
      await axios.post('/api/meetings', { ...newSlot, scheduledAt: new Date(newSlot.scheduledAt).toISOString() });
      toast.success('Slot created!');
      setCreateModal(false);
      setNewSlot({ title: '', scheduledAt: '', duration: 30 });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const calDays    = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad   = (monthStart.getDay() + 6) % 7;
  const padDays    = Array.from({ length: startPad }, (_, i) => {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - (startPad - i));
    return d;
  });
  const allDays = [...padDays, ...calDays];

  const getMeetingsForDay = (day: Date) =>
    meetings.filter(m => isSameDay(new Date(m.scheduledAt), day));

  const statusColor: Record<string, string> = {
    booked:    '#6366f1',
    available: '#10b981',
    completed: '#64748b',
    cancelled: '#ef4444',
  };

  const upcoming = meetings
    .filter(m => m.status === 'booked' && new Date(m.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const past = meetings
    .filter(m => m.status === 'completed' || (m.status === 'booked' && new Date(m.scheduledAt) < new Date()))
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 10);

  return (
    <div className="animate-fade-in">
      <Header title="Calendar & Schedules" subtitle="Manage all meetings in one place" />
      <div className="p-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Upcoming', value: upcoming.length,                                   color: '#6366f1' },
            { label: 'Available Slots', value: meetings.filter(m => m.status === 'available').length, color: '#10b981' },
            { label: 'Completed', value: meetings.filter(m => m.status === 'completed').length,        color: '#64748b' },
            { label: 'Total', value: meetings.length,                                      color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="card py-4 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1"        style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── CALENDAR ── */}
          <div className="xl:col-span-2 card">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  <ChevronLeft size={15} />
                </button>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#6366f1' }} />Booked</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#10b981' }} />Available</span>
                </div>
                <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
                  <Plus size={13} /> Add Slot
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="text-center text-xs font-semibold py-2"
                  style={{ color: 'var(--text-muted)' }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {allDays.map((day, i) => {
                const inMonth      = isSameMonth(day, currentMonth);
                const today        = isToday(day);
                const dayMeetings  = getMeetingsForDay(day);
                const hasMeetings  = dayMeetings.length > 0;

                return (
                  <div
                    key={i}
                    className="min-h-20 p-1.5 rounded-xl transition-all cursor-default"
                    style={{
                      background:  today ? 'rgba(99,102,241,0.1)' : hasMeetings ? 'rgba(99,102,241,0.04)' : 'transparent',
                      border:      today ? '1.5px solid var(--accent)' : '1px solid transparent',
                      opacity:     inMonth ? 1 : 0.3,
                    }}
                  >
                    {/* Date number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                        style={{
                          background: today ? 'var(--accent)' : 'transparent',
                          color:      today ? 'white' : inMonth ? 'var(--text-secondary)' : 'var(--text-muted)',
                        }}
                      >
                        {format(day, 'd')}
                      </span>
                      {hasMeetings && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)', fontSize: 10 }}>
                          {dayMeetings.length}
                        </span>
                      )}
                    </div>

                    {/* Meeting dots */}
                    <div className="space-y-0.5">
                      {dayMeetings.slice(0, 2).map(m => (
                        <button
                          key={m._id}
                          onClick={() => setSelectedMeeting(m)}
                          className="w-full text-left px-1.5 py-1 rounded-lg text-xs truncate transition-all font-medium"
                          style={{
                            background: `${statusColor[m.status]}22`,
                            color:      statusColor[m.status],
                            fontSize:   11,
                          }}
                          title={`${format(new Date(m.scheduledAt),'HH:mm')} — ${m.title}`}
                        >
                          {format(new Date(m.scheduledAt), 'HH:mm')} {m.title}
                        </button>
                      ))}
                      {dayMeetings.length > 2 && (
                        <button
                          onClick={() => setSelectedMeeting(dayMeetings[2])}
                          className="text-xs px-1.5"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          +{dayMeetings.length - 2} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SIDEBAR panels ── */}
          <div className="space-y-4">
            {/* Upcoming */}
            <div className="card">
              <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                Upcoming ({upcoming.length})
              </h3>
              {upcoming.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No upcoming meetings</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.slice(0, 6).map(m => (
                    <button key={m._id} onClick={() => setSelectedMeeting(m)}
                      className="w-full text-left p-3 rounded-xl transition-all"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{m.title}</span>
                        <span className="text-xs" style={{ color: 'var(--accent)' }}>
                          {format(new Date(m.scheduledAt), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {format(new Date(m.scheduledAt), 'EEE, MMM d')} · {m.userId?.name || '—'}
                      </p>
                      {m.topic && (
                        <p className="text-xs mt-1 italic truncate" style={{ color: 'var(--text-muted)' }}>
                          "{m.topic}"
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Past meetings */}
            <div className="card">
              <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text-primary)' }}>Recent Past</h3>
              {past.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No past meetings</p>
              ) : (
                <div className="space-y-2">
                  {past.slice(0, 4).map(m => (
                    <div key={m._id} className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ background: 'var(--bg-secondary)' }}>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{m.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {format(new Date(m.scheduledAt), 'MMM d · HH:mm')}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(100,116,139,0.15)', color: '#64748b' }}>
                        past
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MEETING DETAIL MODAL ── */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-0 w-full max-w-md animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border)', background: 'rgba(99,102,241,0.06)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`badge badge-${selectedMeeting.status} mb-2`}>{selectedMeeting.status}</span>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selectedMeeting.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--accent)' }}>
                    {format(new Date(selectedMeeting.scheduledAt), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(selectedMeeting.scheduledAt), 'HH:mm')} · {selectedMeeting.duration} min
                  </p>
                </div>
                <button onClick={() => setSelectedMeeting(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Participant */}
              {selectedMeeting.userId && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    {selectedMeeting.userId.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedMeeting.userId.name} {selectedMeeting.userId.surname}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedMeeting.userId.email}</p>
                  </div>
                </div>
              )}

              {selectedMeeting.startupId && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <User size={14} style={{ color: 'var(--accent)' }} />
                  <span>Startup: <strong>{selectedMeeting.startupId.startup_name}</strong></span>
                </div>
              )}

              {/* Topic */}
              {selectedMeeting.topic && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Meeting Topic</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedMeeting.topic}</p>
                </div>
              )}

              {/* Type */}
              <div className="flex items-center gap-2">
                {selectedMeeting.meetingType === 'offline' ? (
                  <>
                    <MapPin size={14} style={{ color: '#f59e0b' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Offline — {selectedMeeting.officeAddress || 'Office'}
                    </span>
                  </>
                ) : (
                  <>
                    <Video size={14} style={{ color: 'var(--accent)' }} />
                    <a href={selectedMeeting.meetLink} target="_blank" rel="noreferrer"
                      className="text-sm truncate" style={{ color: 'var(--accent)' }}>
                      {selectedMeeting.meetLink}
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              {selectedMeeting.meetingType === 'online' && selectedMeeting.status === 'booked' && (
                <a href={selectedMeeting.meetLink} target="_blank" rel="noreferrer" className="flex-1">
                  <button className="btn-primary w-full flex items-center justify-center gap-2">
                    <Video size={14} /> Join Meeting
                  </button>
                </a>
              )}
              <button
                onClick={() => deleteMeeting(selectedMeeting._id)}
                className="btn-danger flex items-center gap-2"
                style={{ flex: selectedMeeting.status === 'booked' ? '0 0 auto' : 1 }}
              >
                <Trash2 size={14} />
                {selectedMeeting.status !== 'booked' && 'Delete'}
              </button>
              <button onClick={() => setSelectedMeeting(null)} className="btn-secondary flex-1">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create slot modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-md animate-fade-in">
            <h3 className="font-semibold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>Add Manual Slot</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input value={newSlot.title} onChange={e => setNewSlot(p => ({ ...p, title: e.target.value }))}
                  className="input" placeholder="e.g. Office Hours" />
              </div>
              <div>
                <label className="label">Date & Time</label>
                <input type="datetime-local" value={newSlot.scheduledAt}
                  onChange={e => setNewSlot(p => ({ ...p, scheduledAt: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Duration</label>
                <select value={newSlot.duration} onChange={e => setNewSlot(p => ({ ...p, duration: Number(e.target.value) }))} className="input">
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={createSlot} disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
