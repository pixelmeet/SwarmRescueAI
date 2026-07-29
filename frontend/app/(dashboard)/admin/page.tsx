export default function AdminDashboardPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-blue-500">Admin Command Center</h1>
      <p className="text-slate-400">Live emergency queue, interactive map, and manual dispatch override.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border border-slate-800 bg-slate-900 min-h-[300px]">
          <p className="text-sm text-slate-500 italic">[Placeholder: RequestQueue & LeafletMap Component]</p>
        </div>
        <div className="p-6 rounded-lg border border-slate-800 bg-slate-900 min-h-[300px]">
          <p className="text-sm text-slate-500 italic">[Placeholder: Manual Override & StatsPanel Component]</p>
        </div>
      </div>
    </div>
  );
}
