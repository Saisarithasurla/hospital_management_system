import { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import StatCard from "../Components/StatCard";
import Spinner from "../Components/Spinner";
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from "recharts";
import { 
  Search, FileSpreadsheet, FileText, Printer, Calendar, 
  TrendingUp, IndianRupee, Users, Stethoscope, Receipt, ClipboardCheck, Package 
} from 'lucide-react';
import "../theme-utils.css";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function Reports() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total_patients: 0,
    total_doctors: 0,
    total_appointments: 0,
    total_revenue: 0,
    total_bills: 0,
    total_payments: 0,
    inventory_value: 0,
  });

  const [charts, setCharts] = useState({
    monthly_revenue: [],
    appointment_trends: [],
    doctor_wise_appointments: [],
    patient_growth: [],
    inventory_status: []
  });

  // Report selection
  const [selectedReport, setSelectedReport] = useState("patient"); // 'patient', 'doctor', 'appointment', 'revenue', 'bill', 'payment', 'inventory', 'prescription'
  const [reportData, setReportData] = useState([]);
  
  // Date filter presets & values
  const [datePreset, setDatePreset] = useState("last_30_days"); // 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'custom'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
  const [filterInventoryStock, setFilterInventoryStock] = useState("");

  // Dynamic dropdown lists for filters
  const [doctorsList, setDoctorsList] = useState([]);

  useEffect(() => {
    fetchSummaryAndCharts();
    fetchFilterData();
  }, []);

  useEffect(() => {
    applyDatePreset(datePreset);
  }, [datePreset]);

  useEffect(() => {
    generateReport();
  }, [selectedReport, startDate, endDate, searchQuery, filterGender, filterSpecialization, filterStatus, filterDoctor, filterPaymentMethod, filterInventoryStock]);

  const fetchSummaryAndCharts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const h = { Authorization: `Bearer ${token}` };
      
      const sumRes = await fetch("https://hospital-management-system-6jw8.onrender.com/api/reports/summary/", { headers: h });
      if (sumRes.ok) setSummary(await sumRes.json());

      const chartRes = await fetch("https://hospital-management-system-6jw8.onrender.com/api/reports/charts/", { headers: h });
      if (chartRes.ok) setCharts(await chartRes.json());
    } catch (e) {
      console.error(e);
      toast.error("Failed to load summary analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://hospital-management-system-6jw8.onrender.com/api/doctors/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDoctorsList(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const applyDatePreset = (preset) => {
    const today = new Date();
    let start = "";
    let end = today.toISOString().slice(0, 10);

    if (preset === "today") {
      start = end;
    } else if (preset === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      start = yesterday.toISOString().slice(0, 10);
      end = start;
    } else if (preset === "last_7_days") {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      start = lastWeek.toISOString().slice(0, 10);
    } else if (preset === "last_30_days") {
      const lastMonth = new Date(today);
      lastMonth.setDate(today.getDate() - 30);
      start = lastMonth.toISOString().slice(0, 10);
    } else if (preset === "this_month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      // adjust for local timezone offset
      const offset = startOfMonth.getTimezoneOffset();
      startOfMonth.setMinutes(startOfMonth.getMinutes() - offset);
      start = startOfMonth.toISOString().slice(0, 10);
    } else {
      // Custom date range
      return;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      let url = `https://hospital-management-system-6jw8.onrender.com/api/reports/generate/?report_type=${selectedReport}`;
      
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      
      // Add optional parameters
      if (selectedReport === "patient" && filterGender) url += `&gender=${filterGender}`;
      if (selectedReport === "doctor" && filterSpecialization) url += `&specialization=${filterSpecialization}`;
      if (["appointment", "bill", "payment"].includes(selectedReport) && filterStatus) url += `&status=${filterStatus}`;
      if (["appointment", "prescription"].includes(selectedReport) && filterDoctor) url += `&doctor=${filterDoctor}`;
      if (selectedReport === "payment" && filterPaymentMethod) url += `&payment_method=${filterPaymentMethod}`;
      if (selectedReport === "inventory" && filterInventoryStock) url += `&inventory_stock=${filterInventoryStock}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReportData(await res.json());
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  // EXPORT PDF
  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text(`${selectedReport.toUpperCase()} REPORT`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Period: ${startDate || "All"} to ${endDate || "All"}`, 14, 26);

    const headers = getReportHeaders();
    const rows = getReportRows();

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`${selectedReport}-report.pdf`);
    toast.success("Report downloaded as PDF");
  };

  // EXPORT EXCEL
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');
    XLSX.writeFile(workbook, `${selectedReport}-report.xlsx`);
    toast.success("Report downloaded as Excel");
  };

  // DIRECT PRINT
  const printReport = () => {
    const printContent = document.getElementById("report-table-container").innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h2 style="color: #3b82f6;">🏥 City General Hospital - ${selectedReport.toUpperCase()} REPORT</h2>
        <p style="color: #64748b; font-size: 12px;">Generated on: ${new Date().toLocaleString()}</p>
        <hr style="border: 1px solid #cbd5e1; margin-bottom: 20px;"/>
        ${printContent}
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const getReportHeaders = () => {
    switch (selectedReport) {
      case "patient": return ["Patient ID", "Name", "Age", "Gender", "Phone", "Registration Date"];
      case "doctor": return ["Doctor ID", "Doctor Name", "Specialization", "Phone", "Consultation Fees"];
      case "appointment": return ["Appt ID", "Patient Name", "Doctor Name", "Date", "Time", "Status"];
      case "revenue": return ["Bill ID", "Patient Name", "Payment Date", "Amount Received"];
      case "bill": return ["Bill ID", "Patient Name", "Total Amount", "Paid Amount", "Balance", "Payment Status", "Bill Date"];
      case "payment": return ["Payment ID", "Patient Name", "Amount", "Method", "Date", "Status", "Transaction ID"];
      case "inventory": return ["Item ID", "Medicine Name", "Category", "Unit Price", "Quantity in Stock", "Expiry Date"];
      case "prescription": return ["Presc ID", "Patient Name", "Doctor Name", "Prescription Date", "Diagnosis", "No. of Medicines"];
      default: return [];
    }
  };

  const getReportRows = () => {
    return reportData.map((item) => {
      switch (selectedReport) {
        case "patient": return [item.id, item.name, item.age, item.gender, item.phone, item.date];
        case "doctor": return [item.id, item.name, item.specialization, item.phone, `₹${item.fees}`];
        case "appointment": return [item.id, item.patient_name, item.doctor_name, item.date, item.time, item.status];
        case "revenue": return [item.bill_id, item.patient_name, item.date, `₹${item.amount}`];
        case "bill": return [item.id, item.patient_name, `₹${item.total}`, `₹${item.paid}`, `₹${item.balance}`, item.status, item.date];
        case "payment": return [item.id, item.patient_name, `₹${item.amount}`, item.method, item.date, item.status, item.transaction_id];
        case "inventory": return [item.id, item.name, item.category, `₹${item.price}`, item.stock, item.expiry];
        case "prescription": return [item.id, item.patient_name, item.doctor_name, item.date, item.diagnosis, item.medicines_count];
        default: return [];
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-theme-primary page-reports">
      {loading && <Spinner />}
      <Sidebar />
      <div className="flex-1 animate-fade-in">
        <Navbar />
        <div className="p-8">
          <div className="flex flex-col gap-6">

            {/* Header with Date Presets */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
              <div>
                <h1 className="text-3xl font-bold text-theme-primary">Hospital Reports & Analytics</h1>
                <p className="text-sm text-theme-muted">Generate audit logs, review financial data, and monitor department-wise clinical performance.</p>
              </div>

              {/* Date selection presets */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-theme-input px-4 py-2.5 rounded-3xl border border-theme">
                  <Calendar size={16} className="text-theme-muted" />
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value)}
                    className="bg-transparent text-theme-primary focus:outline-none text-sm font-semibold"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last_7_days">Last 7 Days</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="this_month">This Month</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {datePreset === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none"
                    />
                    <span className="text-theme-muted">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-3 py-2.5 text-sm text-theme-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Metrics Overview Summary Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Patients" value={summary.total_patients} color="text-blue-600 dark:text-blue-400" icon={<Users size={16} />} />
              <StatCard title="Appointments" value={summary.total_appointments} color="text-amber-500 dark:text-amber-400" icon={<ClipboardCheck size={16} />} />
              <StatCard title="Total Revenue" value={`₹${summary.total_revenue}`} color="text-purple-600 dark:text-purple-400" icon={<IndianRupee size={16} />} />
              <StatCard title="Inventory Value" value={`₹${summary.inventory_value}`} color="text-teal-500 dark:text-teal-400" icon={<Package size={16} />} />
            </div>

            {/* Charts Visualizations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Monthly Revenue Chart */}
              <div className="bg-theme-card rounded-3xl border border-theme p-6 shadow-theme-xl">
                <h3 className="text-lg font-bold text-theme-primary mb-4 flex items-center gap-2"><TrendingUp size={18} /> Monthly Revenue Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.monthly_revenue}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Appointment Trends Line Chart */}
              <div className="bg-theme-card rounded-3xl border border-theme p-6 shadow-theme-xl">
                <h3 className="text-lg font-bold text-theme-primary mb-4 flex items-center gap-2"><Calendar size={18} /> Appointment Success Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.appointment_trends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="Pending" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Patient Growth Area Chart */}
              <div className="bg-theme-card rounded-3xl border border-theme p-6 shadow-theme-xl">
                <h3 className="text-lg font-bold text-theme-primary mb-4 flex items-center gap-2"><Users size={18} /> Patient Database Growth</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.patient_growth}>
                      <defs>
                        <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Area type="monotone" dataKey="patients" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPatients)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Doctor Wise Distribution & Inventory Status */}
              <div className="bg-theme-card rounded-3xl border border-theme p-6 shadow-theme-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-theme-primary mb-4">Doctor Appointments Share</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.doctor_wise_appointments}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {charts.doctor_wise_appointments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-theme-primary mb-4">Inventory Stock Quantity</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.inventory_status} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} style={{ fontSize: '10px' }} />
                        <Tooltip />
                        <Bar dataKey="Stock" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>

            {/* Report Generator Controls */}
            <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-theme pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-theme-secondary">Select Report:</span>
                  <select
                    value={selectedReport}
                    onChange={(e) => {
                      setSelectedReport(e.target.value);
                      setSearchQuery("");
                      setFilterGender("");
                      setFilterSpecialization("");
                      setFilterStatus("");
                      setFilterDoctor("");
                      setFilterPaymentMethod("");
                      setFilterInventoryStock("");
                    }}
                    className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2.5 text-theme-primary font-semibold focus:outline-none"
                  >
                    <option value="patient">Patient Report</option>
                    <option value="doctor">Doctor Report</option>
                    <option value="appointment">Appointment Report</option>
                    <option value="revenue">Revenue Report</option>
                    <option value="bill">Bill Report</option>
                    <option value="payment">Payment Report</option>
                    <option value="inventory">Inventory Report</option>
                    <option value="prescription">Prescription Report</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={printReport}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-3xl text-sm font-semibold flex items-center gap-2 transition"
                  >
                    <Printer size={16} /> Print
                  </button>
                  <button
                    onClick={exportPdf}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-3xl text-sm font-semibold flex items-center gap-2 transition"
                  >
                    <FileText size={16} /> PDF
                  </button>
                  <button
                    onClick={exportExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-3xl text-sm font-semibold flex items-center gap-2 transition"
                  >
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                </div>
              </div>

              {/* Dynamic Filters Bar based on Report Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-theme-muted" size={16} />
                  <input
                    type="text"
                    placeholder="Search inside report..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-theme-strong bg-theme-input rounded-3xl pl-10 pr-4 py-2.5 text-sm text-theme-primary focus:outline-none"
                  />
                </div>

                {/* Patient Report Filters */}
                {selectedReport === "patient" && (
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                )}

                {/* Doctor Report Filters */}
                {selectedReport === "doctor" && (
                  <input
                    type="text"
                    placeholder="Filter by Specialization..."
                    value={filterSpecialization}
                    onChange={(e) => setFilterSpecialization(e.target.value)}
                    className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none"
                  />
                )}

                {/* Appointment Filters */}
                {selectedReport === "appointment" && (
                  <>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <select
                      value={filterDoctor}
                      onChange={(e) => setFilterDoctor(e.target.value)}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none"
                    >
                      <option value="">All Doctors</option>
                      {doctorsList.map(d => (
                        <option key={d.id} value={d.id}>Dr. {d.name}</option>
                      ))}
                    </select>
                  </>
                )}

                {/* Bill Filters */}
                {selectedReport === "bill" && (
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none"
                  >
                    <option value="">All Bill Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                )}

                {/* Payment Filters */}
                {selectedReport === "payment" && (
                  <>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none"
                    >
                      <option value="">All Payment Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>

                    <select
                      value={filterPaymentMethod}
                      onChange={(e) => setFilterPaymentMethod(e.target.value)}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none"
                    >
                      <option value="">All Methods</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </>
                )}

                {/* Inventory Filters */}
                {selectedReport === "inventory" && (
                  <select
                    value={filterInventoryStock}
                    onChange={(e) => setFilterInventoryStock(e.target.value)}
                    className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none"
                  >
                    <option value="">All Stock Levels</option>
                    <option value="low">Low Stock (&lt; 10)</option>
                    <option value="out">Out of Stock (= 0)</option>
                  </select>
                )}

                {/* Prescription Filters */}
                {selectedReport === "prescription" && (
                  <select
                    value={filterDoctor}
                    onChange={(e) => setFilterDoctor(e.target.value)}
                    className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2.5 text-sm text-theme-primary focus:outline-none"
                  >
                    <option value="">All Doctors</option>
                    {doctorsList.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name}</option>
                    ))}
                  </select>
                )}

              </div>

              {/* Generated Report Table Grid */}
              <div id="report-table-container" className="overflow-x-auto border border-theme rounded-2xl">
                <table className="w-full text-left text-sm text-theme-primary">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      {getReportHeaders().map((h, i) => (
                        <th key={i} className="p-4 font-bold border-b border-theme">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {reportData.length > 0 ? (
                      getReportRows().map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-theme-hover transition">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="p-4 font-medium">{cell}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={getReportHeaders().length} className="p-12 text-center text-theme-muted font-medium">
                          No report data matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
