import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";

function DashboardChart({ doctorCount, patientCount, appointmentCount, totalRevenue }) {
  const data = [
    { name: "Doctors", value: doctorCount },
    { name: "Patients", value: patientCount },
    { name: "Appointments", value: appointmentCount },
    { name: "Revenue", value: totalRevenue },
  ];

  const colors = ["#2563eb", "#16a34a", "#f97316", "#ef4444"];

  return (
    <div className="bg-white/95 shadow-xl rounded-3xl border border-slate-200/70 p-6 mt-8 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Hospital Statistics</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200/70 p-4 hover:-translate-y-1 hover:shadow-2xl transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Bar Chart</h3>
            <span className="text-sm text-gray-500">Counts & revenue</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip wrapperStyle={{ borderRadius: 12, padding: 10 }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-bar-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Pie Chart</h3>
            <span className="text-sm text-gray-500">Relative distribution</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {data.map((entry, index) => (
                  <Cell key={`cell-pie-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip wrapperStyle={{ borderRadius: 12, padding: 10 }} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-slate-200/70 p-4 lg:col-span-2 hover:-translate-y-1 hover:shadow-2xl transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Line Chart</h3>
            <span className="text-sm text-gray-500">Trend overview</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip wrapperStyle={{ borderRadius: 12, padding: 10 }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default DashboardChart;
