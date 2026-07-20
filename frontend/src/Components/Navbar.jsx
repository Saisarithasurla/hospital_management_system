import { useState, useEffect, useRef } from "react";
import { Moon, Sun, Bell, Trash2, Check, CheckCheck, User, Calendar, FileText, Lock, LogOut } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmDialog from "./ConfirmDialog";
function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("userRole") || "Staff";
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const handleLogout = () => setLogoutConfirmOpen(true);
  const confirmLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    navigate("/");
  };
  const cancelLogout = () => setLogoutConfirmOpen(false);
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "Dashboard";
    if (path.startsWith("/doctors")) return "Doctors";
    if (path.startsWith("/patients")) return "Patients";
    if (path.startsWith("/appointments")) return "Appointments";
    if (path.startsWith("/bills")) return "Bills";
    if (path.startsWith("/payments")) return "Payments";
    if (path.startsWith("/rooms")) return "Rooms";
    if (path.startsWith("/prescriptions")) return "Prescriptions";
    if (path.startsWith("/reports")) return "Reports";
    if (path.startsWith("/profile")) return "Profile";
    if (path.startsWith("/change-password")) return "Change Password";
    if (path.startsWith("/inventory")) return "Inventory";
    if (path.startsWith("/calendar")) return "Appointment Calendar";
    return "Hospital Management System";
  };
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  let roleDesc = "Hospital Staff";
  if (role === "Admin") roleDesc = "Hospital Administrator";
  else if (role === "Doctor") roleDesc = "Medical Professional";
  else if (role === "Receptionist") roleDesc = "Front Desk Staff";
  const firstLetter = username.charAt(0).toUpperCase();
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const response = await fetch("http://127.0.0.1:8000/api/notifications/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };
  useEffect(() => {
    fetchNotifications();

    const handleCrud = () => {
      fetchNotifications();
    };
    window.addEventListener("crud-operation", handleCrud);
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("crud-operation", handleCrud);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`http://127.0.0.1:8000/api/notifications/${id}/mark-read/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast.success("Notification marked as read");
        fetchNotifications();
      } else {
        toast.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark notification as read");
    }
  };
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://127.0.0.1:8000/api/notifications/mark-all-read/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast.success("All notifications marked as read");
        fetchNotifications();
      } else {
        toast.error("Failed to mark all as read");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark all as read");
    }
  };
  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`http://127.0.0.1:8000/api/notifications/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast.success("Notification deleted");
        fetchNotifications();
      } else {
        toast.error("Failed to delete notification");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete notification");
    }
  };
  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://127.0.0.1:8000/api/notifications/clear-all/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast.success("All notifications cleared");
        fetchNotifications();
      } else {
        toast.error("Failed to clear notifications");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to clear notifications");
    }
  };
  const getIcon = (type) => {
    switch (type) {
      case "doctor":
        return <User className="text-blue-500" size={18} />;
      case "patient":
        return <User className="text-green-500" size={18} />;
      case "appointment":
        return <Calendar className="text-purple-500" size={18} />;
      case "bill":
        return <FileText className="text-amber-500" size={18} />;
      case "auth":
      default:
        return <Lock className="text-indigo-500" size={18} />;
    }
  };
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  return (
    <div className="sticky top-0 left-0 z-30 bg-theme-secondary/95 shadow-theme-xl backdrop-blur-xl h-16 flex items-center justify-between px-8 border-b border-theme">
      <h2 className="text-2xl font-bold text-theme-primary">{getPageTitle()}</h2>
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full bg-theme-tertiary text-theme-primary hover:bg-theme-hover transition-colors relative flex items-center justify-center" title="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-2xs font-bold leading-none text-red-100 bg-red-600 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-theme-card border border-theme rounded-xl shadow-theme-2xl z-50 overflow-hidden text-theme-primary">
              <div className="flex items-center justify-between px-4 py-3 border-b border-theme bg-theme-secondary/40">
                <h3 className="font-semibold text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 font-medium transition-colors cursor-pointer">
                    <CheckCheck size={14} /> Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-theme">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-theme-muted text-sm">
                    No Notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-4 transition-colors flex gap-3 hover:bg-theme-hover relative group ${!n.is_read ? "bg-blue-500/5 border-l-4 border-blue-500 pl-3" : ""}`}>
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(n.notification_type)}
                      </div>
                      <div className="flex-1 pr-6">
                        <h4 className={`text-sm ${!n.is_read ? "font-bold text-theme-primary" : "font-medium text-theme-secondary"}`}>
                          {n.title}
                        </h4>
                        <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                          {n.description}
                        </p>
                        <span className="text-[10px] text-theme-muted block mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="absolute right-2 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.is_read && (
                          <button onClick={() => markAsRead(n.id)} className="p-1 rounded bg-theme-tertiary text-blue-500 hover:bg-theme-hover transition-colors cursor-pointer" title="Mark as read">
                            <Check size={14} />
                          </button>
                        )}
                        <button onClick={() => deleteNotification(n.id)} className="p-1 rounded bg-theme-tertiary text-red-500 hover:bg-theme-hover transition-colors cursor-pointer" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-2 bg-theme-secondary/40 border-t border-theme flex justify-end">
                  <button onClick={clearAllNotifications} className="text-xs text-red-500 hover:text-red-600 hover:underline flex items-center gap-1 font-medium transition-colors cursor-pointer">
                    <Trash2 size={12} /> Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-full bg-theme-tertiary text-theme-primary hover:bg-theme-hover transition-colors" title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button onClick={handleLogout} className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center cursor-pointer" title="Logout">
          <LogOut size={20} />
        </button>
        <div className="flex items-center gap-3 pl-2 border-l border-theme">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{firstLetter}</div>
          <div>
            <h3 className="font-semibold text-theme-primary">{username}</h3>
            <p className="text-sm text-theme-muted">{roleDesc}</p>
          </div>
        </div>
      </div>
      <ConfirmDialog isOpen={logoutConfirmOpen} title="Logout" message="Are you sure you want to log out?" onConfirm={confirmLogout} onCancel={cancelLogout} confirmText="Logout" cancelText="Stay" />
    </div>
  );
}
export default Navbar;