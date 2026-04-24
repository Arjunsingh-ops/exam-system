import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Save, X, Calendar, Clock, BookOpen, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Input, Label } from "../../components/ui/Input";
import { examAPI } from "../../services/api";
import { cn } from "../../utils/cn";

const SHIFTS = [
  { id: "Morning", start: "09:00", end: "12:00" },
  { id: "Afternoon", start: "13:30", end: "16:30" },
  { id: "Evening", start: "17:30", end: "20:30" },
];

export function ExamManager() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    exam_date: "",
    shift: "Morning",
    start_time: "09:00:00",
    end_time: "12:00:00",
    department: "",
    semester: ""
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await examAPI.getAll();
      setExams(res.data.exams || []);
    } catch (err) {
      toast.error("Failed to fetch exams");
    } finally {
      setLoading(false);
    }
  };

  const handleShiftChange = (shiftId) => {
    const shift = SHIFTS.find(s => s.id === shiftId);
    setFormData(prev => ({
      ...prev,
      shift: shiftId,
      start_time: shift ? `${shift.start}:00` : prev.start_time,
      end_time: shift ? `${shift.end}:00` : prev.end_time
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await examAPI.update(editingId, formData);
        toast.success("Exam updated successfully");
      } else {
        await examAPI.create(formData);
        toast.success("Exam created successfully");
      }
      resetForm();
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save exam");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (exam) => {
    setEditingId(exam.id);
    setFormData({
      title: exam.title,
      subject: exam.subject || "",
      exam_date: exam.exam_date ? exam.exam_date.split('T')[0] : "",
      shift: exam.shift,
      start_time: exam.start_time,
      end_time: exam.end_time,
      department: exam.department || "",
      semester: exam.semester || ""
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exam? This will also delete any generated seating plans for it.")) return;
    try {
      await examAPI.delete(id);
      toast.success("Exam deleted successfully");
      fetchExams();
    } catch (err) {
      toast.error("Failed to delete exam");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      subject: "",
      exam_date: "",
      shift: "Morning",
      start_time: "09:00:00",
      end_time: "12:00:00",
      department: "",
      semester: ""
    });
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-start">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
             Exam Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure and organize upcoming university examinations.</p>
        </motion.div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Form Column */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="lg:col-span-4"
        >
          <Card className="glass-card overflow-hidden border-indigo-100 dark:border-slate-800 shadow-xl">
            <div className="h-2 bg-indigo-600 w-full" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingId ? <Edit2 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                {editingId ? "Edit Exam" : "Schedule New Exam"}
              </CardTitle>
              <CardDescription>Enter the examination details and schedule.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title *</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="title"
                      placeholder="Ex: Mid-Semester Spring 2024"
                      className="pl-10"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Advanced Algorithms"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exam_date">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="exam_date"
                        type="date"
                        className="pl-10"
                        required
                        value={formData.exam_date}
                        onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shift">Shift *</Label>
                    <select
                      id="shift"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-slate-800 dark:bg-slate-950"
                      value={formData.shift}
                      onChange={(e) => handleShiftChange(e.target.value)}
                    >
                      {SHIFTS.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="start_time"
                        type="time"
                        step="1"
                        className="pl-10"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="end_time"
                        type="time"
                        step="1"
                        className="pl-10"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="department"
                        placeholder="CS, ME, EE..."
                        className="pl-10"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Input
                      id="semester"
                      type="number"
                      placeholder="1-8"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {editingId ? "Update Exam" : "Schedule Exam"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table Column */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="lg:col-span-8 space-y-4"
        >
          <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Examinations</CardTitle>
                <CardDescription>A list of all currently scheduled exams.</CardDescription>
              </div>
              <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full">
                {exams.length} Total
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-sm">Fetching exam records...</p>
                </div>
              ) : exams.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-3">
                   <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full">
                     <Calendar className="w-8 h-8 text-slate-300" />
                   </div>
                   <div>
                     <p className="font-semibold text-slate-900 dark:text-slate-100">No exams scheduled</p>
                     <p className="text-sm text-slate-500">Create your first exam using the form on the left.</p>
                   </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-950">
                      <TableRow>
                        <TableHead className="w-[200px]">Exam Info</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {exams.map((exam) => (
                          <motion.tr
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={exam.id}
                            className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-slate-100 truncate w-40" title={exam.title}>{exam.title}</span>
                                <span className="text-xs text-slate-500 truncate w-40">{exam.subject || "No subject specified"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-indigo-600" />
                                  {new Date(exam.exam_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span className={cn(
                                  "text-[10px] w-fit px-1.5 py-0.5 rounded font-bold uppercase",
                                  exam.shift === 'Morning' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                  exam.shift === 'Afternoon' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                )}>
                                  {exam.shift} ({exam.start_time.slice(0, 5)})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex items-center gap-2">
                                 <span className="text-sm text-slate-600 dark:text-slate-400">{exam.department || "All Depts"}</span>
                                 {exam.semester && (
                                   <span className="text-[10px] px-1 bg-slate-100 dark:bg-slate-800 rounded">SEM {exam.semester}</span>
                                 )}
                               </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0" 
                                  onClick={() => handleEdit(exam)}
                                >
                                  <Edit2 className="w-4 h-4 text-indigo-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0" 
                                  onClick={() => handleDelete(exam.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
