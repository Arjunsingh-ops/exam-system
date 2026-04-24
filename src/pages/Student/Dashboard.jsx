import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Settings } from "lucide-react";
import { studentAPI, seatingAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [seating, setSeating] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get profile info (using /me endpoint)
        const profileRes = await studentAPI.getMyProfile();
        setProfile(profileRes.data.student);

        // Get seating info (using /me endpoint)
        const seatingRes = await seatingAPI.getMySeating();
        setSeating(seatingRes.data.seating || []);
      } catch (err) {
        if (err.response?.status !== 404) {
          toast.error("Failed to load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  if (loading) return <div className="flex items-center justify-center h-64">Loading your dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome, {profile?.name || "Student"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">View your profile and exam seating details.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Your Seating Arrangement</CardTitle>
            <CardDescription>Details for your upcoming exams</CardDescription>
          </CardHeader>
          <CardContent>
            {seating.length > 0 ? (
              <div className="space-y-6">
                {seating.map((seat) => (
                  <div key={seat.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-indigo-600 dark:text-indigo-400">{seat.exam_title}</h4>
                        <p className="text-xs text-slate-500">{new Date(seat.exam_date).toLocaleDateString()} • {seat.shift}</p>
                      </div>
                      <div className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-bold rounded">Confirmed</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Room No</div>
                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{seat.room_no}</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Seat</div>
                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{seat.seat_no}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-slate-900 dark:text-slate-100 font-semibold mb-1">No Seating Found</h4>
                <p className="text-sm text-slate-500">Your seating will appear here once the admin generates it.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile ? (
              <>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Full Name</label>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{profile.name}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Enrollment No</label>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{profile.enrollment_no}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Roll No</label>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{profile.roll_no}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Department</label>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{profile.department}</div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Section</label>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{profile.section || "N/A"}</div>
                  </div>
                </div>
                <Link to="/student/profile">
                  <Button variant="outline" className="w-full mt-6">Update Profile</Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-12 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                <h4 className="text-amber-800 dark:text-amber-400 font-semibold mb-2">Profile Incomplete</h4>
                <p className="text-sm text-amber-600 dark:text-amber-500 mb-6">Please complete your profile details to see your assigned seating.</p>
                <Link to="/student/profile">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white border-none">Complete Profile</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
