'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { useSession } from 'next-auth/react';
import { Calendar, Video, Clock, ChevronLeft, ChevronRight, Check, Plus, X, Trash2 } from 'lucide-react';
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay, addMonths, subMonths } from 'date-fns';

const DAYS_SHORT = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

export default function MeetingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isManager = ['manager','super_admin'].includes(user?.role);
  const [startup, setStartup]         = useState<any>(null);

  // Shared state
  const [meetings, setMeetings]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  // User booking state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots]               = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [managerId, setManagerId]       = useState<string>('');
  const [bookModal, setBookModal]       = useState<{ date: Date; time: string } | null>(null);
  const [bookForm, setBookForm]         = useState({ startupName: '', topic: '', meetingType: 'online', officeAddress: '' });
  const [booking, setBooking]           = useState(false);
  const [confirmedMeeting, setConfirmedMeeting] = useState<any>(null);

  // Manager create slot state
  const [createModal, setCreateModal]   = useState(false);
  const [newSlot, setNewSlot]           = useState({ title: '', scheduledAt: '', duration: 30 });
  const [creating, setCreating]         = useState(false);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await axios.get('/api/meetings');
      setMeetings(res.data.meetings ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);
  useEffect(() => {
    if (!isManager) {
      axios.get('/api/startups?limit=1').then((res) => setStartup(res.data.startups?.[0] ?? null)).catch(() => {});
    }
  }, [isManager]);

  // When user selects a date, load available slots
  useEffect(() => {
    if (!selectedDate || isManager) return;
    const load = async () => {
      setSlotsLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await axios.get(`/api/slots?date=${dateStr}${managerId ? `&managerId=${managerId}` : ''}`);
        setSlots(res.data.slots ?? []);
        setManagerId(res.data.managerId ?? '');
      } catch { setSlots([]); }
      finally { setSlotsLoading(false); }
    };
    load();
  }, [selectedDate, isManager, managerId]);

  const bookSlot = async () => {
    if (!bookModal || !bookForm.topic.trim()) { toast.error('Please fill in all fields'); return; }
    setBooking(true);
    try {
      const dateStr = format(bookModal.date, 'yyyy-MM-dd');
      const res = await axios.post('/api/meetings', {
        date:        dateStr,
        time:        bookModal.time,
        topic:       bookForm.topic,
        startupName: bookForm.startupName,
        managerId,
        meetingType: bookForm.meetingType,
        officeAddress: bookForm.officeAddress,
      });
      setConfirmedMeeting(res.data.meeting);
      setBookModal(null);
      setBookForm({ startupName: '', topic: '', meetingType: 'online', officeAddress: '' });
      setSlots(prev => prev.filter(s => s !== bookModal.time));
      fetchMeetings();
      toast.success('Meeting booked! 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally { setBooking(false); }
  };

  const deleteMeeting = async (id: string) => {
    try {
      await axios.delete(`/api/meetings/${id}`);
      toast.success('Deleted');
      fetchMeetings();
    } catch { toast.error('Failed to delete'); }
  };

  const createSlot = async () => {
    if (!newSlot.title || !newSlot.scheduledAt) { toast.error('Fill all fields'); return; }
    setCreating(true);
    try {
      await axios.post('/api/meetings', { ...newSlot, scheduledAt: new Date(newSlot.scheduledAt).toISOString() });
      toast.success('Slot created!');
      setCreateModal(false);
      setNewSlot({ title: '', scheduledAt: '', duration: 30 });
      fetchMeetings();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const calDays    = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Pad to start on Monday
  const startPad   = (monthStart.getDay() + 6) % 7;
  const padDays    = Array.from({ length: startPad }, (_, i) => subDays(monthStart, startPad - i));
  const allCalDays = [...padDays, ...calDays];

  const myMeetings   = meetings.filter(m => m.status === 'booked' && (m.userId?._id === user?.id || m.userId === user?.id));
  const upcomingMy   = myMeetings.filter(m => new Date(m.scheduledAt) > new Date()).sort((a,b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // ─── USER VIEW ────────────────────────────────────────────────────────────
  if (!isManager) {
    if (startup && startup.status !== 'active') {
      return (
        <div className="animate-fade-in">
          <Header title="Book a Meeting" subtitle="Approval required" />
          <div className="p-6">
            <div className="card max-w-2xl mx-auto text-center py-14">
              <Calendar size={32} className="mx-auto mb-4" style={{ color: '#f59e0b' }} />
              <p className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Meetings are locked</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Your startup must be approved before you can book meetings with the manager.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-fade-in">
        <Header title="Book a Meeting" subtitle="Schedule time with your program manager" />
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">

            {/* Left — info */}
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} style={{ color: 'var(--accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>30 min</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Video size={16} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Google Meet link provided upon confirmation</span>
                </div>
                <div className="h-px w-full mb-4" style={{ background: 'var(--border)' }} />
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Program Manager Session</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Book a 30-minute session to discuss your startup progress, get feedback, or plan your next sprint.
                </p>
              </div>

              {/* My booked meetings */}
              {upcomingMy.length > 0 && (
                <div className="card">
                  <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                    Your Upcoming Meetings
                  </p>
                  <div className="space-y-3">
                    {upcomingMy.map(m => (
                      <div key={m._id} className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {format(new Date(m.scheduledAt), 'EEE, MMM d · HH:mm')}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.topic}</p>
                        <a href={m.meetLink} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs"
                          style={{ color: 'var(--accent)' }}>
                          <Video size={11} /> Join Google Meet
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Middle — calendar */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {format(currentMonth, 'MMMM yyyy')}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_SHORT.map(d => (
                  <div key={d} className="text-center text-xs font-semibold py-1"
                    style={{ color: 'var(--text-muted)' }}>{d}</div>
                ))}
              </div>

              {/* Date cells */}
              <div className="grid grid-cols-7 gap-y-1">
                {allCalDays.map((day, i) => {
                  const inMonth   = isSameMonth(day, currentMonth);
                  const past      = isBefore(day, startOfDay(new Date()));
                  const selected  = selectedDate && format(day,'yyyy-MM-dd') === format(selectedDate,'yyyy-MM-dd');
                  const today     = isToday(day);
                  const hasMyMtg  = myMeetings.some(m => format(new Date(m.scheduledAt),'yyyy-MM-dd') === format(day,'yyyy-MM-dd'));

                  return (
                    <button
                      key={i}
                      onClick={() => { if (!past && inMonth) setSelectedDate(day); }}
                      disabled={past || !inMonth}
                      className="h-9 w-full rounded-full text-sm font-medium transition-all flex items-center justify-center relative"
                      style={{
                        background: selected ? 'var(--accent)' : today ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: selected ? 'white' : !inMonth || past ? 'var(--text-muted)' : 'var(--text-primary)',
                        opacity: !inMonth ? 0.3 : 1,
                        cursor: past || !inMonth ? 'not-allowed' : 'pointer',
                        fontWeight: today || selected ? '700' : '400',
                      }}
                    >
                      {format(day, 'd')}
                      {hasMyMtg && !selected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                          style={{ background: 'var(--accent)' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t text-xs text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                Uzbekistan Time (UTC+5)
              </div>
            </div>

            {/* Right — time slots */}
            <div className="card">
              {!selectedDate ? (
                <div className="flex flex-col items-center justify-center h-full min-h-64 text-center">
                  <Calendar size={36} className="mb-3 opacity-20" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Select a date to see available times
                  </p>
                </div>
              ) : (
                <>
                  <p className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </p>
                  {slotsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock size={28} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No available slots this day</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {slots.map(time => (
                        <button
                          key={time}
                          onClick={() => setBookModal({ date: selectedDate, time })}
                          className="w-full py-3 rounded-xl text-sm font-bold transition-all border-2"
                          style={{
                            borderColor: 'var(--accent)',
                            color: 'var(--accent)',
                            background: 'transparent',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
                            (e.currentTarget as HTMLElement).style.color = 'white';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                          }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Book Confirmation Modal ── */}
        {bookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <div className="card p-8 w-full max-w-md animate-fade-in">
              <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                Confirm Your Meeting
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                {format(bookModal.date, 'EEEE, MMMM d, yyyy')} · {bookModal.time} · 30 min
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="label">Startup Name</label>
                  <input
                    value={bookForm.startupName}
                    onChange={e => setBookForm(p => ({ ...p, startupName: e.target.value }))}
                    className="input"
                    placeholder="Your startup name"
                  />
                </div>
                <div>
                  <label className="label">Meeting Topic *</label>
                  <textarea
                    value={bookForm.topic}
                    onChange={e => setBookForm(p => ({ ...p, topic: e.target.value }))}
                    className="input min-h-24 resize-none"
                    placeholder="What do you want to discuss? (e.g. MRR growth strategy, investor pitch review, technical problem)"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setBookModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={bookSlot} disabled={booking}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {booking
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Check size={15} /> Confirm Booking</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Success Modal ── */}
        {confirmedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <div className="card p-8 w-full max-w-md animate-fade-in text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <Check size={28} style={{ color: '#10b981' }} />
              </div>
              <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                Meeting Confirmed!
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                {format(new Date(confirmedMeeting.scheduledAt), 'EEEE, MMMM d · HH:mm')} · 30 min
              </p>
              <div className="p-4 rounded-xl mb-6 text-left" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Google Meet Link</p>
                <a href={confirmedMeeting.meetLink} target="_blank" rel="noreferrer"
                  className="text-sm break-all" style={{ color: 'var(--accent)' }}>
                  {confirmedMeeting.meetLink}
                </a>
              </div>
              <button onClick={() => setConfirmedMeeting(null)} className="btn-primary w-full">Done</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── MANAGER VIEW ─────────────────────────────────────────────────────────
  const booked    = meetings.filter(m => m.status === 'booked');
  const available = meetings.filter(m => m.status === 'available');
  const upcoming  = booked.filter(m => new Date(m.scheduledAt) > new Date())
    .sort((a,b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <div className="animate-fade-in">
      <Header title="Meetings" subtitle="Your schedule and booked meetings" />
      <div className="p-8 space-y-6">

        {/* Stats + actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-4">
            {[
              { label: 'Upcoming Booked', value: upcoming.length,  color: '#6366f1' },
              { label: 'Available Slots',  value: available.length, color: '#10b981' },
              { label: 'Total Meetings',   value: booked.length,    color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <a href="/manager/schedule">
              <button className="btn-secondary flex items-center gap-2 text-sm">
                <Clock size={14} /> Manage Schedule
              </button>
            </a>
            <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} /> Add Manual Slot
            </button>
          </div>
        </div>

        {/* Meetings table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>All Meetings</p>
          </div>
          <div className="table-container rounded-none border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Startup / Title</th>
                  <th>Date & Time</th>
                  <th>Topic</th>
                  <th>Status</th>
                  <th>Meet Link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-full" /></td>
                    ))}</tr>
                  ))
                ) : meetings.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                    No meetings yet. Founders will book from their dashboard.
                  </td></tr>
                ) : (
                  meetings.map(m => (
                    <tr key={m._id}>
                      <td>
                        <div>
                          <p className="font-medium text-sm">{m.title || m.startupId?.startup_name || '—'}</p>
                          {m.userId && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.userId.name} {m.userId.surname}</p>}
                        </div>
                      </td>
                      <td>
                        <p className="text-sm">{format(new Date(m.scheduledAt), 'MMM d, yyyy')}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(m.scheduledAt), 'HH:mm')} · {m.duration}min</p>
                      </td>
                      <td className="text-sm max-w-xs">
                        <p className="truncate" style={{ maxWidth: 200 }}>{m.topic || '—'}</p>
                      </td>
                      <td><span className={`badge badge-${m.status}`}>{m.status}</span></td>
                      <td>
                        <a href={m.meetLink} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
                          <Video size={12} /> Join
                        </a>
                      </td>
                      <td>
                        <button onClick={() => deleteMeeting(m._id)}
                          className="p-1.5 rounded-lg" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create manual slot modal */}
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
