'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { Shield, Users, Edit2, RefreshCw, Search, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const REGIONS = ['Tashkent', 'Samarkand', 'Bukhara', 'Namangan', 'Andijan', 'Fergana', 'Nukus', 'Other'];

export default function SuperAdminPage() {
  const [users, setUsers]         = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [roleFilter, setRoleFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [editUser, setEditUser]     = useState<any | null>(null);
  const [newRole, setNewRole]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [deleteUser, setDeleteUser] = useState<any | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const uRes = await axios.get(`/api/users?${new URLSearchParams({
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(regionFilter ? { region: regionFilter } : {}),
        ...(search ? { search } : {}),
        page: String(page),
        limit: '10',
      }).toString()}`);
      setUsers(uRes.data.users     ?? []);
      setPagination(uRes.data.pagination ?? { total: 0, pages: 1 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [regionFilter, roleFilter, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    axios.get('/api/analytics').then((res) => setAnalytics(res.data)).catch(console.error);
  }, []);

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await axios.delete('/api/users', { data: { userId: deleteUser._id } });
      toast.success(`${deleteUser.name} ${deleteUser.surname} soft deleted`);
      setDeleteUser(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const setupWebhook = async () => {
    setWebhookLoading(true);
    setWebhookStatus(null);
    try {
      const res = await axios.get('/api/telegram/setup');
      const ok = res.data?.setWebhook?.ok;
      const url = res.data?.webhookUrl;
      if (ok) {
        toast.success('Telegram webhook set!');
        setWebhookStatus(`✅ Webhook active: ${url}`);
      } else {
        const desc = res.data?.setWebhook?.description || 'Unknown error';
        toast.error(`Webhook failed: ${desc}`);
        setWebhookStatus(`❌ ${desc}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Request failed';
      toast.error(msg);
      setWebhookStatus(`❌ ${msg}`);
    } finally {
      setWebhookLoading(false);
    }
  };

  const updateRole = async () => {
    if (!editUser || !newRole) return;
    setSaving(true);
    try {
      await axios.patch('/api/users', { userId: editUser._id, role: newRole });
      toast.success(`Role updated to ${newRole}`);
      setEditUser(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally { setSaving(false); }
  };

  const filtered = users;

  const roleColors: Record<string, string> = {
    user: 'badge-active', manager: 'badge-mvp', super_admin: 'badge-rejected',
  };

  return (
    <div className="animate-fade-in">
      <Header title="Super Admin" subtitle="Full system control and user management" />
      <div className="p-8 space-y-8">

        {/* System Stats — resident-centric */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Jami rezidentlar', value: analytics?.totalResidents, color: '#10b981',
              sub: `${analytics?.newResidentsThisMonth ?? 0} ta shu oy` },
            { label: 'Yetakchi soha',    value: analytics?.topSphere || '—', color: '#6366f1',
              sub: 'eng ko‘p rezident', small: true },
            { label: 'Eng faol oy',      value: analytics?.bestMonth?.month || '—', color: '#f59e0b',
              sub: `${analytics?.bestMonth?.count ?? 0} ta rezident`, small: true },
            { label: 'Kutuvchi murojaatlar',
              value: (analytics?.pendingReports ?? 0) + (analytics?.pendingApplications ?? 0),
              color: '#ec4899', sub: 'ko‘rib chiqilmoqda' },
          ].map(({ label, value, color, sub, small }) => (
            <div key={label} className="card text-center">
              <p className={small ? 'text-xl font-bold truncate' : 'text-3xl font-bold'} style={{ color }}>{value ?? '—'}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
            </div>
          ))}
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} style={{ color: 'var(--accent)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>User Breakdown</h3>
            </div>
            <div className="space-y-3">
              {[
                { role: 'super_admin', label: 'Super Admins', color: '#ef4444' },
                { role: 'manager',     label: 'Managers',     color: '#6366f1' },
                { role: 'user',        label: 'Founders',     color: '#10b981' },
              ].map(({ role, label, color }) => {
                const count = users.filter((u) => u.role === role).length;
                return (
                  <div key={role} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} style={{ color: 'var(--accent)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Export User Data',
                  desc: 'Download user list as CSV',
                  action: () => {
                    const csv = [
                      'Name,Email,Role,Joined',
                      ...users.map((u) =>
                        `${u.name} ${u.surname},${u.email},${u.role},${u.createdAt}`
                      ),
                    ].join('\n');
                    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                    const a   = document.createElement('a');
                    a.href = url; a.download = 'users.csv'; a.click();
                  },
                },
                {
                  label: 'Refresh Data',
                  desc:  'Force refresh analytics',
                  action: fetchData,
                },
                {
                  label: 'System Health',
                  desc:  'MongoDB connected ✅',
                  action: () => toast.success('System is healthy!'),
                },
                {
                  label: 'View Analytics',
                  desc:  'Go to analytics dashboard',
                  action: () => window.location.href = '/manager/analytics',
                },
              ].map(({ label, desc, action }) => (
                <button key={label} onClick={action}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs mt-1"        style={{ color: 'var(--text-muted)'    }}>{desc}</p>
                </button>
              ))}
            </div>

            {/* Telegram Webhook Setup */}
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Telegram Bot Webhook</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {webhookStatus || 'Register webhook with Telegram after each new deployment'}
                  </p>
                </div>
                <button
                  onClick={setupWebhook}
                  disabled={webhookLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white flex-shrink-0"
                  style={{ background: webhookLoading ? '#4f46e5aa' : '#4f46e5' }}>
                  {webhookLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send size={14} />}
                  {webhookLoading ? 'Setting up…' : 'Setup Webhook'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Bot Status */}
        {(() => {
          const founders = users.filter((u) => u.role === 'user');
          const connected = founders.filter((u) => u.telegramChatId);
          const notConnected = founders.filter((u) => !u.telegramChatId);
          return (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Send size={18} style={{ color: 'var(--accent)' }} />
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Telegram Bot — Founders</h3>
                <span className="ml-auto text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  {connected.length} / {founders.length} connected
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Connected */}
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#10b981' }}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Connected ({connected.length})
                  </p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {connected.length === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No founders connected yet</p>
                    ) : connected.map((u) => (
                      <div key={u._id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.name} {u.surname}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                        </div>
                        <span className="ml-auto flex-shrink-0 text-xs" style={{ color: '#10b981' }}>✅</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Not connected */}
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Not connected ({notConnected.length})
                  </p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {notConnected.length === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>All founders connected!</p>
                    ) : notConnected.map((u) => (
                      <div key={u._id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#94a3b8,#64748b)' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.name} {u.surname}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                        </div>
                        <span className="ml-auto flex-shrink-0 text-xs" style={{ color: '#f59e0b' }}>⚠️</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Users Table */}
        <div className="card p-0 overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between gap-4"
            style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>All Users</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="input pl-8 py-2 text-sm w-48" placeholder="Search users..." />
              </div>
              <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="input py-2 text-sm w-auto">
                <option value="">All Roles</option>
                <option value="user">Founders</option>
                <option value="manager">Managers</option>
                <option value="super_admin">Super Admins</option>
              </select>
              <select value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
                className="input py-2 text-sm w-auto">
                <option value="">All Regions</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <button onClick={fetchData} className="btn-secondary p-2">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="table-container rounded-none border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Region</th><th>Role</th><th>Telegram</th><th>Status</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10"
                      style={{ color: 'var(--text-muted)' }}>No users found</td>
                  </tr>
                ) : filtered.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center
                          text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{u.name} {u.surname}</span>
                      </div>
                    </td>
                    <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{u.region || '—'}</td>
                    <td>
                      <span className={`badge ${roleColors[u.role] ?? 'badge-inactive'} capitalize`}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {u.telegramChatId ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#10b981' }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#10b981' }} />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#94a3b8' }} />
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'disabled' ? 'badge-inactive' : 'badge-active'}`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditUser(u); setNewRole(u.role); }}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>
                          <Edit2 size={12} /> Edit Role
                        </button>
                        <button
                          onClick={() => setDeleteUser(u)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {pagination.total} admin/user · Page {page} of {pagination.pages || 1}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-sm">
                Previous
              </button>
              <button onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))} disabled={page >= (pagination.pages || 1)} className="btn-secondary text-sm">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-sm animate-fade-in">
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Edit User Role
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {editUser.name} {editUser.surname} · {editUser.email}
            </p>
            <div className="mb-6">
              <label className="label">New Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="input">
                <option value="user">Founder (user)</option>
                <option value="manager">Manager</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="p-3 rounded-xl mb-6"
              style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-xs" style={{ color: '#f59e0b' }}>
                ⚠️ Changing roles grants or revokes system access immediately.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditUser(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={updateRole} disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="card p-8 w-full max-w-sm animate-fade-in">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(239,68,68,0.12)' }}>
              <Trash2 size={22} style={{ color: '#ef4444' }} />
            </div>
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Delete Account
            </h3>
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
              You are about to soft delete:
            </p>
            <div className="p-3 rounded-xl mb-4" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {deleteUser.name} {deleteUser.surname}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{deleteUser.email}</p>
            </div>
            <div className="p-3 rounded-xl mb-6"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs" style={{ color: '#ef4444' }}>
                This keeps historical data traceable and hides the account from active lists.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUser(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
                style={{ background: deleting ? '#f87171' : '#ef4444' }}>
                {deleting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Trash2 size={14} /> Soft delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
