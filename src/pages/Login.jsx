import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Loader2, ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Auto-redirect authenticated admin to the dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      return toast.error('Please enter your email and password.');
    }

    setLoading(true);
    try {
      const res = await authAPI.login(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(`Welcome back, ${res.data.user.name || 'Administrator'}!`);
      navigate('/admin');
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed. Please verify credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] relative flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-900/30 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md card-glass p-8 sm:p-10 relative z-10 border border-slate-700/60 shadow-2xl">
        {/* University Crest & Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 border border-indigo-400/40 flex items-center justify-center text-3xl shadow-xl shadow-indigo-600/30 mb-4">
            🏛️
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">
            APEX UNIVERSITY
          </h1>
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mt-1">
            Office of the Controller of Examinations
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
            <Lock size={12} className="text-amber-400" /> Authorized Exam Planner Access
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label text-slate-300">Planner Email Address</label>
            <input
              className="input bg-[#0b0f19]/90 border-slate-700 focus:border-indigo-500 text-white"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="e.g. controller@apex.edu"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="form-group relative">
            <label className="label text-slate-300">Security Password</label>
            <div className="relative">
              <input
                className="input bg-[#0b0f19]/90 border-slate-700 focus:border-indigo-500 text-white pr-11"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg w-full mt-2 shadow-lg shadow-indigo-600/30"
            type="submit"
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
            {loading ? 'Authenticating...' : 'Sign In as Exam Planner'}
          </button>
        </form>

        {/* Security & Access Notice */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3.5 rounded-lg bg-indigo-950/40 border border-indigo-800/30 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Single Planner Security Model:</span> Registration is restricted. Access is granted exclusively to the authorized University Exam Controller account.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
