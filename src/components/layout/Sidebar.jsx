import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, FileText, GraduationCap,
  ClipboardList, LogOut, Menu, X, ShieldCheck, Settings
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { AccountSettingsModal } from '../modals/AccountSettingsModal';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        aria-label="Toggle navigation menu"
        className="btn btn-icon btn-ghost fixed top-3 left-4 z-50 lg:hidden shadow-md bg-surface"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          sidebar fixed top-0 left-0 h-full w-64 z-40 flex flex-col transition-transform duration-300 ease-in-out
          border-r border-custom bg-[#0e1424]
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* University Brand Header */}
        <div className="p-5 border-b border-custom bg-[#090d17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 border border-indigo-400/30 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/25">
              🏛️
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-white tracking-wide truncate">APEX UNIVERSITY</h2>
              <p className="text-[11px] text-indigo-400 font-medium tracking-wider uppercase">Exam Controller</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Exam Administration
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-indigo-600/15 text-indigo-300 font-semibold border-l-3 border-indigo-500 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border-l-3 border-transparent'}
                `}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Administrator Profile & Session */}
        <div className="p-4 border-t border-custom bg-[#090d17]">
          <div className="flex items-center gap-3 mb-2 p-2 rounded-lg bg-surface2/60 border border-custom">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user.name?.[0] || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-100 truncate">{user.name || 'Administrator'}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <ShieldCheck size={11} /> Authorized Planner
              </div>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              title="Account & Database Settings"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <Settings size={15} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              className="btn btn-ghost btn-xs text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-1"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={12} /> Security
            </button>
            <button
              className="btn btn-ghost btn-xs text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1"
              onClick={handleLogout}
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Account & Database Credentials Modal */}
      <AccountSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUserUpdated={(updated) => setUser(updated)}
      />
    </>
  );
}
