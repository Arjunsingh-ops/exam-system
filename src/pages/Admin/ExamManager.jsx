import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";

export function ExamManager() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Exams & Rooms</h1>
        <p className="text-slate-500 dark:text-slate-400">Configure exams, rooms, and seating plans.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Exam Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Exam creation form placeholder.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Room Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Room management table placeholder.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
