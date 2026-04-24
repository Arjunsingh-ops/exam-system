import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login }        from './pages/Login';
import { Dashboard }    from './pages/Dashboard';
import { Students }     from './pages/Students';
import { Rooms }        from './pages/Rooms';
import { Exams }        from './pages/Exams';
import { Teachers }     from './pages/Teachers';
import { SeatingPlan }  from './pages/SeatingPlan';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"      element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AppLayout />}>
            <Route index          element={<Dashboard />} />
            <Route path="students"  element={<Students />} />
            <Route path="rooms"     element={<Rooms />} />
            <Route path="exams"     element={<Exams />} />
            <Route path="teachers"  element={<Teachers />} />
            <Route path="seating"   element={<SeatingPlan />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
