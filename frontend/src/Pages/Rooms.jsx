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
import { Search, Bed as BedIcon, Calendar, CheckCircle, XCircle, AlertCircle, FileSpreadsheet, FileText, ArrowLeftRight, DoorOpen, ListFilter } from 'lucide-react';
import "../theme-utils.css";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const getAuthHeaders = (includeJson = false) => {
  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

function Rooms() {
  const [activeTab, setActiveTab] = useState("rooms");
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState({
    total_rooms: 0,
    available_rooms: 0,
    occupied_rooms: 0,
    available_beds: 0,
    occupied_beds: 0,
  });

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showBedForm, setShowBedForm] = useState(false);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [confirmReleaseOpen, setConfirmReleaseOpen] = useState(false);
  const [releaseAllocationId, setReleaseAllocationId] = useState(null);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("General");
  const [floor, setFloor] = useState("");
  const [numberOfBeds, setNumberOfBeds] = useState("");
  const [chargesPerDay, setChargesPerDay] = useState("");
  const [roomStatus, setRoomStatus] = useState("Available");
  const [editingBedId, setEditingBedId] = useState(null);
  const [bedNumber, setBedNumber] = useState("");
  const [bedRoomId, setBedRoomId] = useState("");
  const [bedType, setBedType] = useState("Standard");
  const [bedStatus, setBedStatus] = useState("Available");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [transferAllocation, setTransferAllocation] = useState(null);
  const [targetBedId, setTargetBedId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRoomType, setFilterRoomType] = useState("");
  const [filterFloor, setFilterFloor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    fetchData();
  }, [activeTab, searchQuery, filterRoomType, filterFloor, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      const statsRes = await fetch(`${API_BASE_URL}/rooms/stats/`, { headers });
      if (statsRes.ok) setStats(await statsRes.json());

      if (activeTab === "rooms") {
        let url = `${API_BASE_URL}/rooms/`;
        const params = [];
        if (searchQuery) params.push(`search=${searchQuery}`);
        if (filterRoomType) params.push(`room_type=${filterRoomType}`);
        if (filterFloor) params.push(`floor=${filterFloor}`);
        if (filterStatus) params.push(`status=${filterStatus}`);
        if (params.length) url += `?${params.join("&")}`;

        const res = await fetch(url, { headers });
        if (res.ok) setRooms(await res.json());
      } else if (activeTab === "beds") {
        let url = `${API_BASE_URL}/beds/`;
        const params = [];
        if (searchQuery) params.push(`search=${searchQuery}`);
        if (filterStatus) params.push(`status=${filterStatus}`);
        if (params.length) url += `?${params.join("&")}`;

        const res = await fetch(url, { headers });
        if (res.ok) setBeds(await res.json());
        
        const roomsRes = await fetch(`${API_BASE_URL}/rooms/`, { headers });
        if (roomsRes.ok) setRooms(await roomsRes.json());
      } else if (activeTab === "allocations") {
        let url = `${API_BASE_URL}/allocations/`;
        if (searchQuery) url += `?search=${searchQuery}`;
        const res = await fetch(url, { headers });
        if (res.ok) setAllocations(await res.json());

        const patientsRes = await fetch(`${API_BASE_URL}/patients/`, { headers });
        if (patientsRes.ok) setPatients(await patientsRes.json());

        const bedsRes = await fetch(`${API_BASE_URL}/beds/?status=Available`, { headers });
        if (bedsRes.ok) setBeds(await bedsRes.json());
      } else if (activeTab === "transfers") {
        let url = `${API_BASE_URL}/transfers/`;
        if (searchQuery) url += `?search=${searchQuery}`;
        const res = await fetch(url, { headers });
        if (res.ok) setTransfers(await res.json());
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load room allocation data");
    } finally {
      setLoading(false);
    }
  };

  const saveRoom = async () => {
    if (!roomNumber || !floor || !numberOfBeds || !chargesPerDay) {
      toast.error("All room details are required");
      return;
    }
    setLoading(true);
    try {
      const url = editingRoomId 
        ? `${API_BASE_URL}/rooms/${editingRoomId}/`
        : `${API_BASE_URL}/rooms/`;
      const method = editingRoomId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          room_number: roomNumber,
          room_type: roomType,
          floor,
          number_of_beds: Number(numberOfBeds),
          charges_per_day: Number(chargesPerDay),
          status: roomStatus,
        }),
      });

      if (res.ok) {
        toast.success(editingRoomId ? "Room updated successfully" : "Room created successfully");
        setShowRoomForm(false);
        setEditingRoomId(null);
        resetRoomForm();
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.room_number?.[0] || "Failed to save room");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save room");
    } finally {
      setLoading(false);
    }
  };

  const editRoom = (room) => {
    setEditingRoomId(room.id);
    setRoomNumber(room.room_number);
    setRoomType(room.room_type);
    setFloor(room.floor);
    setNumberOfBeds(room.number_of_beds);
    setChargesPerDay(room.charges_per_day);
    setRoomStatus(room.status);
    setShowRoomForm(true);
  };

  const resetRoomForm = () => {
    setRoomNumber("");
    setRoomType("General");
    setFloor("");
    setNumberOfBeds("");
    setChargesPerDay("");
    setRoomStatus("Available");
  };

  const saveBed = async () => {
    if (!bedNumber || !bedRoomId || !bedType) {
      toast.error("All bed details are required");
      return;
    }
    setLoading(true);
    try {
      const url = editingBedId 
        ? `${API_BASE_URL}/beds/${editingBedId}/`
        : `${API_BASE_URL}/beds/`;
      const method = editingBedId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          bed_number: bedNumber,
          room: Number(bedRoomId),
          bed_type: bedType,
          status: bedStatus,
        }),
      });

      if (res.ok) {
        toast.success(editingBedId ? "Bed updated successfully" : "Bed added successfully");
        setShowBedForm(false);
        setEditingBedId(null);
        resetBedForm();
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.bed_number?.[0] || "Failed to save bed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save bed");
    } finally {
      setLoading(false);
    }
  };

  const editBed = (bed) => {
    setEditingBedId(bed.id);
    setBedNumber(bed.bed_number);
    setBedRoomId(bed.room);
    setBedType(bed.bed_type);
    setBedStatus(bed.status);
    setShowBedForm(true);
  };

  const resetBedForm = () => {
    setBedNumber("");
    setBedRoomId("");
    setBedType("Standard");
    setBedStatus("Available");
  };

  const requestDelete = (type, id) => {
    setDeleteType(type);
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId || !deleteType) return;
    setConfirmDeleteOpen(false);
    setLoading(true);
    try {
      const url = deleteType === "room" 
        ? `${API_BASE_URL}/rooms/${deleteId}/`
        : `${API_BASE_URL}/beds/${deleteId}/`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        toast.success(`${deleteType.charAt(0).toUpperCase() + deleteType.slice(1)} deleted successfully`);
        fetchData();
      } else {
        toast.error(`Failed to delete ${deleteType}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Deletion failed");
    } finally {
      setLoading(false);
    }
  };

  const allocateBed = async () => {
    if (!selectedPatientId || !selectedBedId) {
      toast.error("Patient and Bed selection are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/allocations/`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          patient: Number(selectedPatientId),
          bed: Number(selectedBedId),
        }),
      });

      if (res.ok) {
        toast.success("Patient allocated to bed successfully");
        setShowAllocationForm(false);
        setSelectedPatientId("");
        setSelectedBedId("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.patient?.[0] || data.bed?.[0] || "Allocation failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Allocation failed");
    } finally {
      setLoading(false);
    }
  };

  const requestRelease = (id) => {
    setReleaseAllocationId(id);
    setConfirmReleaseOpen(true);
  };

  const confirmRelease = async () => {
    if (!releaseAllocationId) return;
    setConfirmReleaseOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/allocations/${releaseAllocationId}/release/`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast.success("Bed released successfully");
        fetchData();
      } else {
        toast.error("Failed to release bed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Release failed");
    } finally {
      setLoading(false);
    }
  };

  const requestTransfer = async (allocation) => {
    setTransferAllocation(allocation);
    setTransferReason("");
    setTargetBedId("");
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/beds/?status=Available`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) setBeds(await res.json());
      setShowTransferForm(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const performTransfer = async () => {
    if (!targetBedId) {
      toast.error("Please select target Bed");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/allocations/${transferAllocation.id}/transfer/`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          to_bed: Number(targetBedId),
          reason: transferReason,
        }),
      });

      if (res.ok) {
        toast.success("Patient transferred successfully");
        setShowTransferForm(false);
        setTransferAllocation(null);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.to_bed?.[0] || "Transfer failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const headers = [["Patient Name", "Bed Number", "Room Number", "Allocation Date"]];
    const rows = allocations.map((a) => [
      a.patient_name,
      a.bed_number,
      a.room_number,
      new Date(a.allocated_at).toLocaleDateString(),
    ]);
    doc.text("Room & Bed Allocations Report", 14, 20);
    autoTable(doc, { head: headers, body: rows, startY: 28 });
    doc.save("bed-allocations-report.pdf");
    toast.success("PDF exported successfully");
  };

  const exportExcel = () => {
    const rows = allocations.map((a) => ({
      "Patient Name": a.patient_name,
      "Bed Number": a.bed_number,
      "Room Number": a.room_number,
      "Allocation Date": new Date(a.allocated_at).toLocaleString(),
      "Status": a.is_active ? "Active" : "Released",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Allocations');
    XLSX.writeFile(workbook, 'bed-allocations-report.xlsx');
    toast.success("Excel exported successfully");
  };

  const getPaginatedList = (list) => {
    const offset = currentPage * itemsPerPage;
    return list.slice(offset, offset + itemsPerPage);
  };

  const getPageCount = (list) => Math.ceil(list.length / itemsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "text-emerald-500 dark:text-emerald-400";
      case "Occupied":
        return "text-amber-500 dark:text-amber-400";
      case "Maintenance":
      case "Reserved":
        return "text-rose-500 dark:text-rose-400";
      default:
        return "text-slate-500 dark:text-slate-400";
    }
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
                <h1 className="text-3xl font-bold text-theme-primary">Room & Bed Management</h1>
                <p className="text-sm text-theme-muted">Manage hospital rooms, bed configurations, allocations, and patient transfers.</p>
              </div>
              <div className="flex gap-2">
                {activeTab === "rooms" && (
                  <button
                    onClick={() => { setShowRoomForm(true); setEditingRoomId(null); resetRoomForm(); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-3xl font-semibold transition hover:-translate-y-0.5"
                  >
                    + Add Room
                  </button>
                )}
                {activeTab === "beds" && (
                  <button
                    onClick={() => { setShowBedForm(true); setEditingBedId(null); resetBedForm(); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-3xl font-semibold transition hover:-translate-y-0.5"
                  >
                    + Add Bed
                  </button>
                )}
                {activeTab === "allocations" && (
                  <button
                    onClick={() => setShowAllocationForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-3xl font-semibold transition hover:-translate-y-0.5"
                  >
                    Assign Bed
                  </button>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard title="Total Rooms" value={stats.total_rooms} color="text-indigo-600 dark:text-indigo-400" />
              <StatCard title="Available Rooms" value={stats.available_rooms} color="text-emerald-500 dark:text-emerald-400" />
              <StatCard title="Occupied Rooms" value={stats.occupied_rooms} color="text-amber-500 dark:text-amber-400" />
              <StatCard title="Available Beds" value={stats.available_beds} color="text-emerald-500 dark:text-emerald-400" />
              <StatCard title="Occupied Beds" value={stats.occupied_beds} color="text-rose-500 dark:text-rose-400" />
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-theme">
              {["rooms", "beds", "allocations", "transfers"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setCurrentPage(0); setSearchQuery(""); }}
                  className={`px-6 py-3 font-semibold text-sm capitalize border-b-2 transition ${
                    activeTab === tab 
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-theme-muted hover:text-theme-primary"
                  }`}
                >
                  {tab === "allocations" ? "Bed Allocations" : tab}
                </button>
              ))}
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-3.5 text-theme-muted" size={18} />
                <input
                  type="text"
                  placeholder={`Search by Room, Bed, or Patient...`}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                  className="w-full border border-theme-strong bg-theme-input rounded-3xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300 text-theme-primary placeholder:text-theme-muted"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {activeTab === "rooms" && (
                  <>
                    <select
                      value={filterRoomType}
                      onChange={(e) => { setFilterRoomType(e.target.value); setCurrentPage(0); }}
                      className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-3 text-theme-primary focus:outline-none"
                    >
                      <option value="">All Room Types</option>
                      <option value="General">General</option>
                      <option value="Semi-Private">Semi-Private</option>
                      <option value="Private">Private</option>
                      <option value="ICU">ICU</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Floor..."
                      value={filterFloor}
                      onChange={(e) => { setFilterFloor(e.target.value); setCurrentPage(0); }}
                      className="w-24 border border-theme-strong bg-theme-input rounded-3xl px-4 py-3 text-theme-primary focus:outline-none"
                    />
                  </>
                )}

                {["rooms", "beds"].includes(activeTab) && (
                  <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(0); }}
                    className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-3 text-theme-primary focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    {activeTab === "rooms" ? (
                      <option value="Maintenance">Maintenance</option>
                    ) : (
                      <option value="Reserved">Reserved</option>
                    )}
                  </select>
                )}

                {activeTab === "allocations" && (
                  <div className="flex gap-2">
                    <button
                      onClick={exportPdf}
                      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-3xl font-semibold transition"
                    >
                      <FileText size={16} /> PDF
                    </button>
                    <button
                      onClick={exportExcel}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-3xl font-semibold transition"
                    >
                      <FileSpreadsheet size={16} /> Excel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* TAB CONTENTS */}

            {/* ROOMS TAB */}
            {activeTab === "rooms" && (
              <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="p-4 text-left text-theme-primary">Room Number</th>
                      <th className="p-4 text-left text-theme-primary">Type</th>
                      <th className="p-4 text-left text-theme-primary">Floor</th>
                      <th className="p-4 text-left text-theme-primary">Total Beds</th>
                      <th className="p-4 text-left text-theme-primary">Occupied Beds</th>
                      <th className="p-4 text-left text-theme-primary">Charges / Day</th>
                      <th className="p-4 text-left text-theme-primary">Status</th>
                      <th className="p-4 text-center text-theme-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {rooms.length > 0 ? (
                      getPaginatedList(rooms).map((room) => (
                        <tr key={room.id} className="hover:bg-theme-hover text-theme-primary transition duration-150">
                          <td className="p-4 font-bold text-blue-600 dark:text-blue-400">Room {room.room_number}</td>
                          <td className="p-4">{room.room_type}</td>
                          <td className="p-4">Floor {room.floor}</td>
                          <td className="p-4">{room.number_of_beds}</td>
                          <td className="p-4">{room.occupied_beds_count}</td>
                          <td className="p-4">₹{room.charges_per_day}</td>
                          <td className="p-4 font-semibold"><span className={getStatusColor(room.status)}>{room.status}</span></td>
                          <td className="p-4 text-center flex items-center justify-center gap-2">
                            <button
                              onClick={() => editRoom(room)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => requestDelete("room", room.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center p-12 text-theme-muted font-medium">No Rooms Found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination pageCount={getPageCount(rooms)} onPageChange={({ selected }) => setCurrentPage(selected)} forcePage={currentPage} />
              </div>
            )}

            {/* BEDS TAB */}
            {activeTab === "beds" && (
              <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="p-4 text-left text-theme-primary">Bed Number</th>
                      <th className="p-4 text-left text-theme-primary">Room Number</th>
                      <th className="p-4 text-left text-theme-primary">Room Type</th>
                      <th className="p-4 text-left text-theme-primary">Bed Type</th>
                      <th className="p-4 text-left text-theme-primary">Status</th>
                      <th className="p-4 text-center text-theme-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {beds.length > 0 ? (
                      getPaginatedList(beds).map((bed) => (
                        <tr key={bed.id} className="hover:bg-theme-hover text-theme-primary transition duration-150">
                          <td className="p-4 font-bold text-blue-600 dark:text-blue-400">Bed {bed.bed_number}</td>
                          <td className="p-4">Room {bed.room_number}</td>
                          <td className="p-4">{bed.room_type}</td>
                          <td className="p-4">{bed.bed_type}</td>
                          <td className="p-4 font-semibold"><span className={getStatusColor(bed.status)}>{bed.status}</span></td>
                          <td className="p-4 text-center flex items-center justify-center gap-2">
                            <button
                              onClick={() => editBed(bed)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => requestDelete("bed", bed.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center p-12 text-theme-muted font-medium">No Beds Found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination pageCount={getPageCount(beds)} onPageChange={({ selected }) => setCurrentPage(selected)} forcePage={currentPage} />
              </div>
            )}

            {/* ALLOCATIONS TAB */}
            {activeTab === "allocations" && (
              <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="p-4 text-left text-theme-primary">Patient Name</th>
                      <th className="p-4 text-left text-theme-primary">Room Number</th>
                      <th className="p-4 text-left text-theme-primary">Bed Assigned</th>
                      <th className="p-4 text-left text-theme-primary">Assigned At</th>
                      <th className="p-4 text-left text-theme-primary">Status</th>
                      <th className="p-4 text-center text-theme-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {allocations.length > 0 ? (
                      getPaginatedList(allocations).map((a) => (
                        <tr key={a.id} className="hover:bg-theme-hover text-theme-primary transition duration-150">
                          <td className="p-4 font-bold">{a.patient_name}</td>
                          <td className="p-4">Room {a.room_number}</td>
                          <td className="p-4">Bed {a.bed_number}</td>
                          <td className="p-4">{new Date(a.allocated_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            {a.is_active ? (
                              <span className="text-emerald-500 font-semibold">Active</span>
                            ) : (
                              <span className="text-theme-muted">Released</span>
                            )}
                          </td>
                          <td className="p-4 text-center flex items-center justify-center gap-2">
                            {a.is_active && (
                              <>
                                <button
                                  onClick={() => requestTransfer(a)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                                >
                                  <ArrowLeftRight size={12} /> Transfer
                                </button>
                                <button
                                  onClick={() => requestRelease(a.id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                >
                                  Release
                                </button>
                              </>
                            )}
                            {!a.is_active && <span className="text-xs text-theme-muted">—</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center p-12 text-theme-muted font-medium">No Active Allocations</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination pageCount={getPageCount(allocations)} onPageChange={({ selected }) => setCurrentPage(selected)} forcePage={currentPage} />
              </div>
            )}

            {/* TRANSFERS TAB */}
            {activeTab === "transfers" && (
              <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="p-4 text-left text-theme-primary">Patient Name</th>
                      <th className="p-4 text-left text-theme-primary">From Bed</th>
                      <th className="p-4 text-left text-theme-primary">To Bed</th>
                      <th className="p-4 text-left text-theme-primary">Transfer Date</th>
                      <th className="p-4 text-left text-theme-primary">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {transfers.length > 0 ? (
                      getPaginatedList(transfers).map((t) => (
                        <tr key={t.id} className="hover:bg-theme-hover text-theme-primary transition duration-150">
                          <td className="p-4 font-bold">{t.patient_name}</td>
                          <td className="p-4">Bed {t.from_bed_number}</td>
                          <td className="p-4 text-emerald-500">Bed {t.to_bed_number}</td>
                          <td className="p-4">{new Date(t.transfer_date).toLocaleString()}</td>
                          <td className="p-4 text-theme-muted max-w-xs truncate" title={t.reason}>{t.reason || "No Reason Specified"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center p-12 text-theme-muted font-medium">No Transfer History Found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination pageCount={getPageCount(transfers)} onPageChange={({ selected }) => setCurrentPage(selected)} forcePage={currentPage} />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ROOM CREATE/EDIT MODAL */}
      {showRoomForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">{editingRoomId ? "Edit Room" : "Add Room"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Room Number</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Room Type</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                >
                  <option value="General">General</option>
                  <option value="Semi-Private">Semi-Private</option>
                  <option value="Private">Private</option>
                  <option value="ICU">ICU</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Floor</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Number of Beds</label>
                <input
                  type="number"
                  value={numberOfBeds}
                  onChange={(e) => setNumberOfBeds(e.target.value)}
                  placeholder="Total Beds in Room"
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Room Charges / Day (₹)</label>
                <input
                  type="number"
                  value={chargesPerDay}
                  onChange={(e) => setChargesPerDay(e.target.value)}
                  placeholder="Charges in ₹"
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Room Status</label>
                <select
                  value={roomStatus}
                  onChange={(e) => setRoomStatus(e.target.value)}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveRoom}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowRoomForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BED CREATE/EDIT MODAL */}
      {showBedForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">{editingBedId ? "Edit Bed" : "Add Bed"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Bed Number</label>
                <input
                  type="text"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  placeholder="e.g. B-101"
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Room</label>
                <select
                  value={bedRoomId}
                  onChange={(e) => setBedRoomId(e.target.value)}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                >
                  <option value="">-- Select Room --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>Room {r.room_number} ({r.room_type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Bed Type</label>
                <input
                  type="text"
                  value={bedType}
                  onChange={(e) => setBedType(e.target.value)}
                  placeholder="e.g. Standard, Recliner, ICU"
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Bed Status</label>
                <select
                  value={bedStatus}
                  onChange={(e) => setBedStatus(e.target.value)}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveBed}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowBedForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALLOCATION ASSIGN MODAL */}
      {showAllocationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Assign Bed</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Select Available Bed</label>
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                >
                  <option value="">-- Choose Bed --</option>
                  {beds.filter(b => b.status === "Available").map((b) => (
                    <option key={b.id} value={b.id}>Bed {b.bed_number} (Room {b.room_number} - {b.room_type})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={allocateBed}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  Assign Bed
                </button>
                <button
                  onClick={() => setShowAllocationForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PATIENT TRANSFER MODAL */}
      {showTransferForm && transferAllocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-theme-primary mb-6">Transfer Patient</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Patient</label>
                <input
                  type="text"
                  value={transferAllocation.patient_name}
                  disabled
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-disabled text-theme-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Current Bed</label>
                <input
                  type="text"
                  value={`Bed ${transferAllocation.bed_number} (Room ${transferAllocation.room_number})`}
                  disabled
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-disabled text-theme-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Transfer to Bed</label>
                <select
                  value={targetBedId}
                  onChange={(e) => setTargetBedId(e.target.value)}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                >
                  <option value="">-- Choose Target Bed --</option>
                  {beds.filter(b => b.status === "Available" && b.id !== transferAllocation.bed).map((b) => (
                    <option key={b.id} value={b.id}>Bed {b.bed_number} (Room {b.room_number} - {b.room_type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Reason for Transfer</label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Upgraded to Private room, medical condition requirement..."
                  rows={2}
                  className="w-full border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={performTransfer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  Transfer Patient
                </button>
                <button
                  onClick={() => setShowTransferForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title={`Delete ${deleteType}`}
        message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* CONFIRM RELEASE DIALOG */}
      <ConfirmDialog
        isOpen={confirmReleaseOpen}
        title="Release Bed"
        message="Are you sure you want to release this bed? The patient will be marked as discharged from this bed."
        onConfirm={confirmRelease}
        onCancel={() => setConfirmReleaseOpen(false)}
        confirmText="Release"
        cancelText="Cancel"
      />

    </div>
  );
}

export default Rooms;