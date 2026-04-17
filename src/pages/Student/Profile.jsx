import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";
import { studentAPI } from "../../services/api";
import toast from "react-hot-toast";

export function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    roll_no: "",
    enrollment_no: "",
    department: "",
    exam_type: "",
    program: "",
    semester: 1,
    year: 1,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await studentAPI.getMyProfile();
      if (res.data.student) {
        setFormData({
          name: res.data.student.name || "",
          roll_no: res.data.student.roll_no || "",
          enrollment_no: res.data.student.enrollment_no || "",
          department: res.data.student.department || "",
          exam_type: res.data.student.exam_type || "",
          program: res.data.student.program || "",
          semester: res.data.student.semester || 1,
          year: res.data.student.year || 1,
        });
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error("Failed to load profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await studentAPI.upsertMyProfile(formData);
      toast.success("Profile saved successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile.");
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your student details for exam seating.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Make sure your details exactly match your university enrollment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" required value={formData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll_no">Roll Number *</Label>
                <Input id="roll_no" required value={formData.roll_no} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enrollment_no">Enrollment No *</Label>
                <Input id="enrollment_no" required value={formData.enrollment_no} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input id="department" required placeholder="Ex: Computer Science" value={formData.department} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam_type">Exam Type</Label>
                <Input id="exam_type" placeholder="Ex: Regular, Backlog" value={formData.exam_type} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Input id="program" placeholder="Ex: B.Tech" value={formData.program} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input id="semester" type="number" min="1" max="10" required value={formData.semester} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" min="1" max="5" required value={formData.year} onChange={handleChange} />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button type="submit">Save Profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
