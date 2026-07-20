import { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import "../theme-utils.css";
import { toast } from "react-toastify";
import { User } from "lucide-react";

function Profile() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://127.0.0.1:8000/api/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsername(data.username || "");
        setEmail(data.email || "");
        setRole(data.role || "User");
      } else {
        toast.error(data.detail || "Unable to load profile.");
      }
    } catch (error) {
      console.log(error);
      toast.error("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://127.0.0.1:8000/api/profile/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username, email, role }),
      });
      if (res.ok) {
        toast.success("Profile updated");
        setEditOpen(false);
        setFieldErrors({});
        fetchProfile();
      } else {
        let data;
        try {
          data = await res.json();
        } catch (e) {
          const text = await res.text();
          console.error("Profile save failed:", res.status, text);
          toast.error(`Save failed (${res.status}): ${text}`);
          return;
        }
        console.error("Profile save failed:", res.status, data);
        if (typeof data === "object") {
          setFieldErrors(data);
          const combined = Object.values(data).flat().join(" ");
          toast.error(`Save failed: ${combined}`);
        } else {
          toast.error(`Save failed (${res.status})`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile: " + err.message);
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
          <div className="max-w-4xl mx-auto bg-theme-card rounded-2xl shadow-theme-xl p-8 border border-theme">
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-bold text-theme-primary">Profile</h1>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl shadow-sm"
              >
                Edit Profile
              </button>
            </div>
            <p className="text-sm text-theme-muted mt-2 mb-6">Manage your account information.</p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 bg-theme-tertiary rounded-xl flex items-center gap-4">
                <div className="p-3 bg-theme-card rounded-lg shadow-theme-sm">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-theme-muted">Username</p>
                  <p className="mt-1 text-lg font-semibold text-theme-primary">{username || '-'}</p>
                </div>
              </div>

              <div className="p-4 bg-theme-tertiary rounded-xl flex items-center gap-4">
                <div className="p-3 bg-theme-card rounded-lg shadow-theme-sm">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-theme-muted">Email</p>
                  <p className="mt-1 text-lg font-semibold text-theme-primary">{email || '-'}</p>
                </div>
              </div>

              <div className="p-4 bg-theme-tertiary rounded-xl flex items-center gap-4">
                <div className="p-3 bg-theme-card rounded-lg shadow-theme-sm">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-theme-muted">Role</p>
                  <p className="mt-1 text-lg font-semibold text-theme-primary">{role || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-overlay px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-theme-card p-6 shadow-2xl border border-theme">
            <h2 className="text-xl font-semibold text-theme-primary mb-4">Edit Profile</h2>
            <div className="space-y-3">
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary placeholder:text-theme-muted" placeholder="Username" />
              {fieldErrors.username && <p className="text-red-600 text-sm">{fieldErrors.username.join(" ")}</p>}
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary placeholder:text-theme-muted" placeholder="Email" />
              {fieldErrors.email && <p className="text-red-600 text-sm">{fieldErrors.email.join(" ")}</p>}
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={localStorage.getItem("userRole") !== "Admin"}
                className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary disabled:opacity-60"
              >
                <option>Admin</option>
                <option>Doctor</option>
                <option>Receptionist</option>
              </select>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => { setEditOpen(false); setFieldErrors({}); }} className="rounded-lg border border-theme bg-theme-card px-4 py-2 text-theme-primary">Cancel</button>
                <button type="button" onClick={saveProfile} disabled={loading} className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;