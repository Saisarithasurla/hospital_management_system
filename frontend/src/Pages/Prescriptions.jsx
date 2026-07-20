import { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import Pagination from "../Components/Pagination";
import Spinner from "../Components/Spinner";
import ConfirmDialog from "../Components/ConfirmDialog";
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Search, FileText, ClipboardList, Trash2, Printer, Pill, Eye, Check } from 'lucide-react';
import "../theme-utils.css";

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal controls
  const [showForm, setShowForm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Confirm delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Form Fields
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().slice(0, 10));
  const [prescriptionStatus, setPrescriptionStatus] = useState("Prescribed");
  const [selectedMedicines, setSelectedMedicines] = useState([
    { medicine: "", dosage: "", frequency: "Morning", duration: "", instructions: "After Food" }
  ]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // '', 'today', 'this_week', 'this_month'
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterPatient, setFilterPatient] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const role = localStorage.getItem("userRole");

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
    fetchDoctors();
    fetchAppointments();
    fetchInventory();
  }, [searchQuery, dateFilter, filterDoctor, filterPatient]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      let url = `https://hospital-management-system-6jw8.onrender.com/api/prescriptions/`;
      const params = [];
      if (searchQuery) params.push(`search=${searchQuery}`);
      if (dateFilter) params.push(`filter_type=${dateFilter}`);
      if (filterDoctor) params.push(`doctor=${filterDoctor}`);
      if (filterPatient) params.push(`patient=${filterPatient}`);
      if (params.length) url += `?${params.join("&")}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setPrescriptions(await response.json());
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://hospital-management-system-6jw8.onrender.com/api/patients/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPatients(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://hospital-management-system-6jw8.onrender.com/api/doctors/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDoctors(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://hospital-management-system-6jw8.onrender.com/api/appointments/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAppointments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://hospital-management-system-6jw8.onrender.com/api/medicines/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setInventory(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Medicine Rows Management
  const addMedicineRow = () => {
    setSelectedMedicines([...selectedMedicines, { medicine: "", dosage: "", frequency: "Morning", duration: "", instructions: "After Food" }]);
  };

  const removeMedicineRow = (index) => {
    const updated = selectedMedicines.filter((_, idx) => idx !== index);
    setSelectedMedicines(updated);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = selectedMedicines.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setSelectedMedicines(updated);
  };

  // Save Prescription (Create / Update)
  const savePrescription = async () => {
    if (!patientId || !doctorId || !appointmentId || !diagnosis) {
      toast.error("Please fill in patient, doctor, appointment, and diagnosis");
      return;
    }

    // Check if any medicine row is invalid
    for (let i = 0; i < selectedMedicines.length; i++) {
      const med = selectedMedicines[i];
      if (!med.medicine || !med.dosage || !med.duration) {
        toast.error(`Please complete all fields for medicine row #${i + 1}`);
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const url = editingId 
        ? `https://hospital-management-system-6jw8.onrender.com/api/prescriptions/${editingId}/`
        : "https://hospital-management-system-6jw8.onrender.com/api/prescriptions/";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient: Number(patientId),
          doctor: Number(doctorId),
          appointment: Number(appointmentId),
          prescription_date: prescriptionDate,
          diagnosis,
          status: prescriptionStatus,
          medicines: selectedMedicines.map(m => ({
            medicine: Number(m.medicine),
            dosage: m.dosage,
            frequency: m.frequency,
            duration: Number(m.duration),
            instructions: m.instructions
          }))
        })
      });

      if (res.ok) {
        toast.success(editingId ? "Prescription Updated" : "Prescription Created");
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchPrescriptions();
      } else {
        const errorData = await res.json();
        toast.error(errorData.detail || "Failed to save prescription");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save prescription");
    } finally {
      setLoading(false);
    }
  };

  const editPrescription = (presc) => {
    setEditingId(presc.id);
    setPatientId(presc.patient);
    setDoctorId(presc.doctor);
    setAppointmentId(presc.appointment);
    setDiagnosis(presc.diagnosis);
    setPrescriptionDate(presc.prescription_date);
    setPrescriptionStatus(presc.status);
    setSelectedMedicines(presc.medicines.map(m => ({
      id: m.id,
      medicine: m.medicine,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions
    })));
    setShowForm(true);
  };

  const requestDelete = (id) => {
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setConfirmDeleteOpen(false);
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/prescriptions/${deleteId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Prescription Deleted");
        fetchPrescriptions();
      } else {
        toast.error("Failed to delete prescription");
      }
    } catch (e) {
      console.error(e);
      toast.error("Deletion failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPatientId("");
    setDoctorId("");
    setAppointmentId("");
    setDiagnosis("");
    setPrescriptionDate(new Date().toISOString().slice(0, 10));
    setPrescriptionStatus("Prescribed");
    setSelectedMedicines([
      { medicine: "", dosage: "", frequency: "Morning", duration: "", instructions: "After Food" }
    ]);
  };

  // Dispense Stock Integration
  const dispensePrescription = async (prescId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/prescriptions/${prescId}/dispense/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Prescription Dispensed. Inventory stock reduced successfully.");
        fetchPrescriptions();
      } else {
        const errorData = await res.json();
        toast.error(errorData.detail || "Failed to dispense prescription");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to dispense prescription");
    } finally {
      setLoading(false);
    }
  };

  // PDF Export single prescription
  const downloadSinglePdf = (presc) => {
    const doc = new jsPDF();
    const pName = patients.find(p => p.id === presc.patient)?.name || presc.patient_name;
    const dName = doctors.find(d => d.id === presc.doctor)?.name || presc.doctor_name;

    // Header Design
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("🏥 City General Hospital", 15, 25);
    doc.setFontSize(10);
    doc.text("123 Healthcare Ave, Medical District", 15, 33);

    // Patient & Doctor Box
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text("PRESCRIPTION SLIP", 15, 55);

    doc.setFontSize(10);
    doc.text(`Prescription ID: PRE-${String(presc.id).padStart(4, "0")}`, 140, 55);
    doc.text(`Date: ${new Date(presc.prescription_date).toLocaleDateString()}`, 140, 61);

    doc.line(15, 65, 195, 65);

    // Metadata details
    doc.text(`Patient Name: ${pName}`, 15, 75);
    doc.text(`Doctor Name: Dr. ${dName}`, 15, 82);
    doc.text(`Diagnosis: ${presc.diagnosis}`, 15, 92);

    // Medicine headers and rows
    const headers = [["Medicine Name", "Dosage", "Frequency", "Duration", "Instructions"]];
    const rows = presc.medicines.map((m) => {
      const medName = inventory.find(i => i.id === m.medicine)?.name || m.medicine_name;
      return [medName, m.dosage, m.frequency, `${m.duration} Days`, m.instructions];
    });

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 105,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Signature Area
    const finalY = doc.lastAutoTable.finalY + 30;
    doc.line(140, finalY, 190, finalY);
    doc.text("Doctor's Signature", 148, finalY + 7);

    doc.save(`prescription-PRE-${presc.id}.pdf`);
    toast.success("PDF Downloaded");
  };

  // Pagination Helper
  const pageCount = Math.ceil(prescriptions.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentPrescriptions = prescriptions.slice(offset, offset + itemsPerPage);

  const getFilteredAppointments = () => {
    if (!patientId || !doctorId) return appointments;
    return appointments.filter(a => a.patient == patientId && a.doctor == doctorId);
  };

  return (
    <div className="flex min-h-screen bg-theme-primary">
      {loading && <Spinner />}
      <Sidebar />
      <div className="flex-1 animate-fade-in">
        <Navbar />
        <div className="p-8">
          <div className="flex flex-col gap-6">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
              <div>
                <h1 className="text-3xl font-bold text-theme-primary">Prescriptions</h1>
                <p className="text-sm text-theme-muted">Manage patient digital prescriptions and integrate with pharmacy dispensing.</p>
              </div>
              <div className="flex items-center gap-3">
                {role !== "Receptionist" && (
                  <button
                    onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-3xl font-semibold transition hover:-translate-y-0.5"
                  >
                    + Create Prescription
                  </button>
                )}
              </div>
            </div>

            {showForm ? (
              /* Create/Edit Form */
              <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8 max-w-4xl mx-auto w-full">
                <h2 className="text-3xl font-bold text-center mb-8 text-theme-primary">{editingId ? "Update Prescription" : "Create Prescription"}</h2>
                <div className="space-y-6">
                  
                  {/* Row 1: Patient & Doctor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-2">Patient</label>
                      <select
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary"
                      >
                        <option value="">-- Select Patient --</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-2">Doctor</label>
                      <select
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary"
                      >
                        <option value="">-- Select Doctor --</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Appointment & Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-2">Appointment</label>
                      <select
                        value={appointmentId}
                        onChange={(e) => setAppointmentId(e.target.value)}
                        className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary"
                      >
                        <option value="">-- Select Appointment --</option>
                        {getFilteredAppointments().map(a => {
                          const p = patients.find(pat => pat.id == a.patient)?.name || "Patient";
                          const d = doctors.find(doc => doc.id == a.doctor)?.name || "Doctor";
                          return (
                            <option key={a.id} value={a.id}>
                              Appt #{a.id} - {p} with Dr. {d} ({a.appointment_date})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-2">Prescription Date</label>
                      <input
                        type="date"
                        value={prescriptionDate}
                        onChange={(e) => setPrescriptionDate(e.target.value)}
                        className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-2">Diagnosis</label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="Enter patient diagnosis description..."
                      rows={3}
                      className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary"
                    />
                  </div>

                  {/* Dynamic Medicines Rows */}
                  <div>
                    <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2"><Pill size={18} /> Medicines List</h3>
                    <div className="space-y-4">
                      {selectedMedicines.map((med, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-3 items-end bg-theme-tertiary p-4 rounded-xl border border-theme">
                          <div>
                            <label className="block text-xs text-theme-muted mb-1">Medicine Name (Inventory)</label>
                            <select
                              value={med.medicine}
                              onChange={(e) => handleMedicineChange(index, "medicine", e.target.value)}
                              className="w-full border border-theme-strong rounded-lg p-2 bg-theme-input text-theme-primary text-sm"
                            >
                              <option value="">-- Choose Medicine --</option>
                              {inventory.map(i => (
                                <option key={i.id} value={i.id}>{i.name} (Stock: {i.quantity_in_stock})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-theme-muted mb-1">Dosage</label>
                            <input
                              type="text"
                              value={med.dosage}
                              placeholder="e.g. 500mg, 1 tab"
                              onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                              className="w-full border border-theme-strong rounded-lg p-2 bg-theme-input text-theme-primary text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-theme-muted mb-1">Frequency</label>
                            <select
                              value={med.frequency}
                              onChange={(e) => handleMedicineChange(index, "frequency", e.target.value)}
                              className="w-full border border-theme-strong rounded-lg p-2 bg-theme-input text-theme-primary text-sm"
                            >
                              <option value="Morning">Morning</option>
                              <option value="Afternoon">Afternoon</option>
                              <option value="Night">Night</option>
                              <option value="Morning/Night">Morning/Night</option>
                              <option value="Morning/Afternoon/Night">Morning/Afternoon/Night</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-theme-muted mb-1">Duration (Days)</label>
                            <input
                              type="number"
                              value={med.duration}
                              placeholder="Days"
                              onChange={(e) => handleMedicineChange(index, "duration", e.target.value)}
                              className="w-full border border-theme-strong rounded-lg p-2 bg-theme-input text-theme-primary text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-theme-muted mb-1">Instructions</label>
                            <select
                              value={med.instructions}
                              onChange={(e) => handleMedicineChange(index, "instructions", e.target.value)}
                              className="w-full border border-theme-strong rounded-lg p-2 bg-theme-input text-theme-primary text-sm"
                            >
                              <option value="Before Food">Before Food</option>
                              <option value="After Food">After Food</option>
                              <option value="With Food">With Food</option>
                            </select>
                          </div>

                          {selectedMedicines.length > 1 && (
                            <button
                              onClick={() => removeMedicineRow(index)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-lg mb-0.5"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addMedicineRow}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        + Add Medicine Row
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={savePrescription}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition"
                    >
                      Save Prescription
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-4 rounded-xl font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              /* Prescriptions History View */
              <div className="flex flex-col gap-6">

                {/* Search and Filters Bar */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
                  
                  {/* Left Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-3.5 text-theme-muted" size={18} />
                    <input
                      type="text"
                      placeholder="Search by Patient, Doctor, or Prescription ID..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                      className="w-full border border-theme-strong bg-theme-input rounded-3xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300 text-theme-primary placeholder:text-theme-muted"
                    />
                  </div>

                  {/* Right Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={dateFilter}
                      onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(0); }}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-3 text-theme-primary focus:outline-none"
                    >
                      <option value="">All Dates</option>
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                    </select>

                    <select
                      value={filterDoctor}
                      onChange={(e) => { setFilterDoctor(e.target.value); setCurrentPage(0); }}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-3 text-theme-primary focus:outline-none"
                    >
                      <option value="">All Doctors</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>Dr. {d.name}</option>
                      ))}
                    </select>

                    <select
                      value={filterPatient}
                      onChange={(e) => { setFilterPatient(e.target.value); setCurrentPage(0); }}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-3 text-theme-primary focus:outline-none"
                    >
                      <option value="">All Patients</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

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
                </div>

                {/* Table list */}
                <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-theme-tertiary">
                      <tr>
                        <th className="p-4 text-left text-theme-primary">Prescription ID</th>
                        <th className="p-4 text-left text-theme-primary">Patient Name</th>
                        <th className="p-4 text-left text-theme-primary">Doctor Name</th>
                        <th className="p-4 text-left text-theme-primary">Date</th>
                        <th className="p-4 text-left text-theme-primary">Diagnosis</th>
                        <th className="p-4 text-left text-theme-primary">Medicines Count</th>
                        <th className="p-4 text-left text-theme-primary">Status</th>
                        <th className="p-4 text-center text-theme-primary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme">
                      {currentPrescriptions.length > 0 ? (
                        currentPrescriptions.map((presc) => {
                          const patName = patients.find(p => p.id === presc.patient)?.name || presc.patient_name;
                          const docName = doctors.find(d => d.id === presc.doctor)?.name || presc.doctor_name;
                          return (
                            <tr key={presc.id} className="hover:bg-theme-hover text-theme-primary transition duration-150">
                              <td className="p-4 font-bold text-blue-600 dark:text-blue-400">PRE-{String(presc.id).padStart(4, "0")}</td>
                              <td className="p-4">{patName}</td>
                              <td className="p-4">Dr. {docName}</td>
                              <td className="p-4">{new Date(presc.prescription_date).toLocaleDateString()}</td>
                              <td className="p-4 truncate max-w-[200px]" title={presc.diagnosis}>{presc.diagnosis}</td>
                              <td className="p-4 font-semibold">{presc.medicines?.length || 0}</td>
                              <td className="p-4">
                                {presc.status === "Dispensed" ? (
                                  <span className="text-emerald-500 font-semibold flex items-center gap-1"><Check size={14} /> Dispensed</span>
                                ) : (
                                  <span className="text-amber-500 font-semibold">Prescribed</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center items-center gap-1.5">
                                  <button
                                    onClick={() => { setSelectedPrescription(presc); setShowPrintModal(true); }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                                    title="Print Prescription Slip"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  {presc.status === "Prescribed" && (
                                    <>
                                      {role === "Admin" && (
                                        <button
                                          onClick={() => dispensePrescription(presc.id)}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-2 rounded-lg text-xs font-semibold"
                                          title="Dispense Pharmacy Stock"
                                        >
                                          Dispense
                                        </button>
                                      )}
                                      {role !== "Receptionist" && (
                                        <>
                                          <button
                                            onClick={() => editPrescription(presc)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-2 rounded-lg text-xs"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => requestDelete(presc.id)}
                                            className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-lg"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center p-12 text-theme-muted font-medium">No Prescriptions Found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <Pagination pageCount={pageCount} onPageChange={({ selected }) => setCurrentPage(selected)} forcePage={currentPage} />
                </div>
              </div>
            )}

            {/* PRINT & PREVIEW OVERLAY MODAL */}
            {showPrintModal && selectedPrescription && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-white text-slate-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative my-8">
                  
                  {/* Prescription Slip layout */}
                  <div id="prescription-slip" className="border-2 border-slate-200 p-6 rounded-2xl bg-slate-50">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-blue-500 pb-4 mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-blue-600">🏥 City General Hospital</h2>
                        <p className="text-xs text-slate-500">123 Healthcare Ave, Medical District</p>
                      </div>
                      <div className="text-right">
                        <h3 className="text-xs font-semibold text-slate-600">PRESCRIPTION SLIP</h3>
                        <p className="text-xs font-mono">PRE-{String(selectedPrescription.id).padStart(4, "0")}</p>
                        <p className="text-xs text-slate-500">{new Date(selectedPrescription.prescription_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div>
                        <p className="text-slate-500">Patient Details</p>
                        <p className="font-semibold text-slate-800">{patients.find(p => p.id === selectedPrescription.patient)?.name || selectedPrescription.patient_name}</p>
                        <p className="text-xs text-slate-600">
                          {patients.find(p => p.id === selectedPrescription.patient) 
                            ? `Age: ${patients.find(p => p.id === selectedPrescription.patient).age} | Gender: ${patients.find(p => p.id === selectedPrescription.patient).gender}`
                            : ""
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">Prescribing Doctor</p>
                        <p className="font-semibold text-slate-800">Dr. {doctors.find(d => d.id === selectedPrescription.doctor)?.name || selectedPrescription.doctor_name}</p>
                        <p className="text-xs text-slate-600">{doctors.find(d => d.id === selectedPrescription.doctor)?.specialization}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Diagnosis</p>
                      <div className="bg-slate-100 p-3 rounded-lg text-sm italic text-slate-700">
                        {selectedPrescription.diagnosis}
                      </div>
                    </div>

                    {/* Medicines Table */}
                    <div className="mb-8">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Rx Medicines</p>
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-300 text-slate-500 text-xs">
                            <th className="pb-2">Medicine Name</th>
                            <th className="pb-2">Dosage</th>
                            <th className="pb-2">Frequency</th>
                            <th className="pb-2">Duration</th>
                            <th className="pb-2">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedPrescription.medicines.map((m, idx) => {
                            const mName = inventory.find(i => i.id === m.medicine)?.name || m.medicine_name;
                            return (
                              <tr key={idx} className="text-slate-800">
                                <td className="py-2.5 font-medium">{mName}</td>
                                <td className="py-2.5">{m.dosage}</td>
                                <td className="py-2.5">{m.frequency}</td>
                                <td className="py-2.5">{m.duration} Days</td>
                                <td className="py-2.5 text-xs text-slate-500 font-semibold">{m.instructions}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Signature */}
                    <div className="flex justify-end pt-8">
                      <div className="text-center w-48 border-t border-slate-300 pt-1 text-xs text-slate-500">
                        Doctor's Signature
                      </div>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => downloadSinglePdf(selectedPrescription)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <FileText size={18} /> Download PDF
                    </button>
                    <button
                      onClick={() => {
                        const printContent = document.getElementById("prescription-slip").innerHTML;
                        const originalContent = document.body.innerHTML;
                        document.body.innerHTML = printContent;
                        window.print();
                        document.body.innerHTML = originalContent;
                        window.location.reload();
                      }}
                      className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <Printer size={18} /> Print Slip
                    </button>
                    <button
                      onClick={() => setShowPrintModal(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-slate-800 py-3 rounded-lg font-semibold transition"
                    >
                      Close
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* CONFIRM DELETE DIALOG */}
            <ConfirmDialog
              isOpen={confirmDeleteOpen}
              title="Delete Prescription"
              message="Are you sure you want to delete this prescription? This action cannot be undone."
              onConfirm={confirmDelete}
              onCancel={() => setConfirmDeleteOpen(false)}
              confirmText="Delete"
              cancelText="Cancel"
            />

          </div>
        </div>
      </div>
    </div>
  );
}

export default Prescriptions;
