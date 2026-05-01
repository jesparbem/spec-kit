export type AgentStatus = "idle" | "thinking" | "working" | "done" | "error";
export type PhaseStatus = "pending" | "running" | "completed" | "failed";

export interface AgentUpdate {
  type: "agent_update";
  agent_id: string;
  phase: string;
  status: AgentStatus;
  content: string;
  artifact: string | null;
  timestamp: string;
}

export interface PhaseUpdate {
  type: "phase_update";
  phase: string;
  status: PhaseStatus;
  timestamp: string;
}

export interface FactoryComplete {
  type: "factory_complete";
  summary: string;
  timestamp: string;
}

export interface FactoryError {
  type: "factory_error";
  error: string;
  phase: string;
  timestamp: string;
}

export type WSEvent = AgentUpdate | PhaseUpdate | FactoryComplete | FactoryError;

export interface AgentState {
  id: string;
  phase: string;
  status: AgentStatus;
  log: string[];
  artifact: string | null;
  lastUpdate: string;
}

export interface PhaseState {
  name: string;
  status: PhaseStatus;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

export interface Artifact {
  id: string;
  file_path: string;
  content: string;
}

export const PHASE_ORDER = ["SPECIFY", "PLAN", "TASKS", "BUILD", "TEST", "REVIEW"] as const;
export type PhaseName = typeof PHASE_ORDER[number];

export const PHASE_COLORS: Record<string, string> = {
  SPECIFY: "#818cf8",
  PLAN: "#34d399",
  TASKS: "#fbbf24",
  BUILD: "#60a5fa",
  TEST: "#f472b6",
  REVIEW: "#a78bfa",
};

export const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: "#374151",
  thinking: "#2563eb",
  working: "#d97706",
  done: "#059669",
  error: "#dc2626",
};
