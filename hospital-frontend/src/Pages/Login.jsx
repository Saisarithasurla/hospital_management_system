import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sun, Moon, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { toast } from 'react-toastify';
import { useTheme } from "../context/ThemeContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Receptionist");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isSignUp) {
        await handleRegister(e);
      } else {
        await handleLogin(e);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      toast.warn("Please fill in all details.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Account Registered Successfully! Please Sign In.");
        setIsSignUp(false);
        setPassword("");
      } else {
        const errorMsg = data.username ? data.username[0] : (data.email ? data.email[0] : (data.detail || "Registration failed"));
        toast.error(errorMsg);
      }
    } catch (error) {
      console.log(error);
      toast.error("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        localStorage.setItem("userRole", data.role || "Receptionist");
        localStorage.setItem("username", data.username || username);
        toast.success('Login Successful');
        window.dispatchEvent(new Event('crud-operation'));
        navigate("/dashboard");
      } else {
        toast.error('Invalid Username or Password');
      }
    } catch (error) {
      console.log(error);
      toast.error('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-primary flex items-center justify-center relative transition-colors duration-300">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-theme-secondary text-theme-primary hover:bg-theme-hover border border-theme transition shadow-theme-md"
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="bg-theme-card shadow-theme-xl border border-theme rounded-3xl p-8 w-full max-w-md transition-colors duration-300 animate-fade-in">
        <h1 className="text-4xl font-bold text-center text-blue-600 dark:text-blue-400">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-center text-theme-muted mt-3 mb-8 text-sm">
          {isSignUp ? "Register a new hospital staff account" : "Sign in to continue to Hospital MS"}
        </p>

        <form onSubmit={isSignUp ? handleRegister : handleLogin} autoComplete="off" className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-theme-secondary">Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full border border-theme bg-theme-input text-theme-primary placeholder-slate-500 rounded-3xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2 text-theme-secondary">Username</label>
            <input
              type="text"
              name="username"
              autoComplete="off"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-theme bg-theme-input text-theme-primary placeholder-slate-500 rounded-3xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-theme-secondary">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full border border-theme bg-theme-input text-theme-primary placeholder-slate-500 rounded-3xl p-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary flex items-center justify-center"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-theme-secondary">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-theme bg-theme-input text-theme-primary rounded-3xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="Receptionist">Receptionist</option>
                <option value="Doctor">Doctor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-3xl font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {isSignUp ? "Registering..." : "Logging in..."}
              </>
            ) : isSignUp ? (
              <>
                <UserPlus size={18} /> Register Account
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
            }}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 transition-all"
          >
            {isSignUp ? (
              <>
                Already have an account? Sign In <ArrowRight size={16} />
              </>
            ) : (
              <>
                Don't have an account? Sign Up <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;