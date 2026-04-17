import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useDarkMode } from "../../hooks/useDarkMode";
import { Button } from "../ui/Button";

export function TopNav({ toggleSidebar }) {
  const { isDark, toggleDark } = useDarkMode();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-10 shrink-0 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <Menu className="w-5 h-5" />
        </Button>
        <span className="font-semibold text-lg text-slate-900 dark:text-slate-100 sm:hidden">
          Exam Manager
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleDark}>
          {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-500">
          <Bell className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
