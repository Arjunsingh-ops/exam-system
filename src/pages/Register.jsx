import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Auto-redirect already authenticated users to dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      return toast.error('Please fill in all required fields.');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match. Please re-check.');
    }

    setLoading(true);
    try {
      const res = await authAPI.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success(`Account created! Welcome, ${res.data.user.name || 'Planner'}!`);
        navigate('/admin');
      } else {
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your details.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] relative flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-900/30 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md card-glass p-8 sm:p-10 relative z-10 border border-slate-700/60 shadow-2xl">
        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 border border-indigo-400/40 flex items-center justify-center text-2xl shadow-xl shadow-indigo-600/30 mb-3">
            🏛️
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">
            Apex Exam Sitting Planner
          </h1>
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mt-1">
            Create Your Planner Account
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
            <Sparkles size={12} className="text-amber-400" /> Start Planning Seating Arrangements
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="form-group">
            <label className="label text-slate-300 text-xs">Full Name</label>
            <input
              className="input bg-[#0b0f19]/90 border-slate-700 focus:border-indigo-500 text-white text-xs py-2.5"
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Dr. Alex Johnson"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="label text-slate-300 text-xs">Official Email Address</label>
            <input
              className="input bg-[#0b0f19]/90 border-slate-700 focus:border-indigo-500 text-white text-xs py-2.5"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="e.g. planner@apex.edu"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group relative">
            <label className="label text-slate-300 text-xs">Password</label>
            <div className="relative">
              <input
                className="input bg-[#0b0f19]/90 border-slate-700 focus:border-indigo-500 text-white pr-11 text-xs py-2.5"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="label text-slate-300 text-xs">Confirm Password</label>
            <input
              className="input bg-[#0b0f19]/90 border-slate-700 focus:border-indigo-500 text-white text-xs py-2.5"
              type={showPwd ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            className="btn btn-primary btn-lg w-full mt-2 shadow-lg shadow-indigo-600/30 text-xs font-semibold"
            type="submit"
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <UserPlus size={16} />}
            {loading ? 'Creating Planner ID...' : 'Create Planner ID & Get Started'}
          </button>
        </form>

        {/* Existing account link */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign In here
          </Link>
        </div>

        {/* Security badge */}
        <div className="mt-4 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/30 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-indigo-400 shrink-0" />
          <span>Encrypted with bcrypt & secured by signed JWT tokens</span>
        </div>
      </div>
    </div>
  );
}
