import { useEffect, useState } from "react";
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  CreditCard, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  UserCheck,
  ChevronRight,
  RefreshCw,
  Award,
  Package
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

function DashboardAnalytics() {
  const [filterType, setFilterType] = useState("30_days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const role = localStorage.getItem("userRole");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      let url = `http://127.0.0.1:8000/api/dashboard/analytics/?filter_type=${filterType}`;
      if (filterType === "custom" && startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterType !== "custom") {
      fetchAnalytics();
    }
  }, [filterType]);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchAnalytics();
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-theme-muted text-sm font-medium">Fetching real-time analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-3xl p-8 text-center my-6">
        <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error Loading Analytics</p>
        <p className="text-theme-muted text-sm mb-4">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition duration-200 shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-theme-card border border-theme rounded-3xl p-8 text-center text-theme-muted my-6">
        No analytics data available.
      </div>
    );
  }

  const { summary, charts, widgets, quick_stats } = data;

  // Render trend percentage indicator helper
  const renderTrend = (changeValue, metricType = "positive") => {
    if (changeValue === 0) return null;
    const isPositive = changeValue > 0;
    
    // For cancelled appointments or pending bills, a decrease is positive/good.
    // But let's keep it simple: green for increase, red for decrease except where specified.
    let isGoodTrend = isPositive;
    if (metricType === "negative") {
      isGoodTrend = !isPositive;
    }

    return (
      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
        isGoodTrend 
          ? "bg-green-500/10 text-green-600 dark:text-green-400" 
          : "bg-red-500/10 text-red-600 dark:text-red-400"
      }`}>
        {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />}
        {Math.abs(changeValue)}%
      </span>
    );
  };

  // Helper to format currency values beautifully
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const isRevenueVisible = role === "Admin" || role === "Receptionist";
  const isDoctorsVisible = role === "Admin";

  return (
    <div className="space-y-8 mt-8 border-t border-theme pt-8">
      {/* Header and Filter Selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-theme-primary">Advanced Analytics</h2>
          <p className="text-sm text-theme-muted">Real-time charts, metrics, and trends compared to the previous period.</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1 bg-theme-tertiary p-1 rounded-2xl border border-theme">
            {[
              { id: "today", label: "Today" },
              { id: "7_days", label: "Last 7 Days" },
              { id: "30_days", label: "Last 30 Days" },
              { id: "this_month", label: "This Month" },
              { id: "custom", label: "Custom" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  filterType === filter.id
                    ? "bg-theme-card text-blue-600 dark:text-blue-400 shadow-theme-sm"
                    : "text-theme-secondary hover:text-theme-primary"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {filterType === "custom" && (
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 bg-theme-card border border-theme p-1 rounded-2xl">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-0 text-xs text-theme-primary font-medium focus:ring-0 px-2 py-1 outline-none"
              />
              <span className="text-theme-muted text-xs">to</span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-0 text-xs text-theme-primary font-medium focus:ring-0 px-2 py-1 outline-none"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                Apply
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Loading Spinner overlay for filtering */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="h-6 w-6 text-blue-500 animate-spin mr-2" />
          <span className="text-sm text-theme-muted font-medium">Filtering data...</span>
        </div>
      )}

      {/* summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Doctors Card */}
        {isDoctorsVisible && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Total Doctors</span>
              <div className="p-2 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">{summary.total_doctors.value}</span>
              {renderTrend(summary.total_doctors.change)}
            </div>
          </div>
        )}

        {/* Available Doctors Card */}
        {isDoctorsVisible && summary.available_doctors && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Available Doctors</span>
              <div className="p-2 bg-green-500/10 rounded-2xl text-green-600 dark:text-green-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">{summary.available_doctors.value}</span>
            </div>
          </div>
        )}

        {/* Busy Doctors Card */}
        {isDoctorsVisible && summary.busy_doctors && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Busy Doctors</span>
              <div className="p-2 bg-yellow-500/10 rounded-2xl text-yellow-600 dark:text-yellow-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">{summary.busy_doctors.value}</span>
            </div>
          </div>
        )}

        {/* On Leave Doctors Card */}
        {isDoctorsVisible && summary.on_leave_doctors && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">On Leave Doctors</span>
              <div className="p-2 bg-red-500/10 rounded-2xl text-red-600 dark:text-red-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">{summary.on_leave_doctors.value}</span>
            </div>
          </div>
        )}

        {/* Total Medicines Card */}
        {summary.total_medicines && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Total Medicines</span>
              <div className="p-2 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">{summary.total_medicines.value}</span>
            </div>
          </div>
        )}

        {/* Total Inventory Value Card */}
        {summary.total_inventory_value && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Total Inventory Value</span>
              <div className="p-2 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">₹{Number(summary.total_inventory_value.value).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Low Stock Medicines Card */}
        {summary.low_stock_medicines && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Low Stock Medicines</span>
              <div className="p-2 bg-yellow-500/10 rounded-2xl text-yellow-600 dark:text-yellow-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">{summary.low_stock_medicines.value}</span>
            </div>
          </div>
        )}

        {/* Expiring Medicines Card */}
        {summary.expiring_medicines && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Expiring Medicines (&lt;30 days)</span>
              <div className="p-2 bg-red-500/10 rounded-2xl text-red-600 dark:text-red-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">{summary.expiring_medicines.value}</span>
            </div>
          </div>
        )}

        {/* Patients Card */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-theme-secondary">Total Patients</span>
            <div className="p-2 bg-green-500/10 rounded-2xl text-green-600 dark:text-green-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-theme-primary">{summary.total_patients.value}</span>
            {renderTrend(summary.total_patients.change)}
          </div>
        </div>

        {/* Total Appointments Card */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-theme-secondary">Total Appointments</span>
            <div className="p-2 bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-theme-primary">{summary.total_appointments.value}</span>
            {renderTrend(summary.total_appointments.change)}
          </div>
        </div>

        {/* Today's Appointments Card */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-theme-secondary">Today's Appointments</span>
            <div className="p-2 bg-yellow-500/10 rounded-2xl text-yellow-600 dark:text-yellow-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-theme-primary">{summary.todays_appointments.value}</span>
            {renderTrend(summary.todays_appointments.change)}
          </div>
        </div>

        {/* Pending Appointments Card */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-theme-secondary">Pending Appointments</span>
            <div className="p-2 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-theme-primary">{summary.pending_appointments.value}</span>
            {renderTrend(summary.pending_appointments.change, "negative")}
          </div>
        </div>

        {/* Completed Appointments Card */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-theme-secondary">Completed Appointments</span>
            <div className="p-2 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-theme-primary">{summary.completed_appointments.value}</span>
            {renderTrend(summary.completed_appointments.change)}
          </div>
        </div>

        {/* Cancelled Appointments Card */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-theme-secondary">Cancelled Appointments</span>
            <div className="p-2 bg-red-500/10 rounded-2xl text-red-600 dark:text-red-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-theme-primary">{summary.cancelled_appointments.value}</span>
            {renderTrend(summary.cancelled_appointments.change, "negative")}
          </div>
        </div>

        {/* Total Bills Card */}
        {isRevenueVisible && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Total Bills</span>
              <div className="p-2 bg-slate-500/10 rounded-2xl text-slate-600 dark:text-slate-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">{summary.total_bills.value}</span>
              {renderTrend(summary.total_bills.change)}
            </div>
          </div>
        )}

        {/* Pending Bills Card */}
        {isRevenueVisible && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Pending Bills</span>
              <div className="p-2 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">{summary.pending_bills.value}</span>
              {renderTrend(summary.pending_bills.change, "negative")}
            </div>
          </div>
        )}

        {/* Paid Bills Card */}
        {isRevenueVisible && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Paid Bills</span>
              <div className="p-2 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-theme-primary">{summary.paid_bills.value}</span>
              {renderTrend(summary.paid_bills.change)}
            </div>
          </div>
        )}

        {/* Total Revenue Card */}
        {isRevenueVisible && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Total Revenue</span>
              <div className="p-2 bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-theme-primary">{formatCurrency(summary.total_revenue.value)}</span>
              {renderTrend(summary.total_revenue.change)}
            </div>
          </div>
        )}

        {/* Today's Revenue Card */}
        {isRevenueVisible && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Today's Revenue</span>
              <div className="p-2 bg-pink-500/10 rounded-2xl text-pink-600 dark:text-pink-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-theme-primary">{formatCurrency(summary.todays_revenue.value)}</span>
              {renderTrend(summary.todays_revenue.change)}
            </div>
          </div>
        )}

        {/* Monthly Revenue Card */}
        {isRevenueVisible && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:-translate-y-1 hover:shadow-theme-lg transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-theme-secondary">Monthly Revenue</span>
              <div className="p-2 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-theme-primary">{formatCurrency(summary.monthly_revenue.value)}</span>
              {renderTrend(summary.monthly_revenue.change)}
            </div>
          </div>
        )}
      </div>

      {/* Quick Statistics Strip */}
      <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <span className="text-xs font-semibold text-theme-secondary">Average Daily Revenue</span>
          <p className="text-xl font-bold text-theme-primary mt-1">{isRevenueVisible ? formatCurrency(quick_stats.avg_daily_revenue) : "₹0"}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-theme-secondary">Average Appointments/Day</span>
          <p className="text-xl font-bold text-theme-primary mt-1">{quick_stats.avg_appointments_per_day} slots</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-theme-secondary">Doctor Utilization Rate</span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{quick_stats.doctor_utilization_rate}%</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-theme-secondary">Patient Growth Rate</span>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-xl font-bold ${quick_stats.patient_growth_rate >= 0 ? "text-green-600" : "text-red-600"}`}>
              {quick_stats.patient_growth_rate}%
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Revenue Chart */}
        {isRevenueVisible && (
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md">
            <h3 className="text-lg font-bold text-theme-primary mb-4">Monthly Revenue</h3>
            <div className="h-[300px]">
              {charts.monthly_revenue.length === 0 ? (
                <div className="h-full flex items-center justify-center text-theme-muted text-sm">No revenue data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthly_revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: "16px" }}
                      labelStyle={{ color: "var(--text-primary)", fontWeight: "bold" }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Weekly/Daily Appointments Chart */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md">
          <h3 className="text-lg font-bold text-theme-primary mb-4">Weekly Appointments Trend</h3>
          <div className="h-[300px]">
            {charts.weekly_appointments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-theme-muted text-sm">No appointment data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.weekly_appointments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: "16px" }}
                    labelStyle={{ color: "var(--text-primary)", fontWeight: "bold" }}
                  />
                  <Line type="monotone" dataKey="appointments" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Patient Growth Area Chart */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md">
          <h3 className="text-lg font-bold text-theme-primary mb-4">Patient Registrations Growth</h3>
          <div className="h-[300px]">
            {charts.patient_growth.length === 0 ? (
              <div className="h-full flex items-center justify-center text-theme-muted text-sm">No registration data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.patient_growth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: "16px" }}
                    labelStyle={{ color: "var(--text-primary)", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="total_patients" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Doctor-wise Appointments Pie Chart */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md flex flex-col justify-between">
          <h3 className="text-lg font-bold text-theme-primary mb-2">Doctor-wise Appointment Share</h3>
          <div className="h-[250px]">
            {charts.doctor_wise_appointments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-theme-muted text-sm">No appointments scheduled</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.doctor_wise_appointments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.doctor_wise_appointments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: "16px" }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Appointment Status Distribution (Doughnut Chart) */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md flex flex-col justify-between lg:col-span-2">
          <h3 className="text-lg font-bold text-theme-primary mb-2">Appointment Status Distribution</h3>
          <div className="h-[260px] flex items-center justify-center">
            {charts.appointment_status_distribution.length === 0 ? (
              <div className="text-theme-muted text-sm">No appointments records</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.appointment_status_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.appointment_status_distribution.map((entry, index) => {
                      let color = "#cbd5e1";
                      if (entry.name === "Pending") color = "#f59e0b";
                      if (entry.name === "Completed") color = "#10b981";
                      if (entry.name === "Cancelled") color = "#ef4444";
                      return <Cell key={`status-cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: "16px" }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Doctors Widget */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-theme-primary">Top Doctors</h3>
          </div>
          <div className="space-y-4">
            {widgets.top_doctors.length === 0 ? (
              <p className="text-sm text-theme-muted text-center py-8">No doctor activity in this period</p>
            ) : (
              widgets.top_doctors.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-theme pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-theme-primary">{doc.name}</p>
                    <p className="text-xs text-theme-secondary">{doc.appointments} appointments</p>
                  </div>
                  {isRevenueVisible && (
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(doc.revenue)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Patients Widget */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold text-theme-primary">Recent Patients</h3>
          </div>
          <div className="space-y-4">
            {widgets.recent_patients.length === 0 ? (
              <p className="text-sm text-theme-muted text-center py-8">No recently registered patients</p>
            ) : (
              widgets.recent_patients.map((patient, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-theme pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-theme-primary">{patient.name}</p>
                    <p className="text-xs text-theme-secondary">
                      {patient.gender}, {patient.age} yrs • {patient.phone}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-theme-muted" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments Widget */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-theme-primary">Upcoming Appointments</h3>
          </div>
          <div className="space-y-4">
            {widgets.upcoming_appointments.length === 0 ? (
              <p className="text-sm text-theme-muted text-center py-8">No upcoming appointments scheduled</p>
            ) : (
              widgets.upcoming_appointments.map((appt, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-theme pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-theme-primary">{appt.patient_name}</p>
                    <p className="text-xs text-theme-secondary">
                      with <span className="font-medium">Dr. {appt.doctor_name}</span>
                    </p>
                    <p className="text-[10px] text-theme-muted mt-0.5">{appt.date} @ {appt.time}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    appt.status === "Completed" 
                      ? "bg-green-500/10 text-green-600" 
                      : appt.status === "Cancelled" 
                      ? "bg-red-500/10 text-red-600" 
                      : "bg-yellow-500/10 text-yellow-600"
                  }`}>
                    {appt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardAnalytics;
