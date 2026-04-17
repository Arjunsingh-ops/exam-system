import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { studentAPI } from "../../services/api";
import toast from "react-hot-toast";

export function StudentManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAll();
      setStudents(res.data.students || []);
    } catch (err) {
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Student Manager</h1>
        <p className="text-slate-500 dark:text-slate-400">View registered student profiles.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Students Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : students.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No students registered yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Enrollment No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Exam Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.roll_no}</TableCell>
                    <TableCell>{student.enrollment_no}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.department}</TableCell>
                    <TableCell>{student.exam_type || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
