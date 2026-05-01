"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, type SpecInput } from "@/lib/api";
import { Plus, Trash2, Rocket } from "lucide-react";

const ALL_PHASES = ["SPECIFY", "PLAN", "TASKS", "BUILD", "TEST", "REVIEW"];

export default function SpecForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SpecInput>({
    name: "",
    description: "",
    target_users: "",
    acceptance_criteria: [""],
    preferred_stack: "",
    enabled_phases: [...ALL_PHASES],
  });

  const updateField = <K extends keyof SpecInput>(key: K, value: SpecInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateCriteria = (idx: number, val: string) => {
    const updated = [...form.acceptance_criteria];
    updated[idx] = val;
    updateField("acceptance_criteria", updated);
  };

  const addCriteria = () => updateField("acceptance_criteria", [...form.acceptance_criteria, ""]);
  const removeCriteria = (idx: number) =>
    updateField(
      "acceptance_criteria",
      form.acceptance_criteria.filter((_, i) => i !== idx)
    );

  const togglePhase = (phase: string) => {
    const has = form.enabled_phases.includes(phase);
    updateField(
      "enabled_phases",
      has ? form.enabled_phases.filter((p) => p !== phase) : [...form.enabled_phases, phase]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const project = await createProject({
        ...form,
        acceptance_criteria: form.acceptance_criteria.filter(Boolean),
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Project name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Project name *</label>
        <input
          required
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="e.g. Customer Portal MVP"
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">What do you want to build? *</label>
        <textarea
          required
          rows={5}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Describe the software you need in plain language. The more detail, the better the output."
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition resize-none"
        />
      </div>

      {/* Target users */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Target users</label>
        <input
          value={form.target_users}
          onChange={(e) => updateField("target_users", e.target.value)}
          placeholder="e.g. Small business owners, internal ops team"
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Acceptance criteria */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Acceptance criteria</label>
        <div className="space-y-2">
          {form.acceptance_criteria.map((c, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                value={c}
                onChange={(e) => updateCriteria(idx, e.target.value)}
                placeholder={`Criterion ${idx + 1}`}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition text-sm"
              />
              <button
                type="button"
                onClick={() => removeCriteria(idx)}
                className="p-2 text-gray-500 hover:text-red-400 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCriteria}
          className="mt-2 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition"
        >
          <Plus size={14} /> Add criterion
        </button>
      </div>

      {/* Preferred stack */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Preferred tech stack (optional)</label>
        <input
          value={form.preferred_stack}
          onChange={(e) => updateField("preferred_stack", e.target.value)}
          placeholder="e.g. React + FastAPI + PostgreSQL"
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Enabled phases */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Manufacturing phases</label>
        <div className="flex flex-wrap gap-2">
          {ALL_PHASES.map((phase) => {
            const active = form.enabled_phases.includes(phase);
            return (
              <button
                key={phase}
                type="button"
                onClick={() => togglePhase(phase)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  active
                    ? "bg-indigo-900/50 border-indigo-500 text-indigo-300"
                    : "bg-gray-800 border-gray-700 text-gray-500"
                }`}
              >
                {phase}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-400 text-white font-semibold rounded-lg transition-all"
      >
        {loading ? (
          <span className="animate-spin text-lg">⟳</span>
        ) : (
          <Rocket size={18} />
        )}
        {loading ? "Launching agents..." : "Launch Software Factory"}
      </button>
    </form>
  );
}
