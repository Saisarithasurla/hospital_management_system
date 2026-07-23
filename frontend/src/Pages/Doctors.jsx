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
function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("Available");
  const [phoneError, setPhoneError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteDoctorId, setDeleteDoctorId] = useState(null);
  const role = localStorage.getItem("userRole");
  const isAdmin = role === "Admin";
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  useEffect(() => {
    fetchDoctors();
  }, [search, statusFilter]);
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      let url = "https://hospital-management-system-6jw8.onrender.com/api/doctors/";
      const queryParams = [];
      if (search) {
        queryParams.push(`search=${encodeURIComponent(search)}`);
      }
      if (statusFilter && statusFilter !== "All") {
        queryParams.push(`availability_status=${encodeURIComponent(statusFilter)}`);
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        toast.error('Failed to fetch doctors');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };
  const addDoctor = async () => {
    setPhoneError("");
    if (phone.length !== 10) {
      setPhoneError("Phone Number must be exactly 10 digits.");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch(
        "https://hospital-management-system-6jw8.onrender.com/api/doctors/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            specialization,
            phone,
            availability_status: availabilityStatus,
          }),
        }
      ); if (response.ok) {
        toast.success('Doctor Added Successfully');
        window.dispatchEvent(new Event('crud-operation'));
        setName("");
        setSpecialization("");
        setPhone("");
        setAvailabilityStatus("Available");
        setEditingId(null);
        setIsEditing(false);
        setShowForm(false);
        fetchDoctors();
      } else {
        toast.error('Failed to Add Doctor');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to Add Doctor');
    } finally {
      setLoading(false);
    }
  };
  const editDoctor = (doctor) => {
    setShowForm(true); setIsEditing(true); setEditingId(doctor.id); setName(doctor.name || ""); setSpecialization(doctor.specialization || ""); setPhone(doctor.phone || ""); setAvailabilityStatus(doctor.availability_status || "Available"); setPhoneError("");
  };
  const updateDoctor = async () => {
    if (!editingId) return;
    setPhoneError("");
    if (phone.length !== 10) {
      setPhoneError("Phone Number must be exactly 10 digits.");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch(
        `https://hospital-management-system-6jw8.onrender.com/api/doctors/${editingId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            specialization,
            phone,
            availability_status: availabilityStatus
          }),
        }
      );
      if (response.ok) {
        if (availabilityStatus === "Busy") {
          toast.success("Doctor Marked as Busy");
        } else if (availabilityStatus === "On Leave") {
          toast.success("Doctor Marked as On Leave");
        } else {
          toast.success("Availability Updated Successfully");
        }
        window.dispatchEvent(new Event('crud-operation'));
        setName("");
        setSpecialization("");
        setPhone("");
        setAvailabilityStatus("Available");
        setEditingId(null);
        setIsEditing(false);
        setShowForm(false);
        fetchDoctors();
      } else {
        toast.error('Failed to Update Doctor');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to Update Doctor');
    } finally {
      setLoading(false);
    }
  };
  const updateAvailabilityInline = async (id, newStatus) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const doc = doctors.find(d => d.id === id);
      if (!doc) return;
      const response = await fetch(
        `https://hospital-management-system-6jw8.onrender.com/api/doctors/${id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: doc.name,
            specialization: doc.specialization,
            phone: doc.phone,
            availability_status: newStatus
          }),
        }
      );
      if (response.ok) {
        if (newStatus === "Busy") {
          toast.success("Doctor Marked as Busy");
        } else if (newStatus === "On Leave") {
          toast.success("Doctor Marked as On Leave");
        } else {
          toast.success("Availability Updated Successfully");
        }
        window.dispatchEvent(new Event('crud-operation'));
        fetchDoctors();
      } else {
        toast.error('Failed to Update Status');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to Update Status');
    } finally {
      setLoading(false);
    }
  };
  const requestDeleteDoctor = (id) => {
    setDeleteDoctorId(id);
    setConfirmDeleteOpen(true);
  };
  const handleConfirmDeleteDoctor = async () => {
    setConfirmDeleteOpen(false);
    if (!deleteDoctorId) return;
    await deleteDoctor(deleteDoctorId);
    setDeleteDoctorId(null);
  };
  const cancelDeleteDoctor = () => {
    setConfirmDeleteOpen(false);
    setDeleteDoctorId(null);
  };
  const deleteDoctor = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/doctors/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok || response.status === 204) {
        toast.success('Doctor deleted');
        window.dispatchEvent(new Event('crud-operation'));
        fetchDoctors();
      } else {
        toast.error('Failed to delete doctor');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete doctor');
    } finally {
      setLoading(false);
    }
  };
  const exportPdf = () => {
    const doc = new jsPDF();
    const headers = [["ID", "Name", "Specialization", "Phone", "Availability"]];
    const rows = currentDoctors.map((doctor) => [
      doctor.id,
      doctor.name,
      doctor.specialization,
      doctor.phone,
      doctor.availability_status || "Available",
    ]);
    doc.text("Doctors Report", 14, 20);
    autoTable(doc, { head: headers, body: rows, startY: 28 });
    doc.save("doctors-report.pdf");
    toast.success('PDF downloaded');
  };
  const exportExcel = () => {
    const rows = currentDoctors.map((doctor) => ({ ID: doctor.id, Name: doctor.name, Specialization: doctor.specialization, Phone: doctor.phone, Availability: doctor.availability_status || "Available", }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doctors');
    XLSX.writeFile(workbook, 'doctors-report.xlsx');
    toast.success('Excel downloaded');
  };
  const pageCount = Math.ceil(doctors.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentDoctors = doctors.slice(offset, offset + itemsPerPage);
  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case "Busy":
        return <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">🟡 Busy</span>;
      case "On Leave":
        return <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold">🔴 On Leave</span>;
      default:
        return <span className="bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold">🟢 Available</span>;
    }
  };
  return (
    <div className="flex min-h-screen bg-theme-primary page-doctors">
      <Sidebar />
      {loading && <Spinner />}
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          <div className="flex flex-col gap-6 mb-8 bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
            <div className="flex flex-col gap-1 w-full">
              <h1 className="text-3xl font-bold text-theme-primary">Doctors</h1>
              <p className="text-sm text-theme-muted">Create, edit, and filter doctor availability records.</p>
            </div>
            <div className="flex flex-wrap gap-3 items-center w-full">
              <input type="text" placeholder="Search by name or specialty..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} className="w-72 border border-theme-strong bg-theme-input rounded-3xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 text-theme-primary placeholder:text-theme-muted" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }} className="border border-theme-strong bg-theme-input rounded-3xl px-3 py-2 text-theme-primary">
                <option value="All">All Availability</option>
                <option value="Available">🟢 Available</option>
                <option value="Busy">🟡 Busy</option>
                <option value="On Leave">🔴 On Leave</option>
              </select>
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(0); }} className="border border-theme-strong bg-theme-input rounded-3xl px-3 py-2 text-theme-primary">
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
              </select>
              <button type="button" onClick={exportPdf} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-3xl transition hover:-translate-y-0.5">Export PDF</button>
              <button type="button" onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-3xl transition hover:-translate-y-0.5">Export Excel</button>
              {isAdmin && !showForm && (
                <button onClick={() => { setShowForm(true); setIsEditing(false); setEditingId(null); setName(""); setSpecialization(""); setPhone(""); setAvailabilityStatus("Available"); setPhoneError(""); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"> + Add Doctor
                </button>
              )}
            </div>
          </div>
          {showForm ? (
            <div className="max-w-xl mx-auto bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8">
              <h2 className="text-3xl font-bold text-center mb-8 text-theme-primary">{isEditing ? "Update Doctor" : "Add Doctor"}</h2>
              <div className="space-y-5">
                <input type="text" placeholder="Doctor Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary placeholder:text-theme-muted" />
                <input type="text" placeholder="Specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary placeholder:text-theme-muted" />
                <div>
                  <input type="text" placeholder="Phone Number" value={phone} maxLength={10} onChange={(e) => { const value = e.target.value.replace(/\D/g, ""); setPhone(value); setPhoneError(""); }} className={`w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary placeholder:text-theme-muted ${phoneError ? "border-red-500" : ""}`} />
                  {phoneError && (
                    <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-theme-secondary">Availability Status</label>
                    <select value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary">
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-4">
                  <button onClick={isEditing ? updateDoctor : addDoctor} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">
                    {isEditing ? "Update Doctor" : "Add Doctor"}</button>
                  <button onClick={() => { setShowForm(false); setIsEditing(false); setEditingId(null); setName(""); setSpecialization(""); setPhone(""); setAvailabilityStatus("Available"); setPhoneError(""); }} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg" > Cancel </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="p-4 text-left text-theme-primary">ID</th>
                      <th className="p-4 text-left text-theme-primary">Doctor Name</th>
                      <th className="p-4 text-left text-theme-primary">Specialization</th>
                      <th className="p-4 text-left text-theme-primary">Phone</th>
                      <th className="p-4 text-left text-theme-primary">Availability Status</th>
                      {isAdmin && (
                        <th className="p-4 text-center text-theme-primary">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.length > 0 ? (
                      currentDoctors.map((doctor) => (
                        <tr key={doctor.id} className="border-t border-theme hover:bg-theme-hover text-theme-primary">
                          <td className="p-4">{doctor.id}</td>
                          <td className="p-4 font-bold">{doctor.name}</td>
                          <td className="p-4">{doctor.specialization}</td>
                          <td className="p-4">{doctor.phone}</td>
                          <td className="p-4">
                            {isAdmin ? (
                              <select value={doctor.availability_status || "Available"} onChange={(e) => updateAvailabilityInline(doctor.id, e.target.value)} className="bg-transparent border border-theme-strong rounded-xl px-2 py-1 text-xs font-semibold focus:ring-0 cursor-pointer outline-none text-theme-primary bg-theme-input"> <option value="Available">🟢 Available</option>
                                <option value="Busy">🟡 Busy</option>
                                <option value="On Leave">🔴 On Leave</option>
                              </select>
                            ) : (
                              getStatusBadge(doctor.availability_status)
                            )}
                          </td>
                          {isAdmin && (<td className="p-4 text-center">
                            <button onClick={() => editDoctor(doctor)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded mr-2">Edit</button>
                            <button onClick={() => requestDeleteDoctor(doctor.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded">Delete</button>
                          </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 5} className="text-center p-8 text-theme-muted">No Doctors Found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination pageCount={pageCount} onPageChange={({ selected }) => setCurrentPage(selected)} forcePage={currentPage} />
            </div>
          )}
        </div>
        <ConfirmDialog isOpen={confirmDeleteOpen} title="Delete Doctor" message="Are you sure you want to delete this doctor? This action cannot be undone." onConfirm={handleConfirmDeleteDoctor} onCancel={cancelDeleteDoctor} confirmText="Delete" cancelText="Cancel" />
      </div>
    </div>
  );
} export default Doctors;