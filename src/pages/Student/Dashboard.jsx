import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Student Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">View your profile and exam seating details.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Seating Arrangement</CardTitle>
            <CardDescription>Data Structures Exam - Morning Shift</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="text-sm text-slate-500 dark:text-slate-400">Room No</div>
                <div className="text-2xl font-bold">A101</div>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="text-sm text-slate-500 dark:text-slate-400">Seat</div>
                <div className="text-2xl font-bold">R1-C2</div>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 relative overflow-hidden">
                <div className="grid grid-cols-4 gap-2 p-4 w-full h-full">
                  {[...Array(16)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded ${i === 1 ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} 
                    />
                  ))}
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-xs py-2 px-4 rounded-md shadow flex justify-between">
                  <span>Your Seat</span>
                  <div className="w-4 h-4 bg-indigo-500 rounded" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Full Name</label>
                <div className="text-sm">Jane Smith</div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Enrollment No</label>
                <div className="text-sm">123456789</div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Roll No</label>
                <div className="text-sm">CS102</div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Department</label>
                <div className="text-sm">Computer Science</div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">Edit Profile</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
