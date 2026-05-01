import AgentConfigPanel from "@/components/AgentConfigPanel/AgentConfigPanel";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Settings size={22} className="text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Configuration</h1>
          <p className="text-gray-500 text-sm mt-1">
            Choose the Claude model for each manufacturing phase
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <AgentConfigPanel />
      </div>

      <div className="mt-6 p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-sm text-gray-500">
        <p className="font-medium text-gray-400 mb-2">Model recommendations</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><span className="text-indigo-300">claude-opus-4-7</span> — Best for Specification and Planning (complex reasoning)</li>
          <li><span className="text-blue-300">claude-sonnet-4-6</span> — Best for Build and Review (balanced speed/quality)</li>
          <li><span className="text-emerald-300">claude-haiku-4-5</span> — Best for Testing (fast, cost-effective)</li>
        </ul>
      </div>
    </div>
  );
}
