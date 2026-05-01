"use client";
import { useEffect, useState } from "react";
import { getConfig, updateConfig, getModels } from "@/lib/api";
import { Save, RotateCcw } from "lucide-react";

const AGENT_LABELS: Record<string, string> = {
  spec_agent_model: "Specification Agent",
  plan_agent_model: "Planning Agent",
  task_agent_model: "Task Decomposition Agent",
  build_agent_model: "Build Agents",
  test_agent_model: "Test Agent",
  review_agent_model: "Review Agent",
};

export default function AgentConfigPanel() {
  const [config, setConfig] = useState<Record<string, string | number>>({});
  const [models, setModels] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getConfig(), getModels()]).then(([cfg, mdls]) => {
      setConfig(cfg);
      setModels(mdls);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await updateConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <div className="text-gray-500 text-sm animate-pulse">Loading configuration...</div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-4">
        {Object.entries(AGENT_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-gray-200">{label}</div>
              <div className="text-xs text-gray-500 font-mono">{key}</div>
            </div>
            <select
              value={String(config[key] ?? "")}
              onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition min-w-[240px]"
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        ))}

        {/* Max parallel build agents */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-gray-200">Max parallel build agents</div>
            <div className="text-xs text-gray-500">How many build tasks run simultaneously</div>
          </div>
          <input
            type="number"
            min={1}
            max={8}
            value={Number(config.max_parallel_build_agents ?? 3)}
            onChange={(e) =>
              setConfig((c) => ({ ...c, max_parallel_build_agents: parseInt(e.target.value) }))
            }
            className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition"
        >
          <Save size={15} />
          {saved ? "Saved!" : "Save configuration"}
        </button>
        <button
          onClick={() => getConfig().then(setConfig)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition"
        >
          <RotateCcw size={15} /> Reset
        </button>
      </div>
    </div>
  );
}
