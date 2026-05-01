import { create } from "zustand";
import type { AgentState, PhaseState, Artifact, WSEvent, PhaseStatus } from "@/types";
import { PHASE_ORDER } from "@/types";

interface SwarmStore {
  agents: Record<string, AgentState>;
  phases: Record<string, PhaseState>;
  artifacts: Artifact[];
  factoryStatus: "idle" | "running" | "completed" | "failed";
  activityLog: Array<{ agent_id: string; content: string; timestamp: string; phase: string }>;
  selectedAgentId: string | null;

  processEvent: (event: WSEvent) => void;
  reset: () => void;
  selectAgent: (id: string | null) => void;
  setArtifacts: (artifacts: Artifact[]) => void;
}

const initialPhases = (): Record<string, PhaseState> =>
  Object.fromEntries(PHASE_ORDER.map((p) => [p, { name: p, status: "pending" as PhaseStatus }]));

export const useSwarmStore = create<SwarmStore>((set) => ({
  agents: {},
  phases: initialPhases(),
  artifacts: [],
  factoryStatus: "idle",
  activityLog: [],
  selectedAgentId: null,

  processEvent(event) {
    set((state) => {
      if (event.type === "agent_update") {
        const prev = state.agents[event.agent_id] ?? {
          id: event.agent_id,
          phase: event.phase,
          status: event.status,
          log: [],
          artifact: null,
          lastUpdate: event.timestamp,
        };
        const newLog = event.content
          ? [...prev.log, event.content].slice(-500)
          : prev.log;
        return {
          agents: {
            ...state.agents,
            [event.agent_id]: {
              ...prev,
              status: event.status,
              artifact: event.artifact ?? prev.artifact,
              log: newLog,
              lastUpdate: event.timestamp,
            },
          },
          activityLog: event.content
            ? [
                ...state.activityLog,
                {
                  agent_id: event.agent_id,
                  content: event.content,
                  timestamp: event.timestamp,
                  phase: event.phase,
                },
              ].slice(-200)
            : state.activityLog,
        };
      }

      if (event.type === "phase_update") {
        return {
          phases: {
            ...state.phases,
            [event.phase]: { name: event.phase, status: event.status },
          },
          factoryStatus: event.status === "running" ? "running" : state.factoryStatus,
        };
      }

      if (event.type === "factory_complete") {
        return { factoryStatus: "completed" };
      }

      if (event.type === "factory_error") {
        return { factoryStatus: "failed" };
      }

      return state;
    });
  },

  reset() {
    set({ agents: {}, phases: initialPhases(), artifacts: [], factoryStatus: "idle", activityLog: [], selectedAgentId: null });
  },

  selectAgent(id) {
    set({ selectedAgentId: id });
  },

  setArtifacts(artifacts) {
    set({ artifacts });
  },
}));
