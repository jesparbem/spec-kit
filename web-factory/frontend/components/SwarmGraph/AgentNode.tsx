"use client";
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { AgentStatus } from "@/types";
import { STATUS_COLORS, PHASE_COLORS } from "@/types";

interface AgentNodeData {
  label: string;
  phase: string;
  status: AgentStatus;
  artifact: string | null;
}

const STATUS_ICONS: Record<AgentStatus, string> = {
  idle: "○",
  thinking: "◌",
  working: "◉",
  done: "●",
  error: "✕",
};

function AgentNode({ data, selected }: { data: AgentNodeData; selected?: boolean }) {
  const bg = STATUS_COLORS[data.status] ?? "#374151";
  const phaseBorder = PHASE_COLORS[data.phase] ?? "#6366f1";

  return (
    <div
      className="relative rounded-xl px-4 py-3 min-w-[160px] shadow-lg transition-all duration-300"
      style={{
        background: "#111827",
        border: `2px solid ${selected ? "#fff" : phaseBorder}`,
        boxShadow: `0 0 ${data.status === "working" ? "20px" : "6px"} ${phaseBorder}55`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-600 !border-gray-500" />

      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="text-base font-mono leading-none"
          style={{ color: bg }}
        >
          {STATUS_ICONS[data.status]}
        </span>
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: phaseBorder }}
        >
          {data.phase}
        </span>
      </div>

      {/* Agent label */}
      <div className="text-white text-sm font-semibold truncate max-w-[140px]">
        {data.label}
      </div>

      {/* Status badge */}
      <div className="mt-2 flex items-center gap-1">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: bg }}
        />
        <span className="text-xs text-gray-400 capitalize">{data.status}</span>
      </div>

      {/* Artifact if present */}
      {data.artifact && (
        <div className="mt-1 text-xs text-indigo-400 truncate max-w-[140px]" title={data.artifact}>
          📄 {data.artifact.split("/").pop()}
        </div>
      )}

      {/* Pulse ring when working */}
      {data.status === "working" && (
        <div
          className="absolute inset-0 rounded-xl animate-ping opacity-20 pointer-events-none"
          style={{ background: phaseBorder }}
        />
      )}

      <Handle type="source" position={Position.Right} className="!bg-gray-600 !border-gray-500" />
    </div>
  );
}

export default memo(AgentNode);
