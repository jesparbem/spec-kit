import type { Project, Artifact } from "@/types";

const BASE = "/api";

export interface SpecInput {
  name: string;
  description: string;
  target_users: string;
  acceptance_criteria: string[];
  preferred_stack: string;
  enabled_phases: string[];
}

export async function createProject(spec: SpecInput): Promise<Project> {
  const res = await fetch(`${BASE}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(spec),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE}/projects/`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getProject(id: string): Promise<Project> {
  const res = await fetch(`${BASE}/projects/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listArtifacts(projectId: string): Promise<Artifact[]> {
  const res = await fetch(`${BASE}/projects/${projectId}/artifacts`);
  if (!res.ok) return [];
  return res.json();
}

export async function getConfig() {
  const res = await fetch(`${BASE}/config/`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateConfig(cfg: Record<string, unknown>) {
  const res = await fetch(`${BASE}/config/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getModels(): Promise<string[]> {
  const res = await fetch(`${BASE}/config/models`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.models ?? [];
}
