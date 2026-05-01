"use client";
import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import AgentNode from "./AgentNode";
import type { AgentState } from "@/types";
import { PHASE_ORDER, PHASE_COLORS } from "@/types";

const NODE_TYPES = { agentNode: AgentNode };
const NODE_WIDTH = 190;
const NODE_HEIGHT = 110;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 80, nodesep: 40 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id);
      return { ...n, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } };
    }),
    edges,
  };
}

interface SwarmGraphProps {
  agents: Record<string, AgentState>;
  onSelectAgent: (id: string | null) => void;
  selectedAgentId: string | null;
}

export default function SwarmGraph({ agents, onSelectAgent, selectedAgentId }: SwarmGraphProps) {
  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
    const agentList = Object.values(agents);
    if (agentList.length === 0) return { nodes: [], edges: [] };

    const nodeMap: Record<string, Node> = {};
    agentList.forEach((agent) => {
      nodeMap[agent.id] = {
        id: agent.id,
        type: "agentNode",
        position: { x: 0, y: 0 },
        selected: agent.id === selectedAgentId,
        data: {
          label: agent.id.replace(/-[a-f0-9]{6,8}$/, ""),
          phase: agent.phase,
          status: agent.status,
          artifact: agent.artifact,
        },
      };
    });

    // Create edges following phase order
    const edges: Edge[] = [];
    const phaseAgents: Record<string, string[]> = {};
    agentList.forEach((a) => {
      phaseAgents[a.phase] = phaseAgents[a.phase] ?? [];
      phaseAgents[a.phase].push(a.id);
    });

    PHASE_ORDER.forEach((phase, idx) => {
      if (idx === 0) return;
      const prev = PHASE_ORDER[idx - 1];
      const fromIds = phaseAgents[prev] ?? [];
      const toIds = phaseAgents[phase] ?? [];
      fromIds.forEach((from) => {
        toIds.forEach((to) => {
          edges.push({
            id: `${from}->${to}`,
            source: from,
            target: to,
            style: { stroke: PHASE_COLORS[phase] ?? "#6366f1", strokeWidth: 1.5 },
            animated: true,
          });
        });
      });
    });

    return { nodes: Object.values(nodeMap), edges };
  }, [agents, selectedAgentId]);

  const { nodes, edges } = useMemo(
    () => getLayoutedElements(rawNodes, rawEdges),
    [rawNodes, rawEdges]
  );

  const [flowNodes, , onNodesChange] = useNodesState(nodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(edges);

  const onConnect = useCallback(
    (params: Connection) => addEdge(params, flowEdges),
    [flowEdges]
  );

  if (Object.keys(agents).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
        <div className="text-5xl">🏭</div>
        <p className="text-lg font-medium">Waiting for agents to start...</p>
        <p className="text-sm">Create a project to launch the swarm</p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={NODE_TYPES}
      onNodeClick={(_, node) => onSelectAgent(node.id === selectedAgentId ? null : node.id)}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      className="h-full w-full"
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f2937" />
      <Controls className="!bg-gray-800 !border-gray-700 !text-white" />
      <MiniMap
        nodeColor={(n) => STATUS_COLORS_MAP[(n.data as { status: string }).status] ?? "#374151"}
        className="!bg-gray-900 !border-gray-700"
      />
    </ReactFlow>
  );
}

const STATUS_COLORS_MAP: Record<string, string> = {
  idle: "#374151",
  thinking: "#2563eb",
  working: "#d97706",
  done: "#059669",
  error: "#dc2626",
};
