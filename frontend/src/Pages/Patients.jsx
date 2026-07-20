import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
function Patients() {
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const role = localStorage.getItem("userRole");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [ageError, setAgeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState(null);
  useEffect(() => {
    fetchPatients();
  }, []);
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
      } else {
        toast.error('Failed to fetch patients');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };
  const addPatient = async () => {
    setPhoneError("");
    setAgeError("");

    if (!/^\d{10}$/.test(phone)) {
      setPhoneError("Phone Number must be exactly 10 digits.");
      return;
    }
    if (age < 1 || age > 120) {
      setAgeError("Enter a valid age.");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/patients/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          age,
          gender,
          phone,
        }),
      });
      if (response.ok) {
        toast.success('Patient Added Successfully');
        window.dispatchEvent(new Event('crud-operation'));
        setName("");
        setAge("");
        setGender("");
        setPhone("");
        setEditingId(null);
        setIsEditing(false);
        setShowForm(false);
        fetchPatients();
      } else {
        toast.error('Failed to Add Patient');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to Add Patient');
    } finally {
      setLoading(false);
    }
  };
  const editPatient = (patient) => {
    setName(patient.name);
    setAge(patient.age);
    setGender(patient.gender);
    setPhone(patient.phone);
    setEditingId(patient.id);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const updatePatient = async () => {
    setPhoneError("");
    setAgeError("");
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError("Phone Number must be exactly 10 digits.");
      return;
    }
    if (age < 1 || age > 120) {
      setAgeError("Enter a valid age.");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch(
        `https://hospital-management-system-6jw8.onrender.com/api/patients/${editingId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            age,
            gender,
            phone,
          }),
        }
      );
      if (response.ok) {
        toast.success('Patient Updated Successfully');
        window.dispatchEvent(new Event('crud-operation'));
        setName("");
        setAge("");
        setGender("");
        setPhone("");
        setEditingId(null);
        setIsEditing(false);
        setShowForm(false);
        fetchPatients();
      } else {
        toast.error('Failed to Update Patient');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to Update Patient');
    } finally {
      setLoading(false);
    }
  };
  const requestDeletePatient = (id) => {
    setDeletePatientId(id);
    setConfirmDeleteOpen(true);
  };
  const handleConfirmDeletePatient = async () => {
    setConfirmDeleteOpen(false);
    if (!deletePatientId) return;
    await deletePatient(deletePatientId);
    setDeletePatientId(null);
  };
  const cancelDeletePatient = () => {
    setConfirmDeleteOpen(false);
    setDeletePatientId(null);
  };

  const deletePatient = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch(
        `https://hospital-management-system-6jw8.onrender.com/api/patients/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        toast.success('Patient Deleted Successfully');
        window.dispatchEvent(new Event('crud-operation'));
        fetchPatients();
      } else {
        toast.error('Failed to Delete Patient');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to Delete Patient');
    } finally {
      setLoading(false);
    }
  };
  const exportPdf = () => {
    const doc = new jsPDF();
    const headers = [["ID", "Name", "Age", "Gender", "Phone"]];
    const rows = currentPatients.map((patient) => [patient.id, patient.name, patient.age, patient.gender, patient.phone,
    ]);
    doc.text("Patients Report", 14, 20);
    autoTable(doc, { head: headers, body: rows, startY: 28 });
    doc.save("patients-report.pdf");
    toast.success('PDF downloaded');
  };
  const exportExcel = () => {
    const rows = currentPatients.map((patient) => ({
      ID: patient.id,
      Name: patient.name,
      Age: patient.age,
      Gender: patient.gender,
      Phone: patient.phone,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
    XLSX.writeFile(workbook, 'patients-report.xlsx');
    toast.success('Excel downloaded');
  };
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(search.toLowerCase()) ||
    patient.gender.toLowerCase().includes(search.toLowerCase()) ||
    patient.phone.includes(search) ||
    patient.age.toString().includes(search)
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageCount = Math.ceil(filteredPatients.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentPatients = filteredPatients.slice(offset, offset + itemsPerPage);
  return (
    <div className="flex min-h-screen bg-theme-primary">
      {loading && <Spinner />}
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          <div className="flex flex-col gap-6 justify-between items-start mb-8 bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
              <div>
                <h1 className="text-3xl font-bold text-theme-primary">Patients</h1>
                <p className="text-sm text-theme-muted">Manage patients, export records, and search quickly.</p>
              </div>
              <div className="flex items-center gap-3 flex-nowrap">
                <input type="text" placeholder="Search Patient..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} className="w-72 border border-theme-strong bg-theme-input rounded-3xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 text-theme-primary placeholder:text-theme-muted" />
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(0); }} className="border border-theme-strong bg-theme-input rounded-3xl px-3 py-2 text-theme-primary">
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                </select>
                <button type="button" onClick={exportPdf} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-3xl transition hover:-translate-y-0.5">Export PDF</button>
                <button type="button" onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-3xl transition hover:-translate-y-0.5">Export Excel</button>
                {role !== "Doctor" && !showForm && (
                  <button onClick={() => { setShowForm(true); setIsEditing(false); setEditingId(null); setName(""); setAge(""); setGender(""); setPhone(""); setPhoneError(""); setAgeError(""); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"> + Add Patient </button>
                )}
              </div>
            </div>
          </div>
          {showForm ? (
            <div className="max-w-xl mx-auto bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8">
              <h2 className="text-3xl font-bold text-center mb-8 text-theme-primary">{isEditing ? "Update Patient" : "Add Patient"}</h2>
              <div className="space-y-5">
                <input type="text" placeholder="Patient Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary placeholder:text-theme-muted" />
                <input type="number" placeholder="Age" value={age} onChange={(e) => { setAge(e.target.value); setAgeError(""); }} className={`w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary placeholder:text-theme-muted ${ageError ? "border-red-500" : ""}`} />
                {ageError && <p className="text-red-500 text-sm">{ageError}</p>}
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary">
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <input type="text" placeholder="Phone Number" value={phone} maxLength={10} onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setPhone(value);
                  setPhoneError("");
                }} className={`w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary placeholder:text-theme-muted ${phoneError ? "border-red-500" : ""}`}
                />
                {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
                <div className="flex gap-4">
                  <button onClick={isEditing ? updatePatient : addPatient} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">
                    {isEditing ? "Update Patient" : "Add Patient"}
                  </button>
                  <button onClick={() => { setShowForm(false); setIsEditing(false); setEditingId(null); setName(""); setAge(""); setGender(""); setPhone(""); setPhoneError(""); setAgeError(""); }} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg" >  Cancel  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="p-4 text-left text-theme-primary">ID</th>
                    <th className="p-4 text-left text-theme-primary">Patient Name</th>
                    <th className="p-4 text-left text-theme-primary">Age</th>
                    <th className="p-4 text-left text-theme-primary">Gender</th>
                    <th className="p-4 text-left text-theme-primary">Phone</th>
                    <th className="p-4 text-center text-theme-primary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length > 0 ? (
                    currentPatients.map((patient) => (
                      <tr key={patient.id} className="border-t border-theme hover:bg-theme-hover text-theme-primary">
                        <td className="p-4">{patient.id}</td>
                        <td className="p-4">{patient.name}</td>
                        <td className="p-4">{patient.age}</td>
                        <td className="p-4">{patient.gender}</td>
                        <td className="p-4">{patient.phone}</td>
                        <td className="p-4 text-center">
                          <Link to={`/patients/${patient.id}/history`} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-semibold mr-2 inline-block transition">History</Link>
                          {role !== "Doctor" && (
                            <>
                              <button onClick={() => editPatient(patient)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs mr-2 transition">Edit</button>
                              <button onClick={() => requestDeletePatient(patient.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs transition">Delete</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-theme-muted">No Patients Found</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination pageCount={pageCount} onPageChange={({ selected }) => setCurrentPage(selected)} forcePage={currentPage} />
            </div>
          )}
          <ConfirmDialog isOpen={confirmDeleteOpen} title="Delete Patient" message="Are you sure you want to delete this patient? This action cannot be undone." onConfirm={handleConfirmDeletePatient} onCancel={cancelDeletePatient} confirmText="Delete" cancelText="Cancel" />
        </div>
      </div>
    </div>
  );
}
export default Patients;