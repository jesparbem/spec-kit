import SpecForm from "@/components/SpecForm/SpecForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition mb-6"
      >
        <ArrowLeft size={15} /> Back to dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Software Project</h1>
        <p className="text-gray-500 text-sm mt-1">
          Describe what you need — the AI agent swarm will design, plan, and build it for you.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <SpecForm />
      </div>
    </div>
  );
}
