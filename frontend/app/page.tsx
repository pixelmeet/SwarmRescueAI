import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
      <div className="inline-block px-3 py-1 bg-red-950 text-red-400 border border-red-800 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
        SwarmRescue AI Platform
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
        Multi-Agent Emergency Response Coordination
      </h1>
      <p className="text-lg text-slate-400 mb-8 max-w-2xl">
        Autonomous triage, dynamic scoring dispatch, and real-time spatial positioning for disaster management teams.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Link
          href="/report"
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition text-left group"
        >
          <div className="text-red-400 font-bold mb-1 group-hover:underline">Report Emergency &rarr;</div>
          <div className="text-xs text-slate-400">Citizen intake & location picker form</div>
        </Link>

        <Link
          href="/admin"
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition text-left group"
        >
          <div className="text-blue-400 font-bold mb-1 group-hover:underline">Admin Command &rarr;</div>
          <div className="text-xs text-slate-400">Live queue, spatial map & dispatch overrides</div>
        </Link>

        <Link
          href="/team"
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition text-left group"
        >
          <div className="text-emerald-400 font-bold mb-1 group-hover:underline">Responder Portal &rarr;</div>
          <div className="text-xs text-slate-400">Field team & volunteer task view</div>
        </Link>

        <Link
          href="/analytics"
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition text-left group"
        >
          <div className="text-purple-400 font-bold mb-1 group-hover:underline">Analytics &rarr;</div>
          <div className="text-xs text-slate-400">Response time stats & metrics</div>
        </Link>
      </div>
    </main>
  );
}
