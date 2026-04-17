import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, UsersRound, Settings } from "lucide-react";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Students", href: "/admin/students", icon: UsersRound },
  { name: "Exams", href: "/admin/exams", icon: Settings },
  { name: "Rooms", href: "/admin/rooms", icon: Settings },
  { name: "Seating Plan", href: "/admin/seating", icon: Settings },
];

export function Sidebar({ open }) {
  const location = useLocation();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: open ? 240 : 80 }}
      className="h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden"
    >
      <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold tracking-tighter">EX</span>
        </div>
        <AnimatePresence>
          {open && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap"
            >
              Exam Manager
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg transition-colors group",
                isActive
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
              <AnimatePresence>
                {open && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3 whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <AnimatePresence>
            {open && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ml-3 overflow-hidden whitespace-nowrap"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Admin User</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">admin@exam.edu</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
