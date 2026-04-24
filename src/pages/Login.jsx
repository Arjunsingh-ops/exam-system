import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@exam.edu', password: 'Admin@123' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Welcome back, ' + res.data.user.name + '!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}
      className="flex items-center justify-center p-4">

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="card-glass fade-in" style={{ width: '100%', maxWidth: 420, padding: '40px 36px' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            borderRadius: 12, width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: 'white'
          }}>E</div>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>ExamSeat</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Seating Automation System</p>
          </div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Admin Login</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Sign in to manage exam seating plans</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="admin@exam.edu"
              required
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="label">Password</label>
            <input
              className="input"
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Enter password"
              style={{ paddingRight: 44 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd(p => !p)}
              style={{
                position: 'absolute', right: 12, top: 33, background: 'none',
                border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2
              }}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '14px 16px', background: 'rgba(108,99,255,0.08)', borderRadius: 8, border: '1px solid rgba(108,99,255,0.15)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Default credentials:</p>
          <p style={{ fontSize: 12, color: 'var(--accent-light)' }}>admin@exam.edu / Admin@123</p>
        </div>
      </div>
    </div>
  );
}
