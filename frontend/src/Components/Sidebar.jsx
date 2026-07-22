import { NavLink } from "react-router-dom";
import { LayoutDashboard, Stethoscope, Users, CalendarDays, Receipt, User, Key, Calendar, Package, CreditCard, Bed, ClipboardList, FileText, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useTheme();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out text-base font-bold ${
      isActive
        ? "bg-slate-900 text-white shadow-lg"
        : "text-theme-secondary hover:bg-theme-hover hover:text-theme-primary"
    }`;
  const role = localStorage.getItem("userRole");

  return (
    <>
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-theme-secondary/95 shadow-theme-xl border-r border-theme p-6 backdrop-blur-xl 
        transition-transform duration-300 ease-in-out flex flex-col justify-between
        md:sticky md:top-0 md:h-screen md:translate-x-0 md:z-30
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-theme-primary">🏥 Hospital MS</h1>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-theme-hover text-theme-secondary hover:text-theme-primary md:hidden cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="space-y-2 overflow-y-auto max-h-[calc(100vh-120px)] no-scrollbar">
            <NavLink to="/dashboard" className={linkClass} onClick={() => setSidebarOpen(false)}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            {role === "Admin" && (
              <NavLink to="/doctors" className={linkClass} onClick={() => setSidebarOpen(false)}>
                <Stethoscope size={20} /> Doctors
              </NavLink>
            )}
            <NavLink to="/patients" className={linkClass} onClick={() => setSidebarOpen(false)}>
              <Users size={20} /> Patients
            </NavLink>
            <NavLink to="/appointments" className={linkClass} onClick={() => setSidebarOpen(false)}>
              <CalendarDays size={20} /> Appointments
            </NavLink>
            <NavLink to="/calendar" className={linkClass} onClick={() => setSidebarOpen(false)}>
              <Calendar size={20} /> Appointment Calendar
            </NavLink>
            <NavLink to="/inventory" className={linkClass} onClick={() => setSidebarOpen(false)}>
              <Package size={20} /> Inventory
            </NavLink>
            {(role === "Admin" || role === "Receptionist") && (
              <>
                <NavLink to="/bills" className={linkClass} onClick={() => setSidebarOpen(false)}>
                  <Receipt size={20} /> Bills
                </NavLink>
                <NavLink to="/payments" className={linkClass} onClick={() => setSidebarOpen(false)}>
                  <CreditCard size={20} /> Payments
                </NavLink>
                <NavLink to="/rooms" className={linkClass} onClick={() => setSidebarOpen(false)}>
                  <Bed size={20} /> Rooms
                </NavLink>
                <NavLink to="/reports" className={linkClass} onClick={() => setSidebarOpen(false)}>
                  <FileText size={20} /> Reports
                </NavLink>
              </>
            )}
            <NavLink to="/prescriptions" className={linkClass} onClick={() => setSidebarOpen(false)}>
              <ClipboardList size={20} /> Prescriptions
            </NavLink>
            <NavLink to="/profile" className={linkClass} onClick={() => setSidebarOpen(false)}>
              <User size={20} /> Profile
            </NavLink>
            <NavLink to="/change-password" className={linkClass} onClick={() => setSidebarOpen(false)}>
              <Key size={20} /> Change Password
            </NavLink>
          </nav>
        </div>
      </div>
    </>
  );
}
export default Sidebar;