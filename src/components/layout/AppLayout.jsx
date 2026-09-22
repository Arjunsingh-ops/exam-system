import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Sparkles, Calendar } from 'lucide-react';

const ROUTE_TITLES = {
  '/admin': 'Executive Dashboard',
  '/admin/students': 'Student Registry & Enrollment',
  '/admin/rooms': 'Examination Halls & Room Grids',
  '/admin/exams': 'Schedules & Examination Courses',
  '/admin/teachers': 'Invigilators & Faculty Duties',
  '/admin/seating': 'Seating Allocation & Plan Generator',
};

export function AppLayout() {
  const location = useLocation();
  const pageTitle = ROUTE_TITLES[location.pathname] || 'Administration';

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f19]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar / Academic Banner */}
        <header className="no-print h-14 border-b border-custom bg-[#0e1424]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 pl-10 lg:pl-0">
            <h1 className="text-sm font-semibold text-slate-200 tracking-wide">
              {pageTitle}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <Sparkles size={10} /> Active Academic Term
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-surface2/70 px-3 py-1.5 rounded-lg border border-custom">
              <Calendar size={13} className="text-indigo-400" />
              <span>{todayStr}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-slate-300 font-medium">System Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scroll">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
