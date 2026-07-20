function StatCard({ title, value, color }) {
  return (
    <div className="bg-theme-card rounded-3xl shadow-theme-xl border border-theme p-6 hover:-translate-y-1 hover:shadow-theme-xl transition-all duration-300 ease-out">
      <h2 className="text-theme-muted font-medium">{title}</h2>
      <h1 className={`text-4xl font-bold mt-3 ${color || "text-theme-primary"}`}>{value}</h1>
    </div>
  );
}
export default StatCard;