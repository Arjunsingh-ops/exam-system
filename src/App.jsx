import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./pages/Auth/Login";
import { StudentDashboard } from "./pages/Student/Dashboard";
import { DashboardHome } from "./pages/Admin/DashboardHome";
import { StudentManager } from "./pages/Admin/StudentManager";
import { ExamManager } from "./pages/Admin/ExamManager";
import { SeatingGenerator } from "./pages/Admin/SeatingGenerator";

import { Register } from "./pages/Auth/Register";
import { StudentProfile } from "./pages/Student/Profile";
import { RoomManager } from "./pages/Admin/RoomManager";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/student" element={<AppLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        <Route path="/admin" element={<AppLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="students" element={<StudentManager />} />
          <Route path="exams" element={<ExamManager />} />
          <Route path="rooms" element={<RoomManager />} />
          <Route path="seating" element={<SeatingGenerator />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
