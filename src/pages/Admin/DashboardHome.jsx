import { motion } from "framer-motion";
import { Users, Building, FileSignature } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";

export function DashboardHome() {
  const stats = [
    { title: "Total Students", value: "1,248", icon: Users, color: "text-blue-500" },
    { title: "Available Rooms", value: "42", icon: Building, color: "text-indigo-500" },
    { title: "Upcoming Exams", value: "8", icon: FileSignature, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">Welcome to the Admin Dashboard.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
