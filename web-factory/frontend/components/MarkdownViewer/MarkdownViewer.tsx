"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import type { Artifact } from "@/types";
import { useState } from "react";
import { FileText } from "lucide-react";

interface MarkdownViewerProps {
  artifacts: Artifact[];
}

export default function MarkdownViewer({ artifacts }: MarkdownViewerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const mdArtifacts = artifacts.filter((a) =>
    a.file_path.endsWith(".md") || a.file_path.endsWith(".txt")
  );

  const current = mdArtifacts.find((a) => a.file_path === selected) ?? mdArtifacts[0] ?? null;

  if (mdArtifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
        <FileText size={32} />
        <p className="text-sm">No documents generated yet</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-3">
      {/* File list */}
      <div className="w-48 shrink-0 flex flex-col gap-1 border-r border-gray-800 pr-3 overflow-y-auto">
        {mdArtifacts.map((a) => {
          const name = a.file_path.split("/").pop() ?? a.file_path;
          const isActive = (selected ?? mdArtifacts[0]?.file_path) === a.file_path;
          return (
            <button
              key={a.file_path}
              onClick={() => setSelected(a.file_path)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-mono transition-colors ${
                isActive
                  ? "bg-indigo-900/40 text-indigo-300 border border-indigo-700"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              📄 {name}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto prose prose-invert prose-sm max-w-none px-2">
        {current ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {current.content}
          </ReactMarkdown>
        ) : (
          <p className="text-gray-500">Select a file</p>
        )}
      </div>
    </div>
  );
}
