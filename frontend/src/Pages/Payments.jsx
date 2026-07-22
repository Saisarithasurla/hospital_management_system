import { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import StatCard from "../Components/StatCard";
import Pagination from "../Components/Pagination";
import Spinner from "../Components/Spinner";
import ConfirmDialog from "../Components/ConfirmDialog";
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CreditCard, Search, Calendar, DollarSign, CheckCircle, XCircle, AlertCircle, FileSpreadsheet, FileText, ArrowUpDown } from 'lucide-react';
import "../theme-utils.css";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    total_payments: 0,
    todays_collection: 0,
    monthly_collection: 0,
    pending_payments: 0,
  });

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Form Fields
  const [selectedBillId, setSelectedBillId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionId, setTransactionId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [remarks, setRemarks] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // '', 'today', 'this_week', 'this_month'
  const [statusFilter, setStatusFilter] = useState(""); // '', 'Pending', 'Paid', 'Failed', 'Refunded'
  const [sortBy, setSortBy] = useState("-payment_date");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    fetchPayments();
    fetchStats();
    fetchBills();
    fetchPatients();
  }, [searchQuery, dateFilter, statusFilter, sortBy]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      let url = `https://hospital-management-system-6jw8.onrender.com/api/payments/?ordering=${sortBy}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      if (dateFilter) url += `&filter_type=${dateFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/payments/stats/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/bills/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/patients/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBillChange = (billId) => {
    setSelectedBillId(billId);
    if (!billId) {
      setAmount("");
      return;
    }
    const selectedBill = bills.find((b) => b.id === Number(billId));
    if (selectedBill) {
      setAmount(selectedBill.amount);
    }
  };

  const recordPayment = async () => {
    if (!selectedBillId) {
      toast.error("Please select a Bill");
      return;
    }
    if (Number(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (paymentMethod !== "Cash" && !transactionId) {
      toast.error("Transaction ID is required for online/card payments");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const selectedBill = bills.find((b) => b.id === Number(selectedBillId));
      const patientObj = patients.find((p) => p.id === selectedBill.patient);
      const patientName = patientObj ? patientObj.name : `Patient ${selectedBill.patient}`;

      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/payments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bill: Number(selectedBillId),
          patient_name: patientName,
          amount: amount,
          payment_method: paymentMethod,
          transaction_id: transactionId || null,
          payment_status: paymentStatus,
          remarks: remarks,
        }),
      });

      if (response.ok) {
        if (paymentStatus === "Paid") {
          toast.success("Payment Successful");
        } else if (paymentStatus === "Failed") {
          toast.error("Payment Failed");
        } else {
          toast.info(`Payment recorded as ${paymentStatus}`);
        }
        
        // Reset form
        setSelectedBillId("");
        setAmount("");
        setPaymentMethod("Cash");
        setTransactionId("");
        setPaymentStatus("Paid");
        setRemarks("");
        setShowForm(false);

        // Refresh lists
        fetchPayments();
        fetchStats();
        fetchBills();
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to record payment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatusRequest = (payment, status) => {
    setSelectedPayment(payment);
    setNewStatus(status);
    setConfirmStatusOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedPayment || !newStatus) return;
    setConfirmStatusOpen(false);
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/payments/${selectedPayment.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_status: newStatus,
        }),
      });

      if (response.ok) {
        if (newStatus === "Refunded") {
          toast.success("Payment Refunded Successfully");
        } else {
          toast.success(`Payment updated to ${newStatus}`);
        }
        fetchPayments();
        fetchStats();
        fetchBills();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const headers = [["ID", "Bill ID", "Patient Name", "Amount", "Method", "Date", "Transaction ID", "Status"]];
    const rows = payments.map((p) => [
      p.id,
      p.bill,
      p.patient_name,
      `₹${p.amount}`,
      p.payment_method,
      new Date(p.payment_date).toLocaleDateString(),
      p.transaction_id || "N/A",
      p.payment_status,
    ]);
    doc.text("Payments History Report", 14, 20);
    autoTable(doc, { head: headers, body: rows, startY: 28 });
    doc.save("payments-history-report.pdf");
    toast.success("PDF report downloaded");
  };

  const exportExcel = () => {
    const rows = payments.map((p) => ({
      "Payment ID": p.id,
      "Bill ID": p.bill,
      "Patient Name": p.patient_name,
      "Amount (₹)": Number(p.amount),
      "Payment Method": p.payment_method,
      "Payment Date": new Date(p.payment_date).toLocaleString(),
      "Transaction ID": p.transaction_id || "N/A",
      "Status": p.payment_status,
      "Remarks": p.remarks || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
    XLSX.writeFile(workbook, 'payments-history-report.xlsx');
    toast.success("Excel report downloaded");
  };

  // Pagination Logic
  const pageCount = Math.ceil(payments.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentPayments = payments.slice(offset, offset + itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return <span className="flex items-center gap-1.5 w-fit font-semibold text-emerald-500 dark:text-emerald-400"><CheckCircle size={14} /> Paid</span>;
      case "Pending":
        return <span className="flex items-center gap-1.5 w-fit font-semibold text-amber-500 dark:text-amber-400"><AlertCircle size={14} /> Pending</span>;
      case "Failed":
        return <span className="flex items-center gap-1.5 w-fit font-semibold text-rose-500 dark:text-rose-400"><XCircle size={14} /> Failed</span>;
      case "Refunded":
        return <span className="flex items-center gap-1.5 w-fit font-semibold text-purple-500 dark:text-purple-400"><CheckCircle size={14} /> Refunded</span>;
      default:
        return <span className="font-semibold text-gray-500 dark:text-gray-400">{status}</span>;
    }
  };

  const getBillOptions = () => {
    return bills.filter((b) => b.payment_status === "Pending" || b.payment_status === "Failed" || b.id === Number(selectedBillId));
  };

  return (
    <div className="flex min-h-screen bg-theme-primary page-payments">
      {loading && <Spinner />}
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          <div className="flex flex-col gap-6">
            
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
              <div>
                <h1 className="text-3xl font-bold text-theme-primary">Payments</h1>
                <p className="text-sm text-theme-muted">Record payments, manage transaction history, and generate reports.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-3xl font-semibold transition hover:-translate-y-0.5"
                >
                  {showForm ? "View Payment History" : "+ Record Payment"}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            {!showForm && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Payments" value={stats.total_payments} color="text-indigo-600 dark:text-indigo-400" />
                <StatCard title="Today's Collection" value={`₹${stats.todays_collection}`} color="text-emerald-600 dark:text-emerald-400" />
                <StatCard title="Monthly Collection" value={`₹${stats.monthly_collection}`} color="text-blue-600 dark:text-blue-400" />
                <StatCard title="Pending Payments" value={stats.pending_payments} color="text-amber-500 dark:text-amber-400" />
              </div>
            )}

            {showForm ? (
              /* Record Payment Form */
              <div className="max-w-xl mx-auto bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8 w-full">
                <h2 className="text-3xl font-bold text-center mb-8 text-theme-primary">Record Payment</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-theme-muted mb-2">Select Bill</label>
                    <select
                      value={selectedBillId}
                      onChange={(e) => handleBillChange(e.target.value)}
                      className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary"
                    >
                      <option value="">-- Choose a Bill --</option>
                      {getBillOptions().map((b) => {
                        const patient = patients.find((p) => p.id === b.patient);
                        return (
                          <option key={b.id} value={b.id}>
                            Bill #{b.id} - {patient ? patient.name : `Patient ${b.patient}`} (₹{b.amount})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-theme-muted mb-2">Amount (₹)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled
                      placeholder="Amount will auto-populate"
                      className="w-full border border-theme-strong rounded-lg p-4 bg-theme-disabled text-theme-muted cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-theme-muted mb-2">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>

                  {paymentMethod !== "Cash" && (
                    <div>
                      <label className="block text-sm font-medium text-theme-muted mb-2">Transaction ID / Reference</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter Transaction/Ref Number"
                        className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-theme-muted mb-2">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary"
                    >
                      <option value="Paid">Paid (Successful)</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-theme-muted mb-2">Remarks</label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional details..."
                      rows={3}
                      className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={recordPayment}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                    >
                      Save Payment
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Payments History View */
              <div className="flex flex-col gap-6">
                
                {/* Search, Filter, and Export Bar */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
                  
                  {/* Left Side: Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-3.5 text-theme-muted" size={18} />
                    <input
                      type="text"
                      placeholder="Search by Patient Name, Payment ID, Transaction ID..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                      className="w-full border border-theme-strong bg-theme-input rounded-3xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300 text-theme-primary placeholder:text-theme-muted"
                    />
                  </div>

                  {/* Middle: Filters & Sorting */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Date filter */}
                    <select
                      value={dateFilter}
                      onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(0); }}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-3 text-theme-primary focus:outline-none"
                    >
                      <option value="">All Date Ranges</option>
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                    </select>

                    {/* Status filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-3 text-theme-primary focus:outline-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>

                    {/* Sorting */}
                    <select
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value); setCurrentPage(0); }}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-3 text-theme-primary focus:outline-none"
                    >
                      <option value="-payment_date">Date (Newest First)</option>
                      <option value="payment_date">Date (Oldest First)</option>
                      <option value="-amount">Amount (High to Low)</option>
                      <option value="amount">Amount (Low to High)</option>
                      <option value="status">Status (A-Z)</option>
                      <option value="-status">Status (Z-A)</option>
                    </select>

                    {/* Items Per Page */}
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(0); }}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-3 py-3 text-theme-primary focus:outline-none"
                    >
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                    </select>
                  </div>

                  {/* Right Side: Exports */}
                  <div className="flex gap-2">
                    <button
                      onClick={exportPdf}
                      title="Export to PDF"
                      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-3xl font-semibold transition"
                    >
                      <FileText size={16} /> PDF
                    </button>
                    <button
                      onClick={exportExcel}
                      title="Export to Excel"
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-3xl font-semibold transition"
                    >
                      <FileSpreadsheet size={16} /> Excel
                    </button>
                  </div>
                </div>

                {/* Table View */}
                <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead className="bg-theme-tertiary">
                      <tr>
                        <th className="p-4 text-left text-theme-primary">Payment ID</th>
                        <th className="p-4 text-left text-theme-primary">Bill ID</th>
                        <th className="p-4 text-left text-theme-primary">Patient Name</th>
                        <th className="p-4 text-left text-theme-primary">Amount</th>
                        <th className="p-4 text-left text-theme-primary">Method</th>
                        <th className="p-4 text-left text-theme-primary">Date</th>
                        <th className="p-4 text-left text-theme-primary">Transaction ID</th>
                        <th className="p-4 text-left text-theme-primary">Status</th>
                        <th className="p-4 text-left text-theme-primary">Remarks</th>
                        <th className="p-4 text-center text-theme-primary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme">
                      {currentPayments.length > 0 ? (
                        currentPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-theme-hover text-theme-primary transition duration-150">
                            <td className="p-4 font-semibold text-blue-600 dark:text-blue-400">PAY-{String(payment.id).padStart(4, "0")}</td>
                            <td className="p-4">BILL-{String(payment.bill).padStart(4, "0")}</td>
                            <td className="p-4 font-medium">{payment.patient_name}</td>
                            <td className="p-4 font-semibold">₹{payment.amount}</td>
                            <td className="p-4">{payment.payment_method}</td>
                            <td className="p-4">{new Date(payment.payment_date).toLocaleDateString()}</td>
                            <td className="p-4 font-mono text-sm text-theme-muted">{payment.transaction_id || "—"}</td>
                            <td className="p-4">{getStatusBadge(payment.payment_status)}</td>
                            <td className="p-4 text-sm text-theme-muted max-w-[180px] truncate" title={payment.remarks}>{payment.remarks || "—"}</td>
                            <td className="p-4 text-center">
                              {payment.payment_status === "Paid" && (
                                <button
                                  onClick={() => handleUpdateStatusRequest(payment, "Refunded")}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                >
                                  Refund
                                </button>
                              )}
                              {payment.payment_status === "Pending" && (
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => handleUpdateStatusRequest(payment, "Paid")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatusRequest(payment, "Failed")}
                                    className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                                  >
                                    Fail
                                  </button>
                                </div>
                              )}
                              {["Failed", "Refunded"].includes(payment.payment_status) && (
                                <span className="text-xs text-theme-muted font-medium">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="text-center p-12 text-theme-muted font-medium">No Payments Found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {/* Pagination control */}
                  <Pagination
                    pageCount={pageCount}
                    onPageChange={({ selected }) => setCurrentPage(selected)}
                    forcePage={currentPage}
                  />
                </div>
              </div>
            )}

            {/* Confirm Payment Status Change dialog */}
            <ConfirmDialog
              isOpen={confirmStatusOpen}
              title={`Update Payment Status`}
              message={`Are you sure you want to update the status of this payment to ${newStatus}? This will automatically affect the status of the related bill.`}
              onConfirm={confirmStatusUpdate}
              onCancel={() => setConfirmStatusOpen(false)}
              confirmText="Confirm"
              cancelText="Cancel"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payments;
