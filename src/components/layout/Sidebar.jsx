import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, FileText, GraduationCap,
  ClipboardList, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/admin',          label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students',     icon: GraduationCap },
  { to: '/admin/rooms',    label: 'Rooms',        icon: Building2 },
  { to: '/admin/exams',    label: 'Exams',        icon: FileText },
  { to: '/admin/teachers', label: 'Teachers',     icon: Users },
  { to: '/admin/seating',  label: 'Seating Plan', icon: ClipboardList },
];

export function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="btn btn-icon btn-ghost fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
        className={`
          fixed top-0 left-0 h-full w-64 z-40 flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div style={{ borderBottom: '1px solid var(--border)' }} className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', borderRadius: 10 }}
              className="w-9 h-9 flex items-center justify-center text-white text-lg font-bold"
            >
              E
            </div>
            <div>
              <p className="font-700 text-sm" style={{ color: 'var(--text)', fontWeight: 700 }}>ExamSeat</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
                background: isActive ? 'rgba(108, 99, 255, 0.12)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: '1px solid var(--border)' }} className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent-light)', borderRadius: 8 }}
              className="w-9 h-9 flex items-center justify-center font-bold text-sm"
            >
              {user.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-600 truncate" style={{ fontWeight: 600, color: 'var(--text)' }}>{user.name || 'Admin'}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email || ''}</p>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm w-full"
            onClick={handleLogout}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
