import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import "../theme-utils.css";
import { toast } from "react-toastify";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/profile/change-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.detail || "Password updated successfully.");
        window.dispatchEvent(new Event('crud-operation'));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const firstError = Object.values(data)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      }
    } catch (error) {
      console.log(error);
      toast.error("Unable to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-theme-primary">
      <Sidebar />
      <div className="flex-1 animate-fade-in">
        <Navbar />
        <div className="p-8">
          <div className="max-w-xl mx-auto bg-theme-card rounded-xl shadow-theme-xl p-8 border border-theme">
            <h1 className="text-3xl font-bold text-theme-primary mb-6">Change Password</h1>
            <form className="space-y-6" onSubmit={handlePasswordChange}>
              <div>
                <label className="block text-sm font-medium text-theme-secondary">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-2 w-full border border-theme-strong rounded-lg px-4 py-3 bg-theme-input text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 w-full border border-theme-strong rounded-lg px-4 py-3 bg-theme-input text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full border border-theme-strong rounded-lg px-4 py-3 bg-theme-input text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;