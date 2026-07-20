import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import Spinner from "../Components/Spinner";
import { toast } from "react-toastify";
import { Calendar as CalendarIcon, Clock, User, Filter, Search, Plus, Trash, Edit } from "lucide-react";
import "../theme-utils.css";

function AppointmentCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const role = localStorage.getItem("userRole");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formIsEditing, setFormIsEditing] = useState(false);
  const [formAppointmentId, setFormAppointmentId] = useState(null);
  const [formDoctor, setFormDoctor] = useState("");
  const [formPatient, setFormPatient] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formStatus, setFormStatus] = useState("Pending");

  // Refs for custom popup alignment
  const formDateRef = useRef(null);
  const formTimeRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Fetch appointments
      const apptRes = await fetch("https://hospital-management-system-6jw8.onrender.com/api/appointments/", { headers });
      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(data);
      }

      // Fetch doctors
      const docRes = await fetch("https://hospital-management-system-6jw8.onrender.com/api/doctors/", { headers });
      if (docRes.ok) {
        const data = await docRes.json();
        setDoctors(data);
      }

      // Fetch patients
      const patRes = await fetch("https://hospital-management-system-6jw8.onrender.com/api/patients/", { headers });
      if (patRes.ok) {
        const data = await patRes.json();
        setPatients(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load initial calendar data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const apptRes = await fetch("https://hospital-management-system-6jw8.onrender.com/api/appointments/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Status color mapper
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#f59e0b"; // Yellow
      case "Confirmed":
        return "#3b82f6"; // Blue
      case "Completed":
        return "#10b981"; // Green
      case "Cancelled":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  };

  // Rescheduling handler (Drag and Drop / Resize)
  const handleEventChange = async (changeInfo) => {
    if (role === "Doctor") {
      toast.error("Access Denied: Doctors cannot reschedule appointments.");
      changeInfo.revert();
      return;
    }

    const { event } = changeInfo;
    const apptId = event.id;
    
    // Extract new date and time
    const start = event.start;
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, "0");
    const day = String(start.getDate()).padStart(2, "0");
    const newDate = `${year}-${month}-${day}`;

    const hours = String(start.getHours()).padStart(2, "0");
    const minutes = String(start.getMinutes()).padStart(2, "0");
    const newTime = `${hours}:${minutes}:00`;

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const appt = appointments.find(a => String(a.id) === String(apptId));
      
      const res = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/appointments/${apptId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor: appt.doctor,
          patient: appt.patient,
          appointment_date: newDate,
          appointment_time: newTime,
          status: appt.status || "Pending",
        }),
      });

      if (res.ok) {
        toast.success("Appointment Rescheduled Successfully");
        window.dispatchEvent(new Event('crud-operation'));
        fetchAppointments();
      } else {
        toast.error("Failed to reschedule appointment");
        changeInfo.revert();
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during rescheduling.");
      changeInfo.revert();
    } finally {
      setLoading(false);
    }
  };

  // Add Appointment submission
  const saveAppointment = async () => {
    if (!formDoctor || !formPatient || !formDate || !formTime) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const url = formIsEditing 
        ? `https://hospital-management-system-6jw8.onrender.com/api/appointments/${formAppointmentId}/`
        : "https://hospital-management-system-6jw8.onrender.com/api/appointments/";
      const method = formIsEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor: formDoctor,
          patient: formPatient,
          appointment_date: formDate,
          appointment_time: formTime,
          status: formStatus,
        }),
      });

      if (res.ok) {
        toast.success(formIsEditing ? "Appointment Updated Successfully" : "Appointment Added Successfully");
        window.dispatchEvent(new Event('crud-operation'));
        setFormModalOpen(false);
        setDetailModalOpen(false);
        fetchAppointments();
      } else {
        toast.error(formIsEditing ? "Failed to Update Appointment" : "Failed to Add Appointment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save appointment.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Appointment
  const deleteAppointment = async (apptId) => {
    if (role === "Doctor") {
      toast.error("Access Denied: Doctors cannot delete appointments.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this appointment?")) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/appointments/${apptId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Appointment Deleted Successfully");
        window.dispatchEvent(new Event('crud-operation'));
        setDetailModalOpen(false);
        fetchAppointments();
      } else {
        toast.error("Failed to delete appointment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete appointment.");
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Form Modal from Detail Modal
  const handleEditClick = () => {
    if (!selectedEvent) return;
    setFormAppointmentId(selectedEvent.id);
    setFormDoctor(selectedEvent.doctor);
    setFormPatient(selectedEvent.patient);
    setFormDate(selectedEvent.appointment_date);
    setFormTime(selectedEvent.appointment_time);
    setFormStatus(selectedEvent.status);
    setFormIsEditing(true);
    setFormModalOpen(true);
  };

  // Open Add Form Modal from Calendar Blank Click
  const handleDateClick = (arg) => {
    if (role === "Doctor") {
      toast.error("Access Denied: Doctors cannot create appointments.");
      return;
    }
    setFormAppointmentId(null);
    setFormDoctor("");
    setFormPatient("");
    setFormDate(arg.dateStr);
    setFormTime("09:00");
    setFormStatus("Pending");
    setFormIsEditing(false);
    setFormModalOpen(true);
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appt) => {
    const docObj = doctors.find((d) => d.id === appt.doctor);
    const patObj = patients.find((p) => p.id === appt.patient);
    const docName = docObj ? docObj.name.toLowerCase() : "";
    const patName = patObj ? patObj.name.toLowerCase() : "";
    const query = searchQuery.toLowerCase();

    // Text Search
    if (searchQuery && !docName.includes(query) && !patName.includes(query)) return false;

    // Doctor filter
    if (selectedDoctor && String(appt.doctor) !== String(selectedDoctor)) return false;

    // Patient filter
    if (selectedPatient && String(appt.patient) !== String(selectedPatient)) return false;

    // Status filter
    if (selectedStatus && appt.status !== selectedStatus) return false;

    // Date range filter
    if (startDate && appt.appointment_date < startDate) return false;
    if (endDate && appt.appointment_date > endDate) return false;

    return true;
  });

  // Map filtered appointments to FullCalendar events format
  const events = filteredAppointments.map((appt) => {
    const docObj = doctors.find((d) => d.id === appt.doctor);
    const patObj = patients.find((p) => p.id === appt.patient);
    const docName = docObj ? docObj.name : "Doctor";
    const patName = patObj ? patObj.name : "Patient";
    
    // ISO format date/time string: YYYY-MM-DDTHH:MM:SS
    const startIso = `${appt.appointment_date}T${appt.appointment_time}`;
    
    return {
      id: appt.id,
      title: `Pat: ${patName} | Doc: ${docName}`,
      start: startIso,
      backgroundColor: getStatusColor(appt.status),
      borderColor: getStatusColor(appt.status),
      extendedProps: {
        ...appt,
        doctorName: docName,
        patientName: patName,
      },
    };
  });

  // Calculate Metrics
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Week calculations
  const today = new Date();
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  const startOfWeekStr = firstDayOfWeek.toISOString().split("T")[0];
  const endOfWeekStr = lastDayOfWeek.toISOString().split("T")[0];

  // Month calculations
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const endOfMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${lastDayOfMonth}`;

  const todayCount = appointments.filter(a => a.appointment_date === todayStr).length;
  const weekCount = appointments.filter(a => a.appointment_date >= startOfWeekStr && a.appointment_date <= endOfWeekStr).length;
  const monthCount = appointments.filter(a => a.appointment_date >= startOfMonthStr && a.appointment_date <= endOfMonthStr).length;

  return (
    <div className="flex min-h-screen bg-theme-primary">
      <Sidebar />
      {loading && <Spinner />}

      <div className="flex-1">
        <Navbar />

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-theme-primary">Appointment Calendar</h1>
              <p className="text-sm text-theme-muted">Drag and drop, filter, and schedule appointments instantly.</p>
            </div>
            {role !== "Doctor" && (
              <button
                onClick={() => {
                  setFormAppointmentId(null);
                  setFormDoctor("");
                  setFormPatient("");
                  setFormDate(new Date().toISOString().split("T")[0]);
                  setFormTime("09:00");
                  setFormStatus("Pending");
                  setFormIsEditing(false);
                  setFormModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 shadow-theme-lg transition active:scale-95 cursor-pointer"
              >
                <Plus size={18} /> Add Appointment
              </button>
            )}
          </div>

          {/* Metrics cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-theme-muted font-semibold uppercase tracking-wider">Today's Appointments</p>
                <p className="text-3xl font-extrabold text-theme-primary mt-1">{todayCount}</p>
              </div>
              <div className="text-blue-600 dark:text-blue-400">
                <CalendarIcon size={28} />
              </div>
            </div>
            <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-theme-muted font-semibold uppercase tracking-wider">This Week's Appointments</p>
                <p className="text-3xl font-extrabold text-theme-primary mt-1">{weekCount}</p>
              </div>
              <div className="text-green-600 dark:text-green-400">
                <Clock size={28} />
              </div>
            </div>
            <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-theme-muted font-semibold uppercase tracking-wider">This Month's Appointments</p>
                <p className="text-3xl font-extrabold text-theme-primary mt-1">{monthCount}</p>
              </div>
              <div className="text-purple-600 dark:text-purple-400">
                <User size={28} />
              </div>
            </div>
          </div>

          {/* Filters card */}
          <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-theme-md space-y-4">
            <div className="flex items-center gap-2 border-b border-theme pb-3">
              <Filter className="text-blue-600 dark:text-blue-400" size={18} />
              <h2 className="text-lg font-bold text-theme-primary">Filters & Search</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search input */}
              <div className="relative col-span-1 sm:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={18} />
                <input
                  type="text"
                  placeholder="Search Patient/Doctor name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-theme-strong bg-theme-input text-theme-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-theme-muted"
                />
              </div>

              {/* Doctor filter */}
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full border border-theme-strong bg-theme-input text-theme-primary rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Doctors</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>

              {/* Patient filter */}
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full border border-theme-strong bg-theme-input text-theme-primary rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Patients</option>
                {patients.map((pat) => (
                  <option key={pat.id} value={pat.id}>{pat.name}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-theme-strong bg-theme-input text-theme-primary rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>

              {/* Reset filter button */}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDoctor("");
                  setSelectedPatient("");
                  setSelectedStatus("");
                  setStartDate("");
                  setEndDate("");
                }}
                className="w-full border border-theme-strong bg-theme-tertiary text-theme-primary font-semibold rounded-xl py-2 hover:bg-theme-hover active:scale-95 transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>

            {/* Date range row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm text-theme-muted font-medium w-16">Start:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-theme-strong bg-theme-input text-theme-primary rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-theme-muted font-medium w-16">End:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-theme-strong bg-theme-input text-theme-primary rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Calendar Body */}
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-xl backdrop-blur-xl">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              editable={role !== "Doctor"}
              selectable={role !== "Doctor"}
              selectMirror={true}
              dayMaxEvents={true}
              eventClick={(info) => {
                const props = info.event.extendedProps;
                setSelectedEvent({
                  id: info.event.id,
                  doctor: props.doctor,
                  patient: props.patient,
                  doctorName: props.doctorName,
                  patientName: props.patientName,
                  appointment_date: props.appointment_date,
                  appointment_time: props.appointment_time,
                  status: props.status,
                });
                setDetailModalOpen(true);
              }}
              dateClick={handleDateClick}
              eventDrop={handleEventChange}
              eventResize={handleEventChange}
              height="auto"
            />
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {detailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-overlay px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-theme-card p-6 shadow-2xl border border-theme backdrop-blur-2xl">
            <div className="flex justify-between items-center border-b border-theme pb-3 mb-4">
              <h2 className="text-xl font-bold text-theme-primary">Appointment Info</h2>
              <span
                style={{ backgroundColor: getStatusColor(selectedEvent.status) + "22", color: getStatusColor(selectedEvent.status) }}
                className="px-3 py-1 rounded-full text-xs font-semibold"
              >
                {selectedEvent.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <User className="text-blue-500" size={20} />
                <div>
                  <p className="text-xs text-theme-muted">Patient</p>
                  <p className="text-theme-primary font-semibold">{selectedEvent.patientName}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <User className="text-indigo-500" size={20} />
                <div>
                  <p className="text-xs text-theme-muted">Doctor</p>
                  <p className="text-theme-primary font-semibold">{selectedEvent.doctorName}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CalendarIcon className="text-emerald-500" size={20} />
                <div>
                  <p className="text-xs text-theme-muted">Date</p>
                  <p className="text-theme-primary font-semibold">{selectedEvent.appointment_date}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="text-amber-500" size={20} />
                <div>
                  <p className="text-xs text-theme-muted">Time</p>
                  <p className="text-theme-primary font-semibold">{selectedEvent.appointment_time}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-theme pt-4">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="rounded-lg border border-theme bg-theme-card px-4 py-2 text-theme-primary hover:bg-theme-hover transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleEditClick}
                  className="rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit size={16} /> {role === "Doctor" ? "Update Status" : "Edit"}
                </button>
                {role !== "Doctor" && (
                  <button
                    onClick={() => deleteAppointment(selectedEvent.id)}
                    className="rounded-lg bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash size={16} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Add / Edit) */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-overlay px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-theme-card p-6 shadow-2xl border border-theme backdrop-blur-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-theme-primary">
              {formIsEditing ? (role === "Doctor" ? "Update Status" : "Update Appointment") : "Add Appointment"}
            </h2>
            <div className="space-y-4">
              {/* Doctor Selection */}
              <div>
                <label className="block text-xs text-theme-muted font-semibold mb-1">Doctor</label>
                <select
                  disabled={role === "Doctor"}
                  value={formDoctor}
                  onChange={(e) => setFormDoctor(e.target.value)}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary disabled:opacity-60"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>

              {/* Patient Selection */}
              <div>
                <label className="block text-xs text-theme-muted font-semibold mb-1">Patient</label>
                <select
                  disabled={role === "Doctor"}
                  value={formPatient}
                  onChange={(e) => setFormPatient(e.target.value)}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary disabled:opacity-60"
                >
                  <option value="">Select Patient</option>
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>{pat.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs text-theme-muted font-semibold mb-1">Date</label>
                <div className="custom-picker-container relative w-full border border-theme-strong rounded-lg bg-theme-input text-theme-primary flex items-center p-3">
                  <input
                    type="text"
                    readOnly
                    placeholder="Select Date"
                    value={formDate}
                    onClick={() => role !== 'Doctor' && formDateRef.current && formDateRef.current.showPicker()}
                    className="flex-1 bg-transparent border-none outline-none text-theme-primary cursor-pointer disabled:opacity-60"
                    disabled={role === 'Doctor'}
                  />
                  <input
                    ref={formDateRef}
                    disabled={role === 'Doctor'}
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="absolute right-3 w-6 h-6 opacity-0 cursor-pointer z-10 disabled:cursor-default"
                  />
                  <CalendarIcon className="text-theme-muted pointer-events-none ml-2" size={18} />
                </div>
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-xs text-theme-muted font-semibold mb-1">Time</label>
                <div className="custom-picker-container relative w-full border border-theme-strong rounded-lg bg-theme-input text-theme-primary flex items-center p-3">
                  <input
                    type="text"
                    readOnly
                    placeholder="Select Time"
                    value={formTime}
                    onClick={() => role !== 'Doctor' && formTimeRef.current && formTimeRef.current.showPicker()}
                    className="flex-1 bg-transparent border-none outline-none text-theme-primary cursor-pointer disabled:opacity-60"
                    disabled={role === 'Doctor'}
                  />
                  <input
                    ref={formTimeRef}
                    disabled={role === 'Doctor'}
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="absolute right-3 w-6 h-6 opacity-0 cursor-pointer z-10 disabled:cursor-default"
                  />
                  <Clock className="text-theme-muted pointer-events-none ml-2" size={18} />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs text-theme-muted font-semibold mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                >
                  <option>Pending</option>
                  <option>Confirmed</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={saveAppointment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold active:scale-95 transition cursor-pointer"
                >
                  {formIsEditing ? (role === "Doctor" ? "Update Status" : "Update Appointment") : "Add Appointment"}
                </button>
                <button
                  onClick={() => setFormModalOpen(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold active:scale-95 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentCalendar;
