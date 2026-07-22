import { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import "../theme-utils.css";
import Pagination from "../Components/Pagination";
import Spinner from "../Components/Spinner";
import ConfirmDialog from "../Components/ConfirmDialog";
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function Bills() {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeFromDate, setActiveFromDate] = useState("");
  const [activeToDate, setActiveToDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patient, setPatient] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteBillId, setDeleteBillId] = useState(null);
  const [appointment, setAppointment] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [amountError, setAmountError] = useState("");

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payTransactionId, setPayTransactionId] = useState("");
  const [payRemarks, setPayRemarks] = useState("");

  const initiatePayment = (bill) => {
    setSelectedBillForPayment(bill);
    setPayMethod("Cash");
    setPayTransactionId("");
    setPayRemarks("");
    setShowPaymentModal(true);
  };

  const processBillPayment = async () => {
    if (payMethod !== "Cash" && !payTransactionId) {
      toast.error("Transaction ID is required for digital payments");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const patientName = selectedBillForPayment.patient_name || patients.find(p => p.id == selectedBillForPayment.patient)?.name || `Patient ${selectedBillForPayment.patient}`;
      
      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/payments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bill: selectedBillForPayment.id,
          patient_name: patientName,
          amount: selectedBillForPayment.amount,
          payment_method: payMethod,
          transaction_id: payTransactionId || null,
          payment_status: "Paid",
          remarks: payRemarks,
        }),
      });

      if (response.ok) {
        toast.success("Payment Successful");
        setShowPaymentModal(false);
        setSelectedBillForPayment(null);
        fetchBills();
      } else {
        toast.error("Payment Failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Payment Failed");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchAppointments();
    fetchBills();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/doctors/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    setLoading(true);
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
      console.log(error);
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
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
      console.log(error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/appointments/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const addBill = async () => {
    if (Number(amount) <= 0) {
      setAmountError("Amount must be greater than 0");
      return;
    }
    setAmountError("");
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/bills/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient,
          appointment,
          amount,
          payment_status: paymentStatus,
        }),
      });
      if (response.ok) {
        toast.success('Bill Added Successfully');
        window.dispatchEvent(new Event('crud-operation'));
        setPatient("");
        setAppointment("");
        setAmount("");
        setPaymentStatus("Pending");
        setShowForm(false);
        setIsEditing(false);
        setEditingId(null);
        fetchBills();
      } else {
        toast.error('Failed to Add Bill');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to Add Bill');
    } finally {
      setLoading(false);
    }
  };

  const editBill = (bill) => {
    setPatient(bill.patient);
    setAppointment(bill.appointment);
    setAmount(bill.amount);
    setPaymentStatus(bill.payment_status);
    setEditingId(bill.id);
    setIsEditing(true);
    setShowForm(true);
    setAmountError("");
  };

  const updateBill = async () => {
    if (Number(amount) <= 0) {
      setAmountError("Amount must be greater than 0");
      return;
    }
    setAmountError("");
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch(
        `https://hospital-management-system-6jw8.onrender.com/api/bills/${editingId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            patient,
            appointment,
            amount,
            payment_status: paymentStatus,
          }),
        }
      );
      if (response.ok) {
        toast.success('Bill Updated Successfully');
        window.dispatchEvent(new Event('crud-operation'));
        setPatient("");
        setAppointment("");
        setAmount("");
        setPaymentStatus("Pending");
        setEditingId(null);
        setIsEditing(false);
        setShowForm(false);
        setAmountError("");
        fetchBills();
      } else {
        toast.error('Failed to Update Bill');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to Update Bill');
    } finally {
      setLoading(false);
    }
  };

  const requestDeleteBill = (id) => {
    setDeleteBillId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDeleteBill = async () => {
    setConfirmDeleteOpen(false);
    if (!deleteBillId) return;
    await deleteBill(deleteBillId);
    setDeleteBillId(null);
  };

  const cancelDeleteBill = () => {
    setConfirmDeleteOpen(false);
    setDeleteBillId(null);
  };

  const deleteBill = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch(
        `https://hospital-management-system-6jw8.onrender.com/api/bills/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        toast.success('Bill Deleted Successfully');
        window.dispatchEvent(new Event('crud-operation'));
        fetchBills();
      } else {
        toast.error('Failed to Delete Bill');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to Delete Bill');
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patientId, patientName) => {
    return patients.find((p) => p.id == patientId)?.name || patientName || patientId;
  };

  const getAppointmentLabel = (billAppointmentId, billAppointmentName) => {
    const appt = appointments.find((a) => a.id == billAppointmentId);
    if (!appt) return billAppointmentName || billAppointmentId;
    const apptPatient = getPatientName(appt.patient, appt.patient_name);
    const apptDoctor = doctors.find((d) => d.id == appt.doctor)?.name || appt.doctor_name || appt.doctor;
    return `${apptPatient}${apptDoctor ? ' - ' + apptDoctor : ''}`;
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const headers = [["ID", "Patient", "Appointment", "Amount", "Status"]];
    const rows = currentBills.map((bill) => [
      bill.id,
      getPatientName(bill.patient, bill.patient_name),
      getAppointmentLabel(bill.appointment, bill.appointment_name),
      `₹${bill.amount}`,
      bill.payment_status,
    ]);

    doc.text("Bills Report", 14, 20);
    autoTable(doc, { head: headers, body: rows, startY: 28 });
    doc.save("bills-report.pdf");
    toast.success('PDF downloaded');
  };

  const exportExcel = () => {
    const rows = currentBills.map((bill) => ({
      ID: bill.id,
      Patient: getPatientName(bill.patient, bill.patient_name),
      Appointment: getAppointmentLabel(bill.appointment, bill.appointment_name),
      Amount: bill.amount,
      Status: bill.payment_status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');
    XLSX.writeFile(workbook, 'bills-report.xlsx');
    toast.success('Excel downloaded');
  };

  const filteredBills = bills.filter((bill) => {
    const createdAt = bill.created_at ? bill.created_at.slice(0, 10) : "";
    const isWithinRange = (() => {
      if (!activeFromDate && !activeToDate) return true;
      const billDate = new Date(createdAt);
      if (activeFromDate && billDate < new Date(activeFromDate)) return false;
      if (activeToDate && billDate > new Date(activeToDate)) return false;
      return true;
    })();

    const matchesSearch =
      bill.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.amount.toString().includes(searchQuery) ||
      bill.payment_status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      createdAt.includes(searchQuery);

    return isWithinRange && matchesSearch;
  });

  const sortedBills = [...filteredBills].sort((a, b) => {
    if (sortField === "patientName") {
      const nameA = getPatientName(a.patient, a.patient_name).toString().toLowerCase();
      const nameB = getPatientName(b.patient, b.patient_name).toString().toLowerCase();
      if (nameA < nameB) return sortDirection === "asc" ? -1 : 1;
      if (nameA > nameB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }

    if (sortField === "amount") {
      const amountA = Number(a.amount) || 0;
      const amountB = Number(b.amount) || 0;
      return sortDirection === "asc" ? amountA - amountB : amountB - amountA;
    }

    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageCount = Math.ceil(sortedBills.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentBills = sortedBills.slice(offset, offset + itemsPerPage);

  const applyDateFilter = () => {
    setActiveFromDate(fromDate);
    setActiveToDate(toDate);
    setCurrentPage(0);
  };

  const resetFilter = () => {
    setFromDate("");
    setToDate("");
    setActiveFromDate("");
    setActiveToDate("");
    setCurrentPage(0);
  };

  return (
    <div className="flex min-h-screen bg-theme-primary page-bills">
      <Sidebar />
      {loading && <Spinner />}
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          <div className="flex flex-col gap-6 mb-8 bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-theme-primary">Bills</h1>
                <p className="text-sm text-theme-muted">Filter by date range, search by patient, amount, status, or date.</p>
              </div>
              <div className="flex items-center gap-3 flex-nowrap w-full sm:w-auto">
                <button type="button" onClick={exportPdf} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-3xl transition hover:-translate-y-0.5">Export PDF</button>
                <button type="button" onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-3xl transition hover:-translate-y-0.5">Export Excel</button>
                {!showForm && (
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setIsEditing(false);
                      setEditingId(null);
                      setPatient("");
                      setAppointment("");
                      setAmount("");
                      setPaymentStatus("Pending");
                      setAmountError("");
                    }}
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-3xl transition hover:-translate-y-0.5"
                  >
                    + Add Bill
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-end">
              {/* Date Filters */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex flex-col flex-1">
                    <label className="text-sm font-medium text-theme-secondary mb-1">From</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border border-theme-strong rounded-lg px-3 py-2 bg-theme-input text-theme-primary w-full"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="text-sm font-medium text-theme-secondary mb-1">To</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border border-theme-strong rounded-lg px-3 py-2 bg-theme-input text-theme-primary w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyDateFilter}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition hover:-translate-y-0.5"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={resetFilter}
                    className="bg-theme-tertiary hover:bg-theme-hover text-theme-secondary px-5 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Text Search and Sorting */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end w-full">
                <div className="flex-1 min-w-0">
                  <label className="text-sm font-medium text-theme-secondary mb-1 block">Search</label>
                  <input
                    type="text"
                    placeholder="Search Bill..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                    className="border border-theme-strong rounded-lg px-4 py-2 w-full bg-theme-input text-theme-primary placeholder:text-theme-muted focus:outline-none"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium text-theme-secondary mb-1 block">Sort by</label>
                  <div className="flex gap-2">
                    <select
                      value={sortField}
                      onChange={(e) => { setSortField(e.target.value); setCurrentPage(0); }}
                      className="border border-theme-strong rounded-lg px-3 py-2 w-full bg-theme-input text-theme-primary focus:outline-none"
                    >
                      <option value="patientName">Name</option>
                      <option value="createdAt">Date</option>
                      <option value="amount">Amount</option>
                    </select>
                    <button
                      onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
                      className="bg-theme-tertiary hover:bg-theme-hover text-theme-secondary px-4 py-2 rounded-lg text-sm font-semibold transition"
                      type="button"
                    >
                      {sortDirection === "asc" ? "Asc" : "Desc"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-theme-secondary mb-1 block">Items/page</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(0); }}
                    className="border border-theme-strong rounded-lg px-3 py-2 bg-theme-input text-theme-primary focus:outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {showForm ? (
            <div className="max-w-xl mx-auto bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8">
              <h2 className="text-3xl font-bold text-center mb-8 text-theme-primary">{isEditing ? "Update Bill" : "Add Bill"}</h2>
              <div className="space-y-5">
                <select value={patient} onChange={(e) => setPatient(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary">
                  <option value="">Select Patient</option>
                  {patients.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <select value={appointment} onChange={(e) => setAppointment(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary">
                  <option value="">Select Appointment</option>
                  {appointments.map((item) => {
                    const pName = patients.find(p => p.id == item.patient)?.name || item.patient_name || item.patient;
                    const dName = doctors.find(d => d.id == item.doctor)?.name || item.doctor_name || item.doctor;
                    const label = `${pName}${dName ? ' - ' + dName : ''}`;
                    return (
                      <option key={item.id} value={item.id}>{label || `Appointment #${item.id}`}</option>
                    );
                  })}
                </select>
                <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary placeholder:text-theme-muted" />
                {amountError && (
                  <p className="text-red-600 text-sm">{amountError}</p>
                )}
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
                <div className="flex gap-4">
                  <button onClick={isEditing ? updateBill : addBill} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">
                    {isEditing ? "Update Bill" : "Add Bill"}
                  </button>
                  <button onClick={() => { setShowForm(false); setIsEditing(false); setEditingId(null); setPatient(""); setAppointment(""); setAmount("");
                    setPaymentStatus("Pending"); setAmountError(""); }} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg">Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="p-4 text-left text-theme-primary">ID</th>
                    <th className="p-4 text-left text-theme-primary">Patient</th>
                    <th className="p-4 text-left text-theme-primary">Appointment</th>
                    <th className="p-4 text-left text-theme-primary">Amount</th>
                    <th className="p-4 text-left text-theme-primary">Status</th>
                    <th className="p-4 text-center text-theme-primary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.length > 0 ? (
                    currentBills.map((bill) => (
                      <tr key={bill.id} className="border-t border-theme hover:bg-theme-hover text-theme-primary">
                        <td className="p-4">{bill.id}</td>
                        <td className="p-4">{bill.patient_name || patients.find(p => p.id == bill.patient)?.name || bill.patient}</td>
                        <td className="p-4">
                          {(() => {
                            const appt = appointments.find(a => a.id == bill.appointment);
                            if (!appt) return bill.appointment;
                            const apptPatient = patients.find(p => p.id == appt.patient)?.name || appt.patient_name || appt.patient;
                            const apptDoctor = doctors.find(d => d.id == appt.doctor)?.name || appt.doctor_name || appt.doctor;
                            return `${apptPatient}${apptDoctor ? ' - ' + apptDoctor : ''}`;
                          })()}
                        </td>
                        <td className="p-4">₹{bill.amount}</td>
                        <td className="p-4">{bill.payment_status}</td>
                        <td className="p-4 text-center">
                          {(bill.payment_status === "Pending" || bill.payment_status === "Failed") && (
                            <button onClick={() => initiatePayment(bill)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-semibold mr-2 transition">Pay</button>
                          )}
                          <button onClick={() => editBill(bill)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs mr-2 transition">Edit</button>
                          <button onClick={() => requestDeleteBill(bill.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs transition">Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center p-8 text-theme-muted">No Bills Found</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination pageCount={pageCount} onPageChange={({ selected }) => setCurrentPage(selected)} forcePage={currentPage} />
            </div>
          )}
          <ConfirmDialog
            isOpen={confirmDeleteOpen}
            title="Delete Bill"
            message="Are you sure you want to delete this bill? This action cannot be undone."
            onConfirm={handleConfirmDeleteBill}
            onCancel={cancelDeleteBill}
            confirmText="Delete"
            cancelText="Cancel"
          />

          {showPaymentModal && selectedBillForPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-theme-primary mb-6">Process Payment</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-1">Patient</label>
                    <input
                      type="text"
                      value={selectedBillForPayment.patient_name || patients.find(p => p.id == selectedBillForPayment.patient)?.name || ''}
                      disabled
                      className="w-full border border-theme-strong rounded-lg p-3 bg-theme-disabled text-theme-muted cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-1">Amount (₹)</label>
                    <input
                      type="text"
                      value={`₹${selectedBillForPayment.amount}`}
                      disabled
                      className="w-full border border-theme-strong rounded-lg p-3 bg-theme-disabled text-theme-muted cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-1">Payment Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>
                  {payMethod !== "Cash" && (
                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-1">Transaction ID</label>
                      <input
                        type="text"
                        placeholder="Reference / Transaction ID"
                        value={payTransactionId}
                        onChange={(e) => setPayTransactionId(e.target.value)}
                        className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-1">Remarks</label>
                    <textarea
                      placeholder="Optional remarks..."
                      value={payRemarks}
                      onChange={(e) => setPayRemarks(e.target.value)}
                      rows={2}
                      className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={processBillPayment}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition"
                    >
                      Pay Now
                    </button>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bills;