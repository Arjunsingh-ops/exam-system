import { useState, useEffect } from 'react';
import { X, ShieldCheck, KeyRound, User, Database, Check, Loader2, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';

export function AccountSettingsModal({ isOpen, onClose, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      setName(stored.name || 'Exam Controller');
      setEmail(stored.email || 'admin@exam.edu');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      return toast.error('Full Name and Email address are required.');
    }

    setLoading(true);
    try {
      const res = await authAPI.updateProfile({ name: name.trim(), email: email.trim().toLowerCase() });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (onUserUpdated) onUserUpdated(res.data.user);
      }
      toast.success('Database profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update database profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      return toast.error('Please enter both current and new passwords.');
    }
    if (newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match.');
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password updated in database! Use this new password for next login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update database password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="card-glass w-full max-w-xl border border-slate-700/80 shadow-2xl overflow-hidden rounded-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-custom bg-[#090d17]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Administrator Database Account</h3>
              <p className="text-[11px] text-slate-400">Manage credentials stored in the production MySQL database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-custom bg-[#0c101c] px-5 gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={14} /> Profile Credentials
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'password'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound size={14} /> Change Password
          </button>
          <button
            onClick={() => setActiveTab('hosting')}
            className={`py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'hosting'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server size={14} /> Cloud & Hosting
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 bg-[#0e1424]">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="label text-slate-300">Planner / Administrator Name</label>
                <input
                  type="text"
                  className="input bg-[#080c16] border-slate-700 text-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Jane Doe"
                  required
                />
              </div>

              <div>
                <label className="label text-slate-300">Official Login Email (Database Key)</label>
                <input
                  type="email"
                  className="input bg-[#080c16] border-slate-700 text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. controller@apex.edu"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Updating this changes the email required at the login screen.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary text-xs"
                >
                  {loading ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                  {loading ? 'Saving to Database...' : 'Save Database Profile'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label text-slate-300">Current Password</label>
                <input
                  type="password"
                  className="input bg-[#080c16] border-slate-700 text-white"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-slate-300">New Password</label>
                  <input
                    type="password"
                    className="input bg-[#080c16] border-slate-700 text-white"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
                <div>
                  <label className="label text-slate-300">Confirm New Password</label>
                  <input
                    type="password"
                    className="input bg-[#080c16] border-slate-700 text-white"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/30 text-[11px] text-slate-300 flex items-center gap-2">
                <ShieldCheck size={15} className="text-indigo-400 shrink-0" />
                <span>Password will be salted with 10 bcrypt rounds and stored in the MySQL <code>users</code> table.</span>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary text-xs"
                >
                  {loading ? <Loader2 size={14} className="spin" /> : <KeyRound size={14} />}
                  {loading ? 'Updating Password...' : 'Update Password in Database'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'hosting' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-white mb-1.5">
                  <Database size={15} className="text-indigo-400" />
                  Cloud Database Connection
                </div>
                <p className="text-slate-400 leading-relaxed">
                  When deploying to platforms like <strong>Render</strong>, <strong>Railway</strong>, or <strong>Vercel</strong>, connect any cloud MySQL database (Railway, Aiven, Supabase, TiDB) by setting:
                </p>
                <div className="mt-2 p-2 rounded bg-black/60 font-mono text-[11px] text-indigo-300 border border-slate-800 select-all">
                  DATABASE_URL=mysql://user:pass@host:port/dbname?ssl={"{\"rejectUnauthorized\":false}"}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/60">
                <div className="flex items-center gap-2 font-bold text-white mb-1.5">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  CLI Database Seeder Utility
                </div>
                <p className="text-slate-400 leading-relaxed mb-2">
                  You can also provision or reset the database admin user from your terminal or CI/CD pipeline at any time:
                </p>
                <div className="p-2 rounded bg-black/60 font-mono text-[11px] text-emerald-300 border border-slate-800 select-all">
                  node scripts/seedAdmin.js controller@apex.edu YourSecurePassword123
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
