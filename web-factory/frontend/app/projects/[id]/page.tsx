"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProject, listArtifacts } from "@/lib/api";
import { useProjectWebSocket } from "@/lib/ws";
import { useSwarmStore } from "@/store/swarmStore";
import PipelineBar from "@/components/PipelineBar/PipelineBar";
import SwarmGraph from "@/components/SwarmGraph/SwarmGraph";
import ActivityFeed from "@/components/ActivityFeed/ActivityFeed";
import MarkdownViewer from "@/components/MarkdownViewer/MarkdownViewer";
import type { Project, WSEvent } from "@/types";
import Link from "next/link";
import { ArrowLeft, Network, Terminal, FileText } from "lucide-react";

type Tab = "swarm" | "logs" | "docs";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("swarm");

  const {
    agents, phases, activityLog, artifacts, selectedAgentId,
    processEvent, reset, selectAgent, setArtifacts,
  } = useSwarmStore();

  useEffect(() => {
    reset();
    getProject(id).then(setProject);
    listArtifacts(id).then(setArtifacts);
  }, [id, reset, setArtifacts]);

  // Refresh artifacts every 10s during run
  useEffect(() => {
    const interval = setInterval(() => {
      listArtifacts(id).then(setArtifacts);
    }, 10_000);
    return () => clearInterval(interval);
  }, [id, setArtifacts]);

  const onEvent = useCallback(
    (event: WSEvent) => {
      processEvent(event);
      if (event.type === "factory_complete" || event.type === "factory_error") {
        listArtifacts(id).then(setArtifacts);
      }
    },
    [processEvent, id, setArtifacts]
  );

  useProjectWebSocket(id, onEvent);

  const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "swarm", label: "Agent Swarm", icon: <Network size={15} /> },
    { id: "logs", label: "Activity Log", icon: <Terminal size={15} /> },
    { id: "docs", label: "Documents", icon: <FileText size={15} /> },
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-4 shrink-0">
        <Link href="/" className="text-gray-500 hover:text-white transition">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">{project?.name ?? "Loading..."}</h1>
          <p className="text-xs text-gray-500 truncate max-w-xl">{project?.description}</p>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${
            project?.status === "completed"
              ? "bg-emerald-900/30 border-emerald-700 text-emerald-400"
              : project?.status === "running"
              ? "bg-blue-900/30 border-blue-700 text-blue-400"
              : project?.status === "failed"
              ? "bg-red-900/30 border-red-700 text-red-400"
              : "bg-gray-800 border-gray-700 text-gray-400"
          }`}
        >
          {project?.status ?? "loading"}
        </span>
      </div>

      {/* Pipeline */}
      <PipelineBar phases={phases} />

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-gray-800 shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? "bg-indigo-900/40 text-indigo-300 border border-indigo-700"
                : "text-gray-500 hover:text-white hover:bg-gray-800"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}

        {/* Agent filter badge when one selected */}
        {selectedAgentId && tab === "logs" && (
          <div className="ml-auto flex items-center gap-2 text-xs text-indigo-400">
            Filtering: {selectedAgentId}
            <button onClick={() => selectAgent(null)} className="hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        {tab === "swarm" && (
          <div className="flex gap-4 h-full">
            <div className="flex-1 h-full rounded-xl border border-gray-800 overflow-hidden bg-gray-950">
              <SwarmGraph
                agents={agents}
                onSelectAgent={selectAgent}
                selectedAgentId={selectedAgentId}
              />
            </div>

            {/* Agent inspector drawer */}
            {selectedAgentId && agents[selectedAgentId] && (
              <div className="w-80 shrink-0 flex flex-col gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white truncate">{selectedAgentId}</span>
                    <button onClick={() => selectAgent(null)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Phase: <span className="text-indigo-300">{agents[selectedAgentId].phase}</span></div>
                    <div>Status: <span className="text-emerald-300 capitalize">{agents[selectedAgentId].status}</span></div>
                    {agents[selectedAgentId].artifact && (
                      <div>Artifact: <span className="text-yellow-300">{agents[selectedAgentId].artifact}</span></div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ActivityFeed
                    log={activityLog}
                    agentFilter={selectedAgentId}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "logs" && (
          <div className="h-full">
            <ActivityFeed log={activityLog} agentFilter={null} />
          </div>
        )}

        {tab === "docs" && (
          <div className="h-full bg-gray-900 border border-gray-800 rounded-xl p-4">
            <MarkdownViewer artifacts={artifacts} />
          </div>
        )}
      </div>
    </div>
  );
}
