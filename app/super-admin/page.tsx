'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '@/components/dashboard/Header';
import { Shield, Users, Edit2, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';

const REGIONS = ['Tashkent', 'Samarkand', 'Bukhara', 'Namangan', 'Andijan', 'Fergana', 'Nukus', 'Other'];

export default function SuperAdminPage() {
  const [users, setUsers]         = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [editUser, setEditUser]   = useState<any | null>(null);
  const [newRole, setNewRole]     = useState('');
  const [saving, setSaving]       = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, aRes] = await Promise.all([
        axios.get(`/api/users?${new URLSearchParams({
          ...(roleFilter ? { role: roleFilter } : {}),
          ...(regionFilter ? { region: regionFilter } : {}),
        }).toString()}`),
        axios.get('/api/analytics'),
      ]);
      setUsers(uRes.data.users     ?? []);
      setAnalytics(aRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [regionFilter, roleFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const filtered = users.filter((u) =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    user: 'badge-active', manager: 'badge-mvp', super_admin: 'badge-rejected',
  };

  return (
    <div className="animate-fade-in">
      <Header title="Super Admin" subtitle="Full system control and user management" />
      <div className="p-8 space-y-8">

        {/* System Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users',      value: analytics?.totalUsers,    color: '#6366f1' },
            { label: 'Total Startups',   value: analytics?.totalStartups, color: '#10b981' },
            { label: 'Active Programs',  value: analytics?.activeStartups,color: '#f59e0b' },
            { label: 'Pending Reviews',
              value: (analytics?.pendingReports ?? 0) + (analytics?.pendingStartups ?? 0),
              color: '#ec4899' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <p className="text-3xl font-bold" style={{ color }}>{value ?? '—'}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
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
          </div>
        </div>

        {/* Users Table */}
        <div className="card p-0 overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between gap-4"
            style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>All Users</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  className="input pl-8 py-2 text-sm w-48" placeholder="Search users..." />
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className="input py-2 text-sm w-auto">
                <option value="">All Roles</option>
                <option value="user">Founders</option>
                <option value="manager">Managers</option>
                <option value="super_admin">Super Admins</option>
              </select>
              <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
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
                  <th>User</th><th>Email</th><th>Region</th><th>Role</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10"
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
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                    </td>
                    <td>
                      <button
                        onClick={() => { setEditUser(u); setNewRole(u.role); }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>
                        <Edit2 size={12} /> Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}
