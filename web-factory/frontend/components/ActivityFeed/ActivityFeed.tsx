"use client";
import { useEffect, useRef } from "react";
import { PHASE_COLORS } from "@/types";

interface LogEntry {
  agent_id: string;
  content: string;
  timestamp: string;
  phase: string;
}

interface ActivityFeedProps {
  log: LogEntry[];
  agentFilter?: string | null;
}

export default function ActivityFeed({ log, agentFilter }: ActivityFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const filtered = agentFilter ? log.filter((e) => e.agent_id === agentFilter) : log;

  return (
    <div className="h-full flex flex-col bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-mono text-gray-400">
          {agentFilter ? `Agent: ${agentFilter}` : "All agents"} — {filtered.length} events
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
        {filtered.length === 0 && (
          <div className="text-gray-600 text-center mt-8">No activity yet</div>
        )}
        {filtered.map((entry, i) => (
          <div key={i} className="flex gap-2 leading-relaxed">
            <span
              className="shrink-0 font-bold"
              style={{ color: PHASE_COLORS[entry.phase] ?? "#6366f1" }}
            >
              [{entry.agent_id.split("-").slice(0, 2).join("-")}]
            </span>
            <span className="text-gray-300 whitespace-pre-wrap break-all">{entry.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
