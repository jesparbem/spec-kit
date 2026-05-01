"use client";
import { useEffect, useState } from "react";
import { listProjects } from "@/lib/api";
import type { Project } from "@/types";
import Link from "next/link";
import { PlusCircle, Loader, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

const STATUS_CONFIG = {
  running: { icon: <Loader size={14} className="animate-spin text-blue-400" />, color: "text-blue-400", bg: "bg-blue-900/20 border-blue-800" },
  completed: { icon: <CheckCircle size={14} className="text-emerald-400" />, color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800" },
  failed: { icon: <XCircle size={14} className="text-red-400" />, color: "text-red-400", bg: "bg-red-900/20 border-red-800" },
  pending: { icon: <Clock size={14} className="text-gray-400" />, color: "text-gray-400", bg: "bg-gray-800 border-gray-700" },
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects().then((ps) => { setProjects(ps); setLoading(false); });
    const interval = setInterval(() => listProjects().then(setProjects), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap size={24} className="text-indigo-400" />
            Software Factory
          </h1>
          <p className="text-gray-500 text-sm mt-1">AI agent swarm — Spec-Driven Development</p>
        </div>
        <Link
          href="/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition"
        >
          <PlusCircle size={16} /> New Project
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total projects", value: projects.length },
          { label: "Running", value: projects.filter((p) => p.status === "running").length },
          { label: "Completed", value: projects.filter((p) => p.status === "completed").length },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 rounded-xl border border-gray-800 px-5 py-4">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Projects list */}
      {loading ? (
        <div className="text-center text-gray-500 py-16 text-sm animate-pulse">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏭</div>
          <p className="text-gray-400 font-medium">No projects yet</p>
          <p className="text-gray-600 text-sm mt-1 mb-6">Launch the factory by creating your first spec</p>
          <Link href="/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition">
            <PlusCircle size={16} /> Create first project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const status = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 hover:border-indigo-700 rounded-xl transition-all group"
              >
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${status.bg} ${status.color}`}>
                  {status.icon}
                  <span className="capitalize">{p.status}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate group-hover:text-indigo-300 transition-colors">{p.name}</div>
                  <div className="text-gray-500 text-xs mt-0.5 truncate">{p.description}</div>
                </div>
                <div className="text-xs text-gray-600 shrink-0">
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
