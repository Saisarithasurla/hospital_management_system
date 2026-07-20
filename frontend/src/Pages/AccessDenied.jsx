import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-theme-primary flex items-center justify-center p-4">
      <div className="bg-theme-card max-w-md w-full rounded-2xl shadow-theme-xl border border-theme p-8 text-center backdrop-blur-xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-100 dark:bg-red-950/50 rounded-full text-red-600 dark:text-red-400 animate-pulse">
            <ShieldAlert size={48} />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-theme-primary mb-2">403</h1>
        <h2 className="text-2xl font-bold text-theme-primary mb-4">Access Denied</h2>
        <p className="text-theme-muted mb-8">
          You do not have permission to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-300 shadow-theme-lg"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default AccessDenied;
