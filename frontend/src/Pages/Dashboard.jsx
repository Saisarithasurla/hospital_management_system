import { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import StatCard from "../Components/StatCard";
import DashboardChart from "../Components/DashboardChart";
import "../theme-utils.css";
function Dashboard() {
  const [doctorCount, setDoctorCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const role = localStorage.getItem("userRole");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (role === "Admin") {
        const doctorResponse = await fetch("http://127.0.0.1:8000/api/doctors/", { headers });
        const doctors = await doctorResponse.json();
        if (doctorResponse.ok) {
          setDoctorCount(doctors.length);
        }
      }

      // Both doctor and receptionist can fetch patients and appointments
      const patientResponse = await fetch("http://127.0.0.1:8000/api/patients/", { headers });
      const patients = await patientResponse.json();
      if (patientResponse.ok) {
        setPatientCount(patients.length);
      }

      const appointmentResponse = await fetch("http://127.0.0.1:8000/api/appointments/", { headers });
      const appointments = await appointmentResponse.json();
      if (appointmentResponse.ok) {
        setAppointmentCount(appointments.length);
      }

      if (role === "Admin" || role === "Receptionist") {
        const billResponse = await fetch("http://127.0.0.1:8000/api/bills/", { headers });
        const bills = await billResponse.json();
        if (billResponse.ok && Array.isArray(bills)) {
          const revenue = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
          setTotalRevenue(revenue);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex min-h-screen bg-theme-primary">
      <Sidebar />
      <div className="flex-1 animate-fade-in">
        <Navbar />
        <div className="p-8">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-theme-primary">Dashboard</h1>
              <p className="text-sm text-theme-muted">Overview of doctors, patients, appointments, and revenue.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {role === "Admin" && (
                <StatCard title="Doctors" value={doctorCount} color="text-blue-600 dark:text-blue-400" />
              )}
              <StatCard title="Patients" value={patientCount} color="text-green-600 dark:text-green-400" />
              <StatCard title="Appointments" value={appointmentCount} color="text-amber-500 dark:text-amber-400" />
              {(role === "Admin" || role === "Receptionist") && (
                <StatCard title="Revenue" value={`₹${totalRevenue}`} color="text-purple-600 dark:text-purple-400" />
              )}
            </div>

            {role === "Admin" ? (
              <DashboardChart
                doctorCount={doctorCount}
                patientCount={patientCount}
                appointmentCount={appointmentCount}
                totalRevenue={totalRevenue}
              />
            ) : (
              <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-xl p-8 flex flex-col items-center justify-center text-center backdrop-blur-xl min-h-[300px]">
                <h2 className="text-2xl font-bold text-theme-primary mb-2">Welcome Back!</h2>
                <p className="text-theme-muted max-w-md">
                  You are logged in as a <span className="font-semibold text-blue-600 dark:text-blue-400">{role}</span>. Use the sidebar menu to navigate through your authorized actions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;