import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import Spinner from "../Components/Spinner";
import ConfirmDialog from "../Components/ConfirmDialog";
import { toast } from "react-toastify";
import { 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Clock, 
  ArrowLeft,
  User, 
  Activity, 
  Search, 
  Download, 
  Eye,
  FileCheck,
  Heart,
  Droplet
} from "lucide-react";

function PatientHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("userRole");
  const isAuthorizedToEdit = role === "Admin" || role === "Doctor";

  const [patient, setPatient] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal / Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);

  // Form Fields
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");
  const [allergies, setAllergies] = useState("None");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [sugarLevel, setSugarLevel] = useState("");
  const [notes, setNotes] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [reportFile, setReportFile] = useState(null);
  
  // Preview Modal
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  // Delete Confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    fetchPatientDetails();
    fetchHistory();
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/patients/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPatient(data);
      } else {
        toast.error("Failed to fetch patient details");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      let url = `https://hospital-management-system-6jw8.onrender.com/api/medical-histories/?patient=${id}`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHistoryRecords(data);
        // Default blood group if records exist
        if (data.length > 0 && data[0].blood_group) {
          setBloodGroup(data[0].blood_group);
        }
      } else {
        toast.error("Failed to fetch medical history records");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while fetching medical history");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    // We update immediately
    setTimeout(() => {
      fetchPatientDetails();
      fetchHistory();
    }, 50);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setReportFile(e.target.files[0]);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingRecordId(null);
    setDiagnosis("");
    setSymptoms("");
    setTreatment("");
    setPrescription("");
    setAllergies("None");
    setHeight("");
    setWeight("");
    setBloodPressure("");
    setSugarLevel("");
    setNotes("");
    setVisitDate(new Date().toISOString().split("T")[0]);
    setNextFollowupDate("");
    setReportFile(null);
    setShowFormModal(true);
  };

  const openEditModal = (record) => {
    setIsEditing(true);
    setEditingRecordId(record.id);
    setDiagnosis(record.diagnosis);
    setSymptoms(record.symptoms);
    setTreatment(record.treatment);
    setPrescription(record.prescription);
    setAllergies(record.allergies || "None");
    setBloodGroup(record.blood_group || "A+");
    setHeight(record.height || "");
    setWeight(record.weight || "");
    setBloodPressure(record.blood_pressure || "");
    setSugarLevel(record.sugar_level || "");
    setNotes(record.notes || "");
    setVisitDate(record.visit_date);
    setNextFollowupDate(record.next_followup_date || "");
    setReportFile(null); // Keep original unless uploaded new
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Quick validation
    if (!diagnosis || !symptoms || !treatment || !prescription || !visitDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("patient", id);
    formData.append("diagnosis", diagnosis);
    formData.append("symptoms", symptoms);
    formData.append("treatment", treatment);
    formData.append("prescription", prescription);
    formData.append("allergies", allergies);
    formData.append("blood_group", bloodGroup);
    formData.append("height", height);
    formData.append("weight", weight);
    formData.append("blood_pressure", bloodPressure);
    formData.append("sugar_level", sugarLevel);
    formData.append("notes", notes);
    formData.append("visit_date", visitDate);
    if (nextFollowupDate) {
      formData.append("next_followup_date", nextFollowupDate);
    }
    if (reportFile) {
      formData.append("report", reportFile);
    }

    setLoading(true);
    try {
      const url = isEditing 
        ? `https://hospital-management-system-6jw8.onrender.com/api/medical-histories/${editingRecordId}/`
        : "https://hospital-management-system-6jw8.onrender.com/api/medical-histories/";
      
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success(isEditing ? "Record Updated Successfully" : "Record Added Successfully");
        setShowFormModal(false);
        fetchHistory();
      } else {
        // Handle validation/duplicate error
        if (responseData.visit_date) {
          toast.error(responseData.visit_date[0] || responseData.visit_date);
        } else {
          toast.error(isEditing ? "Failed to Update Record" : "Failed to Add Record");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (recordId) => {
    setDeleteRecordId(recordId);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false);
    if (!deleteRecordId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/medical-histories/${deleteRecordId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success("Record Deleted Successfully");
        fetchHistory();
      } else {
        toast.error("Failed to delete record");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
      setDeleteRecordId(null);
    }
  };

  const handlePreviewReport = (fileUrl) => {
    if (!fileUrl) return;
    const fileExtension = fileUrl.split('.').pop().toLowerCase();
    setPreviewUrl(fileUrl);
    if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
      setPreviewType('image');
    } else {
      setPreviewType('pdf');
    }
  };

  // Pagination calculations
  const totalRecords = historyRecords.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = historyRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return null;
    const ext = fileUrl.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-emerald-500 mr-1 inline" />;
    }
    return <FileText className="w-4 h-4 text-red-500 mr-1 inline" />;
  };

  return (
    <div className="flex min-h-screen bg-theme-primary">
      {loading && <Spinner />}
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="p-8 space-y-6">
          
          {/* Back button */}
          <button 
            onClick={() => navigate("/patients")} 
            className="flex items-center text-sm font-semibold text-theme-secondary hover:text-theme-primary transition gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Patients List
          </button>

          {/* Header patient Info Card */}
          {patient && (
            <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-theme-primary">{patient.name}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-theme-secondary mt-1">
                    <span>Age: <strong className="text-theme-primary">{patient.age} yrs</strong></span>
                    <span>•</span>
                    <span>Gender: <strong className="text-theme-primary">{patient.gender}</strong></span>
                    <span>•</span>
                    <span>Phone: <strong className="text-theme-primary">{patient.phone}</strong></span>
                  </div>
                </div>
              </div>

              {/* Patient Quick Medical Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-theme-tertiary/50 border border-theme p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-[10px] text-theme-muted uppercase font-bold">Blood Group</p>
                    <p className="text-sm font-extrabold text-theme-primary">{bloodGroup}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-theme-muted uppercase font-bold">Total Visits</p>
                  <p className="text-sm font-extrabold text-theme-primary">{historyRecords.length} visits</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-theme-muted uppercase font-bold">Last Visit</p>
                  <p className="text-sm font-extrabold text-theme-primary">
                    {historyRecords.length > 0 ? historyRecords[0].visit_date : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Controls - Search, Date range, add button */}
          <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-3xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search history, diagnosis, dates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-theme-strong bg-theme-input rounded-3xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 text-theme-primary placeholder:text-theme-muted text-sm"
                />
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-theme-strong bg-theme-input rounded-xl px-2 py-1.5 text-xs text-theme-primary"
                />
                <span className="text-theme-muted text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-theme-strong bg-theme-input rounded-xl px-2 py-1.5 text-xs text-theme-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                >
                  Apply
                </button>
                <button 
                  type="button" 
                  onClick={handleClearFilters}
                  className="bg-theme-tertiary hover:bg-theme-hover text-theme-primary px-3 py-2 rounded-xl text-xs font-semibold transition"
                >
                  Clear
                </button>
              </div>
            </form>

            {isAuthorizedToEdit && (
              <button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" /> Add Medical Record
              </button>
            )}
          </div>

          {/* Timeline View / Empty State */}
          {historyRecords.length === 0 ? (
            <div className="bg-theme-card border border-theme rounded-3xl p-12 text-center text-theme-muted shadow-theme-md flex flex-col items-center justify-center gap-3">
              <FileCheck className="w-12 h-12 text-theme-muted/50" />
              <p className="text-lg font-bold text-theme-primary">No Medical Records Found</p>
              <p className="text-sm">There are no medical history visit logs matching the filters for this patient.</p>
              {isAuthorizedToEdit && (
                <button 
                  onClick={openAddModal}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold px-4 py-2 rounded-xl text-xs mt-2 transition"
                >
                  Create First Record
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Timeline Items */}
              <div className="relative border-l border-theme ml-4 md:ml-6 space-y-8 pb-4">
                {currentRecords.map((record) => (
                  <div key={record.id} className="relative pl-6 md:pl-8">
                    {/* Circle marker on line */}
                    <div className="absolute -left-[9px] top-1.5 bg-blue-600 dark:bg-blue-500 w-4.5 h-4.5 rounded-full border-4 border-theme-primary flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>

                    {/* Timeline card */}
                    <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-md hover:shadow-theme-lg transition duration-200">
                      
                      {/* Header row in card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Visit Date: {record.visit_date}
                          </span>
                          {record.next_followup_date && (
                            <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> Follow-up: {record.next_followup_date}
                            </span>
                          )}
                        </div>

                        {/* Edit/Delete Actions */}
                        {isAuthorizedToEdit && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(record)}
                              className="p-2 hover:bg-theme-hover text-theme-secondary hover:text-blue-600 rounded-xl transition"
                              title="Edit Record"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => requestDelete(record.id)}
                              className="p-2 hover:bg-theme-hover text-theme-secondary hover:text-red-600 rounded-xl transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Main grid of content */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Vitals Column */}
                        <div className="space-y-4 bg-theme-tertiary/40 border border-theme p-4 rounded-2xl">
                          <h4 className="text-xs font-bold text-theme-primary uppercase flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-rose-500" /> Patient Vitals
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-theme-muted font-medium">Height</p>
                              <p className="font-semibold text-theme-primary">{record.height || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-theme-muted font-medium">Weight</p>
                              <p className="font-semibold text-theme-primary">{record.weight || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-theme-muted font-medium">Blood Pressure</p>
                              <p className="font-semibold text-theme-primary">{record.blood_pressure || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-theme-muted font-medium">Sugar Level</p>
                              <p className="font-semibold text-theme-primary">{record.sugar_level || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-theme-muted font-medium">Allergies</p>
                              <p className="font-semibold text-red-500 dark:text-red-400">{record.allergies || "None"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Diagnostics & Symptoms */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs font-bold text-theme-secondary uppercase">Diagnosis</h4>
                            <p className="text-sm font-extrabold text-theme-primary mt-1">{record.diagnosis}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-theme-secondary uppercase">Symptoms</h4>
                            <p className="text-sm text-theme-primary mt-1 whitespace-pre-line">{record.symptoms}</p>
                          </div>
                        </div>

                        {/* Treatments & Prescriptions */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs font-bold text-theme-secondary uppercase">Treatment</h4>
                            <p className="text-sm text-theme-primary mt-1 whitespace-pre-line">{record.treatment}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-theme-secondary uppercase">Prescription</h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mt-1 whitespace-pre-line bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
                              {record.prescription}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Notes & File uploads at the bottom of card */}
                      {(record.notes || record.report) && (
                        <div className="mt-4 border-t border-theme pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            {record.notes && (
                              <p className="text-xs text-theme-muted italic">
                                <span className="font-bold text-theme-secondary not-italic uppercase text-[10px] mr-1">Notes:</span> 
                                {record.notes}
                              </p>
                            )}
                          </div>
                          
                          {/* Attached Report File */}
                          {record.report && (
                            <div className="flex items-center gap-2 bg-theme-tertiary border border-theme px-3 py-1.5 rounded-xl">
                              <span className="text-xs text-theme-primary font-medium flex items-center">
                                {getFileIcon(record.report)} Report File
                              </span>
                              <button
                                onClick={() => handlePreviewReport(record.report)}
                                className="p-1 hover:bg-theme-card rounded text-theme-secondary hover:text-blue-600"
                                title="Preview Report"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={record.report}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 hover:bg-theme-card rounded text-theme-secondary hover:text-blue-600"
                                title="Download Report"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-theme-card border border-theme px-6 py-4 rounded-3xl shadow-theme-sm">
                  <span className="text-xs text-theme-secondary">
                    Showing <strong className="text-theme-primary">{indexOfFirstRecord + 1}</strong> to <strong className="text-theme-primary">{Math.min(indexOfLastRecord, totalRecords)}</strong> of <strong className="text-theme-primary">{totalRecords}</strong> records
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-theme rounded-xl text-xs font-semibold text-theme-secondary hover:text-theme-primary disabled:opacity-50 disabled:pointer-events-none transition"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-8 h-8 rounded-xl text-xs font-semibold transition ${
                          currentPage === idx + 1
                            ? "bg-blue-600 text-white"
                            : "border border-theme text-theme-secondary hover:text-theme-primary"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-theme rounded-xl text-xs font-semibold text-theme-secondary hover:text-theme-primary disabled:opacity-50 disabled:pointer-events-none transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Modal */}
          {showFormModal && (
            <div className="fixed inset-0 z-50 bg-theme-overlay flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
              <div className="bg-theme-card border border-theme rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-theme-xl space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-theme-primary">{isEditing ? "Update Medical Record" : "Add Medical Record"}</h3>
                  <p className="text-xs text-theme-muted">All fields marked with * are required.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Diagnosis */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-theme-secondary">Diagnosis *</label>
                      <input
                        type="text"
                        required
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. Chronic Hypertension"
                        className="w-full border border-theme-strong bg-theme-input rounded-xl px-4 py-3 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Allergies */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-theme-secondary">Allergies</label>
                      <input
                        type="text"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="e.g. Penicillin, None"
                        className="w-full border border-theme-strong bg-theme-input rounded-xl px-4 py-3 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Symptoms */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-theme-secondary">Symptoms *</label>
                      <textarea
                        required
                        rows={2}
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="Describe current symptoms..."
                        className="w-full border border-theme-strong bg-theme-input rounded-xl px-4 py-3 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Treatment */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-theme-secondary">Treatment Plan *</label>
                      <textarea
                        required
                        rows={2}
                        value={treatment}
                        onChange={(e) => setTreatment(e.target.value)}
                        placeholder="Describe treatments, therapies, or procedures..."
                        className="w-full border border-theme-strong bg-theme-input rounded-xl px-4 py-3 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Prescription */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-theme-secondary">Prescription *</label>
                      <textarea
                        required
                        rows={2}
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        placeholder="List medicines, dosage, and frequency..."
                        className="w-full border border-theme-strong bg-theme-input rounded-xl px-4 py-3 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs"
                      />
                    </div>

                    {/* Visit Date */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-theme-secondary">Visit Date *</label>
                      <input
                        type="date"
                        required
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full border border-theme-strong bg-theme-input rounded-xl px-4 py-3 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Next Followup Date */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-theme-secondary">Next Follow-up Date</label>
                      <input
                        type="date"
                        value={nextFollowupDate}
                        onChange={(e) => setNextFollowupDate(e.target.value)}
                        className="w-full border border-theme-strong bg-theme-input rounded-xl px-4 py-3 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Vitals Subgrid */}
                    <div className="md:col-span-2 border-t border-theme pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Blood Group */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-theme-secondary uppercase">Blood Group</label>
                        <select 
                          value={bloodGroup} 
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full border border-theme-strong bg-theme-input rounded-xl px-2 py-2 text-xs text-theme-primary"
                        >
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      {/* Height */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-theme-secondary uppercase">Height</label>
                        <input
                          type="text"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="e.g. 170 cm"
                          className="w-full border border-theme-strong bg-theme-input rounded-xl px-2 py-2 text-xs text-theme-primary"
                        />
                      </div>

                      {/* Weight */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-theme-secondary uppercase">Weight</label>
                        <input
                          type="text"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="e.g. 68 kg"
                          className="w-full border border-theme-strong bg-theme-input rounded-xl px-2 py-2 text-xs text-theme-primary"
                        />
                      </div>

                      {/* Blood Pressure */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-theme-secondary uppercase">Blood Pressure</label>
                        <input
                          type="text"
                          value={bloodPressure}
                          onChange={(e) => setBloodPressure(e.target.value)}
                          placeholder="e.g. 120/80"
                          className="w-full border border-theme-strong bg-theme-input rounded-xl px-2 py-2 text-xs text-theme-primary"
                        />
                      </div>

                      {/* Sugar Level */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-theme-secondary uppercase">Sugar Level</label>
                        <input
                          type="text"
                          value={sugarLevel}
                          onChange={(e) => setSugarLevel(e.target.value)}
                          placeholder="e.g. 110 mg/dL"
                          className="w-full border border-theme-strong bg-theme-input rounded-xl px-2 py-2 text-xs text-theme-primary"
                        />
                      </div>

                      {/* Upload Report */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-theme-secondary uppercase">Upload Report (PDF/JPG/PNG)</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="w-full border border-theme-strong bg-theme-input rounded-xl px-2 py-1.5 text-xs text-theme-primary"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-theme-secondary">Additional Notes</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional remarks or internal comments..."
                        className="w-full border border-theme-strong bg-theme-input rounded-xl px-4 py-3 text-sm text-theme-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 border-t border-theme pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-sm font-semibold transition"
                    >
                      {isEditing ? "Update Record" : "Add Record"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      className="flex-1 bg-theme-tertiary hover:bg-theme-hover text-theme-primary py-3 rounded-2xl text-sm font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Report Preview Modal */}
          {previewUrl && (
            <div className="fixed inset-0 z-50 bg-theme-overlay flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-theme-card border border-theme rounded-3xl max-w-4xl w-full p-6 shadow-theme-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-theme-primary">Report File Preview</h3>
                  <button 
                    onClick={() => { setPreviewUrl(null); setPreviewType(null); }}
                    className="bg-theme-tertiary hover:bg-theme-hover text-theme-primary px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  >
                    Close
                  </button>
                </div>
                
                <div className="bg-theme-input border border-theme rounded-2xl p-2 flex items-center justify-center min-h-[400px] max-h-[70vh] overflow-auto">
                  {previewType === 'image' ? (
                    <img src={previewUrl} alt="Report Preview" className="max-w-full max-h-[60vh] object-contain rounded-lg" />
                  ) : (
                    <iframe src={previewUrl} title="PDF Preview" className="w-full h-[60vh] border-0 rounded-lg" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confirm Delete Dialog */}
          <ConfirmDialog
            isOpen={confirmDeleteOpen}
            title="Delete Medical Record"
            message="Are you sure you want to delete this medical record? This action cannot be undone."
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirmDeleteOpen(false)}
            confirmText="Delete"
            cancelText="Cancel"
          />

        </div>
      </div>
    </div>
  );
}

export default PatientHistory;
