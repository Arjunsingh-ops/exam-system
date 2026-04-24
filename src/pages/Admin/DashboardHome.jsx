import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Building, FileSignature, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { adminAPI } from "../../services/api";
import { Link } from "react-router-dom";

export function DashboardHome() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRooms: 0,
    upcomingExams: 0,
    totalSeatingGenerated: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getStats();
        setStats(res.data.stats);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: "Registered Students", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "Available Rooms", value: stats.totalRooms, icon: Building, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { title: "Configured Exams", value: stats.upcomingExams, icon: FileSignature, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { title: "Seating Assigned", value: stats.totalSeatingGenerated, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  const workflowSteps = [
    { title: "Register Students", desc: "Ensure all students are in the database.", link: "/admin/students" },
    { title: "Configure Rooms/Exams", desc: "Add exam titles and room capacities.", link: "/admin/exams" },
    { title: "Generate Seating", desc: "Finalize assignments and generate PDFs.", link: "/admin/seating" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome Back, Admin</h1>
        <p className="text-slate-500 dark:text-slate-400">Here's the current status of your exam system.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-slate-600 dark:text-slate-400">
                <CardTitle className="text-[10px] uppercase font-bold tracking-wider">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {loading ? "..." : stat.value}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 glass border-indigo-100 dark:border-indigo-900/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-24 h-24 text-indigo-600" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Start Guide</CardTitle>
            <CardDescription>Follow these steps to generate seating plans for your students.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6 relative">
              {workflowSteps.map((step, i) => (
                <div key={i} className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">{step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                  <Link 
                    to={step.link}
                    className="flex items-center text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 uppercase tracking-tighter"
                  >
                    Go to section <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-sm font-medium">Database Connected</span>
             </div>
             <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
               <div className="w-2 h-2 rounded-full bg-emerald-500" />
               <span className="text-sm font-medium">Role-Based Access Active</span>
             </div>
             <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 opacity-50">
               <div className="w-2 h-2 rounded-full bg-slate-300" />
               <span className="text-sm font-medium">Auto-Report Generation</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Sparkles = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);
