import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, FileText, Users, ClipboardList, ArrowRight, TrendingUp } from 'lucide-react';
import { studentAPI, roomAPI, examAPI, teacherAPI } from '../services/api';

const QUICK_ACTIONS = [
  { label: 'Upload Students (CSV)', to: '/admin/students', icon: GraduationCap, color: '#6c63ff' },
  { label: 'Add Rooms',             to: '/admin/rooms',    icon: Building2,     color: '#10b981' },
  { label: 'Create Exam',           to: '/admin/exams',    icon: FileText,      color: '#f59e0b' },
  { label: 'Add Teachers',          to: '/admin/teachers', icon: Users,         color: '#3b82f6' },
  { label: 'Generate Seating Plan', to: '/admin/seating',  icon: ClipboardList, color: '#ec4899' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({ students: 0, rooms: 0, exams: 0, teachers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [stu, rm, ex, te] = await Promise.all([
          studentAPI.getAll({ limit: 1 }),
          roomAPI.getAll(),
          examAPI.getAll(),
          teacherAPI.getAll(),
        ]);
        setStats({
          students: stu.data.total || 0,
          rooms:    (rm.data.rooms || []).length,
          exams:    (ex.data.exams || []).length,
          teachers: (te.data.teachers || []).length,
        });
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: 'Total Students', value: stats.students, icon: '🎓', color: 'rgba(108,99,255,0.15)' },
    { label: 'Exam Rooms',     value: stats.rooms,    icon: '🏫', color: 'rgba(16,185,129,0.12)' },
    { label: 'Exams Created',  value: stats.exams,    icon: '📝', color: 'rgba(245,158,11,0.12)' },
    { label: 'Teachers',       value: stats.teachers, icon: '👨‍🏫', color: 'rgba(59,130,246,0.12)' },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Welcome back, {user.name || 'Admin'} 👋</h1>
          <p className="page-subtitle">Here's an overview of your exam seating system</p>
        </div>
        <div style={{
          padding: '8px 16px', borderRadius: 8,
          background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
          fontSize: 12, color: 'var(--accent-light)'
        }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {STAT_CARDS.map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: color }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
            </div>
            <div>
              <div className="stat-num">{loading ? '—' : value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow steps */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          <TrendingUp size={16} style={{ display: 'inline', marginRight: 6 }} />
          Seating Plan Workflow
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Follow these steps to generate a seating plan
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {QUICK_ACTIONS.map(({ label, to, icon: Icon, color }, idx) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="card"
              style={{
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                border: '1px solid var(--border)', position: 'relative', paddingTop: 20
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span style={{
                position: 'absolute', top: -1, left: 16, background: color,
                color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px',
                borderRadius: '0 0 6px 6px', letterSpacing: 0.5
              }}>STEP {idx + 1}</span>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${color}22`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 10
              }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{label}</p>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)', marginTop: 8 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
