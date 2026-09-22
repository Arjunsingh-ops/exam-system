import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Building2, FileText, Users, ClipboardList,
  ArrowRight, Sparkles, Calendar, Clock, CheckCircle2
} from 'lucide-react';
import { studentAPI, roomAPI, examAPI, teacherAPI } from '../services/api';

const QUICK_ACTIONS = [
  { label: 'Import Students (CSV)', to: '/admin/students', icon: GraduationCap, color: '#6366f1', step: 'STEP 1' },
  { label: 'Configure Exam Rooms', to: '/admin/rooms', icon: Building2, color: '#10b981', step: 'STEP 2' },
  { label: 'Create Examination', to: '/admin/exams', icon: FileText, color: '#f59e0b', step: 'STEP 3' },
  { label: 'Assign Invigilators', to: '/admin/teachers', icon: Users, color: '#3b82f6', step: 'STEP 4' },
  { label: 'Generate Seating Plan', to: '/admin/seating', icon: ClipboardList, color: '#ec4899', step: 'STEP 5' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({ students: 0, rooms: 0, exams: 0, teachers: 0, totalCapacity: 0 });
  const [recentExams, setRecentExams] = useState([]);
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

        const roomsData = rm.data?.rooms || [];
        const examsData = ex.data?.exams || [];
        const teachersData = te.data?.teachers || [];
        const capacity = roomsData.reduce((sum, r) => sum + (parseInt(r.capacity, 10) || 0), 0);

        setStats({
          students: stu.data?.total || 0,
          rooms: roomsData.length,
          exams: examsData.length,
          teachers: teachersData.length,
          totalCapacity: capacity,
        });
        setRecentExams(examsData.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: 'Registered Students', value: stats.students, icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { label: 'Exam Rooms & Halls', value: stats.rooms, icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', sub: `${stats.totalCapacity} Total Seats` },
    { label: 'Scheduled Exams', value: stats.exams, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Faculty Invigilators', value: stats.teachers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  ];

  return (
    <div className="fade-in space-y-8">
      {/* Welcome Banner */}
      <div className="card-glass p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-500/20 bg-gradient-to-r from-surface via-surface to-indigo-950/30">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
            <Sparkles size={13} /> Examination Controller Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome, {user.name || 'Exam Controller'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Manage university examination halls, configure anti-conflict seating arrangements, and produce official examination seat rosters.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/seating')}
          className="btn btn-primary btn-lg shrink-0 flex items-center gap-2 shadow-xl shadow-indigo-600/30"
        >
          <ClipboardList size={18} />
          <span>Launch Seating Planner</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className={`stat-icon ${stat.bg} ${stat.color} border ${stat.border}`}>
                <Icon size={24} />
              </div>
              <div className="min-w-0">
                <div className="stat-num text-white">
                  {loading ? '—' : stat.value}
                </div>
                <div className="stat-label truncate">{stat.label}</div>
                {stat.sub && (
                  <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">{stat.sub}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step-by-Step Workflow Guide */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-indigo-400" />
              Standard Examination Seating Workflow
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute each prerequisite step to ensure accurate hall and seat allocation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {QUICK_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.to}
                onClick={() => navigate(item.to)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(item.to); }}
                className="card !p-4 cursor-pointer relative group hover:-translate-y-1 hover:border-indigo-500/50 transition-all bg-surface/90 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      <Icon size={19} />
                    </div>
                    <span
                      className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white line-clamp-2 leading-snug">
                    {item.label}
                  </h3>
                </div>

                <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium mt-4 group-hover:translate-x-1 transition-transform">
                  <span>Open Tool</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming / Recent Exams Table */}
      <div className="card !p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar size={18} className="text-amber-400" />
              Scheduled Examinations
            </h3>
            <p className="text-xs text-slate-400">Recent examination sessions scheduled for hall planning</p>
          </div>
          <button
            onClick={() => navigate('/admin/exams')}
            className="btn btn-ghost btn-sm text-xs text-slate-300"
          >
            View All Exams
          </button>
        </div>

        {recentExams.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-custom rounded-lg">
            No examinations scheduled yet. Click &quot;View All Exams&quot; to create your first exam.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Course & Code</th>
                  <th>Programs</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentExams.map((exam) => (
                  <tr key={exam.id}>
                    <td>
                      <div className="font-semibold text-slate-100">{exam.title}</div>
                      <div className="text-[11px] text-slate-400">Sem {exam.semester}</div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-200">{exam.course_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{exam.course_code || '—'}</div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{exam.programs}</span>
                    </td>
                    <td>
                      <div className="text-xs text-slate-200">
                        {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {exam.start_time} - {exam.end_time}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${exam.exam_type === 'End Sem' ? 'badge-green' : exam.exam_type === 'Mid Sem' ? 'badge-blue' : 'badge-yellow'}`}>
                        {exam.exam_type}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => navigate('/admin/seating')}
                        className="btn btn-primary btn-sm text-xs"
                      >
                        Plan Seating
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
