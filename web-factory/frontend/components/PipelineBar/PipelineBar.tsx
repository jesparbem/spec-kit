"use client";
import { PHASE_ORDER, PHASE_COLORS, type PhaseState } from "@/types";
import { CheckCircle, Circle, Loader, XCircle, Clock } from "lucide-react";

const STATUS_ICON = {
  pending: <Clock size={16} className="text-gray-500" />,
  running: <Loader size={16} className="animate-spin text-blue-400" />,
  completed: <CheckCircle size={16} className="text-emerald-400" />,
  failed: <XCircle size={16} className="text-red-400" />,
};

interface PipelineBarProps {
  phases: Record<string, PhaseState>;
}

export default function PipelineBar({ phases }: PipelineBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-gray-900 border-b border-gray-800 overflow-x-auto">
      {PHASE_ORDER.map((phase, idx) => {
        const state = phases[phase] ?? { status: "pending" };
        const color = PHASE_COLORS[phase];
        const isActive = state.status === "running";
        const isDone = state.status === "completed";

        return (
          <div key={phase} className="flex items-center gap-1 shrink-0">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300"
              style={{
                background: isActive ? `${color}22` : isDone ? `${color}11` : "transparent",
                border: `1px solid ${isActive || isDone ? color : "#374151"}`,
                color: isActive || isDone ? color : "#6b7280",
              }}
            >
              {STATUS_ICON[state.status] ?? STATUS_ICON.pending}
              <span>{phase}</span>
            </div>
            {idx < PHASE_ORDER.length - 1 && (
              <div
                className="w-6 h-px mx-1 transition-all duration-500"
                style={{
                  background: isDone ? color : "#374151",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
