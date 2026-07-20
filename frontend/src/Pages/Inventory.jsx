import { useEffect, useState, useRef } from "react";
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
import { Package, Search, ArrowUpDown, Filter, AlertTriangle, Calendar } from "lucide-react";
function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const dateInputRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [ordering, setOrdering] = useState("name");
  const [loading, setLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteMedicineId, setDeleteMedicineId] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const role = localStorage.getItem("userRole");
  const isAuthorized = role === "Admin" || role === "Receptionist" || role === "Doctor";
  useEffect(() => {
    fetchMedicines();
  }, [search, filterType, ordering]);
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      let url = "https://hospital-management-system-6jw8.onrender.com/api/medicines/";
      const queryParams = [];
      if (search) {
        queryParams.push(`search=${encodeURIComponent(search)}`);
      }
      if (filterType && filterType !== "all") {
        queryParams.push(`filter_type=${encodeURIComponent(filterType)}`);
      }
      if (ordering) {
        queryParams.push(`ordering=${encodeURIComponent(ordering)}`);
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
        setMedicines(data);
      } else {
        toast.error('Failed to fetch inventory medicines');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch inventory medicines');
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setName(""); setCategory(""); setManufacturer(""); setBatchNumber(""); setQuantity(0); setUnitPrice(""); setExpiryDate(""); setSupplierName("");
    setDescription(""); setEditingId(null); setIsEditing(false); setShowForm(false);
  };
  const addMedicine = async () => {
    if (!name || !category || !manufacturer || !batchNumber || !expiryDate || !unitPrice) {
      toast.warn("Please fill in all mandatory fields.");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch("https://hospital-management-system-6jw8.onrender.com/api/medicines/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          category,
          manufacturer,
          batch_number: batchNumber,
          quantity_in_stock: Number(quantity),
          unit_price: Number(unitPrice),
          expiry_date: expiryDate,
          supplier_name: supplierName,
          description,
        }),
      });
      if (response.ok) {
        toast.success("Medicine Added Successfully");
        window.dispatchEvent(new Event('crud-operation'));
        resetForm();
        fetchMedicines();
      } else {
        toast.error("Failed to Add Medicine");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to Add Medicine");
    } finally {
      setLoading(false);
    }
  };
  const editMedicine = (med) => {
    setShowForm(true);
    setIsEditing(true);
    setEditingId(med.id);
    setName(med.name || "");
    setCategory(med.category || "");
    setManufacturer(med.manufacturer || "");
    setBatchNumber(med.batch_number || "");
    setQuantity(med.quantity_in_stock || 0);
    setUnitPrice(med.unit_price || "");
    setExpiryDate(med.expiry_date || "");
    setSupplierName(med.supplier_name || "");
    setDescription(med.description || "");
  };
  const updateMedicine = async () => {
    if (!editingId) return;
    if (!name || !category || !manufacturer || !batchNumber || !expiryDate || !unitPrice) {
      toast.warn("Please fill in all mandatory fields.");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/medicines/${editingId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          category,
          manufacturer,
          batch_number: batchNumber,
          quantity_in_stock: Number(quantity),
          unit_price: Number(unitPrice),
          expiry_date: expiryDate,
          supplier_name: supplierName,
          description,
        }),
      });
      if (response.ok) {
        toast.success("Medicine Updated Successfully");
        window.dispatchEvent(new Event('crud-operation'));
        resetForm();
        fetchMedicines();
      } else {
        toast.error("Failed to Update Medicine");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to Update Medicine");
    } finally {
      setLoading(false);
    }
  };
  const requestDeleteMedicine = (id) => { setDeleteMedicineId(id); setConfirmDeleteOpen(true); };
  const handleConfirmDeleteMedicine = async () => { setConfirmDeleteOpen(false); if (!deleteMedicineId) return; await deleteMedicine(deleteMedicineId); setDeleteMedicineId(null); };
  const cancelDeleteMedicine = () => { setConfirmDeleteOpen(false); setDeleteMedicineId(null); };
  const deleteMedicine = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const response = await fetch(`https://hospital-management-system-6jw8.onrender.com/api/medicines/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok || response.status === 204) {
        toast.success("Medicine Deleted Successfully");
        window.dispatchEvent(new Event('crud-operation'));
        fetchMedicines();
      } else {
        toast.error("Failed to delete medicine");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete medicine");
    } finally {
      setLoading(false);
    }
  };
  const exportPdf = () => {
    const doc = new jsPDF();
    const headers = [["ID", "Name", "Category", "Batch", "Stock", "Price (INR)", "Valuation (INR)", "Expiry"]];
    const rows = currentMedicines.map((med) => [med.id, med.name, med.category, med.batch_number, med.quantity_in_stock, med.unit_price, (Number(med.quantity_in_stock) * Number(med.unit_price)).toFixed(2), med.expiry_date,]);
    doc.text("Medicine Inventory Report", 14, 20);
    autoTable(doc, { head: headers, body: rows, startY: 28 });
    doc.save("inventory-report.pdf");
    toast.success("PDF report downloaded");
  };
  const exportExcel = () => {
    const rows = currentMedicines.map((med) => ({ ID: med.id, Name: med.name, Category: med.category, Manufacturer: med.manufacturer, BatchNumber: med.batch_number, QuantityInStock: med.quantity_in_stock, UnitPrice: med.unit_price, InventoryValue: (Number(med.quantity_in_stock) * Number(med.unit_price)).toFixed(2), ExpiryDate: med.expiry_date, Supplier: med.supplier_name, }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'inventory-report.xlsx');
    toast.success("Excel report downloaded");
  };
  const pageCount = Math.ceil(medicines.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentMedicines = medicines.slice(offset, offset + itemsPerPage);
  const isExpired = (expDate) => {
    const today = new Date();
    const expiry = new Date(expDate);
    return expiry < today;
  };
  const getStockBadge = (qty) => {
    if (qty === 0) {
      return <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold">🔴 Out of Stock</span>;
    } else if (qty <= 10) {
      return <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">🟡 Low Stock</span>;
    } else {
      return <span className="bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold">🟢 In Stock</span>;
    }
  };
  return (
    <div className="flex min-h-screen bg-theme-primary">
      <Sidebar />
      {loading && <Spinner />}
      <div className="flex-1">
        <Navbar />
        <div className="p-8">
          <div className="flex flex-col gap-6 bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-6 mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
              <div>
                <h1 className="text-3xl font-bold text-theme-primary">Pharmacy Inventory</h1>
                <p className="text-sm text-theme-muted">Manage medicine stock levels, category listings, and supplier tracking.</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button type="button" onClick={exportPdf} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-3xl text-sm font-semibold transition hover:-translate-y-0.5">Export PDF</button>
                <button type="button" onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-3xl text-sm font-semibold transition hover:-translate-y-0.5">Export Excel</button>
                {role === "Admin" && !showForm && (
                  <button type="button" onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-3xl text-sm font-semibold transition hover:-translate-y-0.5" >+ Add Medicine
                  </button>
                )}
              </div>
            </div>
            <div className="h-px bg-theme-strong opacity-20 w-full"></div>
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between w-full">
              <div className="relative flex-1 max-w-xs">
                <input type="text" placeholder="Search medicines..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
                  className="w-full border border-theme-strong bg-theme-input rounded-3xl pl-10 pr-4 py-2 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none" />
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-theme-muted" />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(0); }}
                  className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2 text-sm text-theme-primary focus:outline-none">
                  <option value="all">All Inventory</option><option value="low_stock">⚠️ Low Stock</option><option value="out_of_stock">🚨 Out of Stock</option><option value="expiring_30">📅 Expiring &lt; 30 Days</option></select>
                <select value={ordering} onChange={(e) => { setOrdering(e.target.value); setCurrentPage(0); }}
                  className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2 text-sm text-theme-primary focus:outline-none">
                  <option value="name">Sort by Name (A-Z)</option>
                  <option value="-name">Sort by Name (Z-A)</option>
                  <option value="quantity">Sort by Stock (Low-High)</option>
                  <option value="-quantity">Sort by Stock (High-Low)</option>
                  <option value="expiry">Sort by Expiry (Old-New)</option>
                  <option value="-expiry">Sort by Expiry (New-Old)</option>
                  <option value="price">Sort by Price (Low-High)</option>
                  <option value="-price">Sort by Price (High-Low)</option>
                </select>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(0); }}
                  className="border border-theme-strong bg-theme-input rounded-3xl px-4 py-2 text-sm text-theme-primary focus:outline-none">
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                </select>
              </div>
            </div>
          </div>
          {showForm ? (
            <div className="max-w-2xl mx-auto bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8">
              <h2 className="text-3xl font-bold text-center mb-8 text-theme-primary">
                {isEditing ? "Update Medicine Details" : "Register New Medicine"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="text-xs font-bold text-theme-secondary">Medicine Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary" placeholder="e.g. Paracetamol" />
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-secondary">Category *</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary" placeholder="e.g. Analgesic" />
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-secondary">Manufacturer *</label>
                  <input type="text" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full mt-1 border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary" placeholder="e.g. Pfizer" />
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-secondary">Batch Number *</label>
                  <input type="text" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} className="w-full mt-1 border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary" placeholder="e.g. BATCH-2024A"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-secondary">Quantity in Stock *</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full mt-1 border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-secondary">Unit Price (INR) *</label>
                  <input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full mt-1 border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary" placeholder="e.g. 15.50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-secondary">Expiry Date *</label>
                  <div className="custom-picker-container relative w-full border border-theme-strong rounded-lg bg-theme-input text-theme-primary flex items-center p-3 mt-1">
                    <input type="text" readOnly placeholder="Select Expiry Date" value={expiryDate} onClick={() => dateInputRef.current && dateInputRef.current.showPicker()}
                      className="flex-1 bg-transparent border-none outline-none text-theme-primary cursor-pointer text-sm" />
                    <input ref={dateInputRef} type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="absolute right-4 w-6 h-6 opacity-0 cursor-pointer z-10" />
                    <Calendar className="text-theme-muted pointer-events-none ml-2" size={20} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-secondary">Supplier Name</label>
                  <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="w-full mt-1 border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary" placeholder="e.g. PharmaMed Distributors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-theme-secondary">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 border border-theme-strong rounded-lg p-3 bg-theme-input text-theme-primary" rows={3} placeholder="Add storage or administration guidelines..." />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={isEditing ? updateMedicine : addMedicine} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
                  {isEditing ? "Update Medicine" : "Register Medicine"}
                </button>
                <button onClick={resetForm} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="p-4 text-left text-theme-primary">ID</th>
                      <th className="p-4 text-left text-theme-primary">Medicine Details</th>
                      <th className="p-4 text-left text-theme-primary">Batch / Mfg</th>
                      <th className="p-4 text-left text-theme-primary">Stock Status</th>
                      <th className="p-4 text-left text-theme-primary">Stock Qty</th>
                      <th className="p-4 text-left text-theme-primary">Unit Price</th>
                      <th className="p-4 text-left text-theme-primary">Inventory Value</th>
                      <th className="p-4 text-left text-theme-primary">Expiry Date</th>
                      {role === "Admin" && (
                        <th className="p-4 text-center text-theme-primary">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentMedicines.length > 0 ? (
                      currentMedicines.map((med) => {
                        const expired = isExpired(med.expiry_date);
                        return (
                          <tr key={med.id} className={`border-t border-theme hover:bg-theme-hover text-theme-primary transition duration-150 ${expired ? "bg-red-500/10 hover:bg-red-500/15" : ""}`}>
                            <td className="p-4 font-bold">{med.id}</td>
                            <td className="p-4">
                              <div>
                                <div className="font-bold text-base flex items-center gap-1.5">
                                  {med.name}
                                  {expired && (
                                    <span className="flex items-center text-xs text-red-500 font-bold bg-red-500/20 px-2 py-0.5 rounded-full">
                                      <AlertTriangle className="w-3 h-3 mr-0.5 inline" /> Expired
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-theme-muted">{med.category}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm font-semibold">{med.batch_number}</div>
                              <div className="text-xs text-theme-muted">{med.manufacturer}</div>
                            </td>
                            <td className="p-4">{getStockBadge(med.quantity_in_stock)}</td>
                            <td className="p-4 font-bold">{med.quantity_in_stock}</td>
                            <td className="p-4 font-semibold">₹{Number(med.unit_price).toFixed(2)}</td>
                            <td className="p-4 font-black text-theme-secondary">
                              ₹{(Number(med.quantity_in_stock) * Number(med.unit_price)).toFixed(2)}
                            </td>
                            <td className="p-4">
                              <span className={`text-sm font-bold ${expired ? "text-red-600 dark:text-red-400" : ""}`}>
                                {med.expiry_date}
                              </span>
                            </td>
                            {role === "Admin" && (
                              <td className="p-4 text-center">
                                <button onClick={() => editMedicine(med)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded mr-2 text-xs font-bold transition">Edit</button>
                                <button onClick={() => requestDeleteMedicine(med.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold transition">Delete</button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={role === "Admin" ? 9 : 8} className="text-center p-8 text-theme-muted font-medium">No Medicine Records Found in Inventory</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination pageCount={pageCount} onPageChange={({ selected }) => setCurrentPage(selected)} forcePage={currentPage} />
            </div>
          )}
        </div>
        <ConfirmDialog isOpen={confirmDeleteOpen} title="Delete Inventory Item" message="Are you sure you want to remove this medicine from inventory? This action is permanent." onConfirm={handleConfirmDeleteMedicine} onCancel={cancelDeleteMedicine} confirmText="Delete Item" cancelText="Cancel" />
      </div>
    </div>
  );
}
export default Inventory;