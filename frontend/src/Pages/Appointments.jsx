import { useEffect, useState, useRef } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import "../theme-utils.css";
import Pagination from "../Components/Pagination";
import Spinner from "../Components/Spinner";
import ConfirmDialog from "../Components/ConfirmDialog";
import { toast } from 'react-toastify';
import { Calendar, Clock } from "lucide-react";
function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const role = localStorage.getItem("userRole");
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const [doctor, setDoctor] = useState("");
  const [patient, setPatient] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  useEffect(() => {
    fetchDoctors();
    fetchPatients();
    fetchAppointments();
  }, []);
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://hospital-management-system-6jw8.onrender.com/api/doctors/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      } else {
        toast.error('Failed to fetch doctors');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://hospital-management-system-6jw8.onrender.com/api/patients/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      } else {
        toast.error('Failed to fetch patients');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://hospital-management-system-6jw8.onrender.com/api/appointments/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      } else {
        toast.error('Failed to fetch appointments');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setDoctor("");
    setPatient("");
    setAppointmentDate("");
    setAppointmentTime("");
    setStatus("Pending");
    setEditingId(null);
    setIsEditing(false);
    setShowForm(false);
  };
  const addAppointment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://hospital-management-system-6jw8.onrender.com/api/appointments/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctor, patient, appointment_date: appointmentDate, appointment_time: appointmentTime, status }),
      });
      if (res.ok) {
        toast.success('Appointment Added Successfully');
        window.dispatchEvent(new Event('crud-operation'));
        resetForm();
        fetchAppointments();
      } else {
        toast.error('Failed to Add Appointment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to Add Appointment');
    } finally {
      setLoading(false);
    }
  };
  const updateAppointment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/appointments/${editingId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doctor, patient, appointment_date: appointmentDate, appointment_time: appointmentTime, status }),
      });
      if (res.ok) {
        toast.success('Appointment Updated Successfully');
        window.dispatchEvent(new Event('crud-operation'));
        resetForm();
        fetchAppointments();
      } else {
        toast.error('Failed to Update Appointment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to Update Appointment');
    } finally {
      setLoading(false);
    }
  };
  const requestDeleteAppointment = (id) => {
    setDeleteAppointmentId(id);
    setConfirmDeleteOpen(true);
  };
  const handleConfirmDeleteAppointment = async () => {
    setConfirmDeleteOpen(false);
    if (!deleteAppointmentId) return;
    await deleteAppointment(deleteAppointmentId);
    setDeleteAppointmentId(null);
  };
  const cancelDeleteAppointment = () => {
    setConfirmDeleteOpen(false);
    setDeleteAppointmentId(null);
  };
  const deleteAppointment = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/appointments/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        toast.success('Appointment Deleted Successfully');
        window.dispatchEvent(new Event('crud-operation'));
        fetchAppointments();
      } else {
        toast.error('Failed to Delete Appointment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to Delete Appointment');
    } finally {
      setLoading(false);
    }
  };
  const editAppointment = (appointment) => {
    setDoctor(appointment.doctor);
    setPatient(appointment.patient);
    setAppointmentDate(appointment.appointment_date);
    setAppointmentTime(appointment.appointment_time);
    setStatus(appointment.status || 'Pending');
    setEditingId(appointment.id);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const filteredAppointments = appointments.filter((appointment) => {
    const q = search.toLowerCase();
    return (
      appointment.patient_name?.toLowerCase().includes(q) ||
      appointment.doctor_name?.toLowerCase().includes(q) ||
      appointment.appointment_date?.includes(search) ||
      appointment.status?.toLowerCase().includes(q)
    );
  });
  const pageCount = Math.ceil(filteredAppointments.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentAppointments = filteredAppointments.slice(offset, offset + itemsPerPage);
  return (
    <div className="flex min-h-screen bg-theme-primary page-appointments">
      <Sidebar />
      {loading && <Spinner />}
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          <div className="flex flex-col gap-6 justify-between items-start mb-8 bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
              <div>
                <h1 className="text-3xl font-bold text-theme-primary">Appointments</h1>
                <p className="text-sm text-theme-muted">Book appointments, filter schedules, and manage visits.</p>
              </div>
              <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
                <input type="text" placeholder="Search Appointment..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }} className="w-72 border border-theme-strong bg-theme-input rounded-3xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 text-theme-primary placeholder:text-theme-muted" />
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(0); }} className="border border-theme-strong bg-theme-input rounded-3xl px-3 py-2 text-theme-primary">
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                </select>
                {role !== "Doctor" && !showForm && (
                  <button type="button" onClick={() => { resetForm(); setIsEditing(false); setEditingId(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">+ Add Appointment</button>
                )}
              </div>
            </div>
          </div>
          {showForm ? (<div className="max-w-xl mx-auto bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-theme-primary">{isEditing ? (role === 'Doctor' ? 'Update Status' : 'Update Appointment') : 'Add Appointment'}</h2>
            <div className="space-y-5">
              <select disabled={role === 'Doctor'} value={doctor} onChange={(e) => setDoctor(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary disabled:opacity-60">
                <option value="">Select Doctor</option>
                {doctors.filter(doc => doc.availability_status === "Available" || doc.id === Number(doctor) || doc.id === doctor).map((doc) => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
              </select>
              <select disabled={role === 'Doctor'} value={patient} onChange={(e) => setPatient(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary disabled:opacity-60">
                <option value="">Select Patient</option>
                {patients.map((pat) => <option key={pat.id} value={pat.id}>{pat.name}</option>)}
              </select>
              <div className="custom-picker-container relative w-full border border-theme-strong rounded-lg bg-theme-input text-theme-primary flex items-center p-4">
                <input type="text" readOnly placeholder="Select Date" value={appointmentDate} onClick={() => role !== 'Doctor' && dateInputRef.current && dateInputRef.current.showPicker()}
                  className="flex-1 bg-transparent border-none outline-none text-theme-primary cursor-pointer disabled:opacity-60" disabled={role === 'Doctor'} />
                <input ref={dateInputRef} disabled={role === 'Doctor'} type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)}
                  className="absolute right-4 w-6 h-6 opacity-0 cursor-pointer z-10 disabled:cursor-default" />
                <Calendar className="text-theme-muted pointer-events-none ml-2" size={20} />
              </div>
              <div className="custom-picker-container relative w-full border border-theme-strong rounded-lg bg-theme-input text-theme-primary flex items-center p-4">
                <input type="text" readOnly placeholder="Select Time" value={appointmentTime} onClick={() => role !== 'Doctor' && timeInputRef.current && timeInputRef.current.showPicker()}
                  className="flex-1 bg-transparent border-none outline-none text-theme-primary cursor-pointer disabled:opacity-60" disabled={role === 'Doctor'} />
                <input ref={timeInputRef} disabled={role === 'Doctor'} type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)}
                  className="absolute right-4 w-6 h-6 opacity-0 cursor-pointer z-10 disabled:cursor-default" />
                <Clock className="text-theme-muted pointer-events-none ml-2" size={20} />
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-theme-strong rounded-lg p-4 bg-theme-input text-theme-primary">
                <option>Pending</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
              <div className="flex gap-4">
                <button onClick={isEditing ? updateAppointment : addAppointment} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">{isEditing ? (role === 'Doctor' ? 'Update Status' : 'Update Appointment') : 'Add Appointment'}</button>
                <button onClick={() => { setShowForm(false); setIsEditing(false); setEditingId(null); resetForm(); }} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
          ) : (
            <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="p-4 text-left text-theme-primary mobile-hide">ID</th>
                    <th className="p-4 text-left text-theme-primary mobile-hide">Doctor</th>
                    <th className="p-4 text-left text-theme-primary">Patient</th>
                    <th className="p-4 text-left text-theme-primary">Date</th>
                    <th className="p-4 text-left text-theme-primary mobile-hide">Time</th>
                    <th className="p-4 text-left text-theme-primary">Status</th>
                    <th className="p-4 text-center text-theme-primary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length > 0 ? (
                    currentAppointments.map((appointment) => (
                      <tr key={appointment.id} className="border-t border-theme hover:bg-theme-hover text-theme-primary">
                        <td className="p-4 mobile-hide">{appointment.id}</td>
                        <td className="p-4 mobile-hide">{doctors.find(d => d.id === appointment.doctor)?.name || appointment.doctor_name || appointment.doctor}</td>
                        <td className="p-4">{patients.find(p => p.id === appointment.patient)?.name || appointment.patient_name || appointment.patient}</td>
                        <td className="p-4">{appointment.appointment_date}</td>
                        <td className="p-4 mobile-hide">{appointment.appointment_time}</td>
                        <td className="p-4">{appointment.status}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => editAppointment(appointment)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded mr-2">{role === 'Doctor' ? 'Update Status' : 'Edit'}</button>
                          {role !== "Doctor" && (
                            <button onClick={() => requestDeleteAppointment(appointment.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded">Delete</button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center p-8 text-theme-muted">No Appointments Found</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination pageCount={pageCount} onPageChange={({ selected }) => setCurrentPage(selected)} forcePage={currentPage} />
            </div>)}
          <ConfirmDialog isOpen={confirmDeleteOpen} title="Delete Appointment" message="Are you sure you want to delete this appointment? This action cannot be undone."
            onConfirm={handleConfirmDeleteAppointment} onCancel={cancelDeleteAppointment} confirmText="Delete" cancelText="Cancel" />
        </div>
      </div>
    </div>
  );
}
export default Appointments;