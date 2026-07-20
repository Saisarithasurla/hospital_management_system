import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Doctors from "./Pages/Doctors";
import Patients from "./Pages/Patients";
import Appointments from "./Pages/Appointments";
import Bills from "./Pages/Bills";
import Payments from "./Pages/Payments";
import Rooms from "./Pages/Rooms";
import Prescriptions from "./Pages/Prescriptions";
import Reports from "./Pages/Reports";
import Profile from "./Pages/Profile";
import ChangePassword from "./Pages/ChangePassword";
import AppointmentCalendar from "./Pages/AppointmentCalendar";
import ProtectedRoute from "./Components/ProtectedRoute";
import PatientHistory from "./Pages/PatientHistory";
import Inventory from "./Pages/Inventory";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["Admin", "Doctor", "Receptionist"]}> <Dashboard /></ProtectedRoute>} />
        <Route path="/doctors" element={<ProtectedRoute allowedRoles={["Admin"]}><Doctors /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute allowedRoles={["Admin", "Doctor", "Receptionist"]}><Patients /></ProtectedRoute>} />
        <Route path="/patients/:id/history" element={<ProtectedRoute allowedRoles={["Admin", "Doctor", "Receptionist"]}><PatientHistory /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute allowedRoles={["Admin", "Doctor", "Receptionist"]}><Appointments /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute allowedRoles={["Admin", "Doctor", "Receptionist"]}><AppointmentCalendar /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute allowedRoles={["Admin", "Doctor", "Receptionist"]}><Inventory /></ProtectedRoute>} />
        <Route path="/bills" element={<ProtectedRoute allowedRoles={["Admin", "Receptionist"]}><Bills /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute allowedRoles={["Admin", "Receptionist"]}><Payments /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute allowedRoles={["Admin", "Receptionist"]}><Rooms /></ProtectedRoute>} />
        <Route path="/prescriptions" element={<ProtectedRoute allowedRoles={["Admin", "Doctor", "Receptionist"]}><Prescriptions /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={["Admin", "Receptionist"]}><Reports /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={["Admin", "Doctor", "Receptionist"]}><Profile /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute allowedRoles={["Admin", "Doctor", "Receptionist"]}><ChangePassword /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;