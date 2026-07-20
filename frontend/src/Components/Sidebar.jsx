import { NavLink } from "react-router-dom";
import { LayoutDashboard, Stethoscope, Users, CalendarDays, Receipt, User, Key, Calendar, Package, CreditCard, Bed, ClipboardList, FileText } from "lucide-react";

function Sidebar() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out ${
      isActive
        ? "bg-slate-900 text-white shadow-lg"
        : "text-theme-secondary hover:bg-theme-hover hover:text-theme-primary"
    }`;
  const role = localStorage.getItem("userRole");

  return (
    <div className="w-64 sticky top-0 h-screen overflow-y-auto no-scrollbar bg-theme-secondary/95 shadow-theme-xl border-r border-theme p-6 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between">
     <div>
       <h1 className="text-2xl font-bold text-theme-primary mb-8">🏥 Hospital MS</h1>
    <nav className="space-y-2">
      <NavLink to="/dashboard" className={linkClass}> <LayoutDashboard size={20} /> Dashboard</NavLink>
      {role === "Admin" && (
        <NavLink to="/doctors" className={linkClass}><Stethoscope size={20} /> Doctors</NavLink>
      )}
      <NavLink to="/patients" className={linkClass}> <Users size={20} /> Patients</NavLink>
      <NavLink to="/appointments" className={linkClass}><CalendarDays size={20} /> Appointments</NavLink>
      <NavLink to="/calendar" className={linkClass}><Calendar size={20} /> Appointment Calendar</NavLink>
      <NavLink to="/inventory" className={linkClass}><Package size={20} /> Inventory</NavLink>
      {(role === "Admin" || role === "Receptionist") && (
        <>
          <NavLink to="/bills" className={linkClass}> <Receipt size={20} /> Bills</NavLink>
          <NavLink to="/payments" className={linkClass}> <CreditCard size={20} /> Payments</NavLink>
          <NavLink to="/rooms" className={linkClass}> <Bed size={20} /> Rooms</NavLink>
          <NavLink to="/reports" className={linkClass}> <FileText size={20} /> Reports</NavLink>
        </>
      )}
      <NavLink to="/prescriptions" className={linkClass}><ClipboardList size={20} /> Prescriptions</NavLink>
      <NavLink to="/profile" className={linkClass}> <User size={20} /> Profile</NavLink>
      <NavLink to="/change-password" className={linkClass}> <Key size={20} /> Change Password</NavLink>
    </nav>
    </div>
</div>
  );
}
export default Sidebar;