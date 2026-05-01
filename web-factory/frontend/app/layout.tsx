import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Factory, Settings, PlusCircle, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Software Factory — AI Agent Swarm",
  description: "Spec-Driven software manufacturing portal powered by Claude agents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0e1a] text-gray-100">
        {/* Sidebar */}
        <div className="flex h-screen overflow-hidden">
          <aside className="w-16 md:w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
            {/* Logo */}
            <div className="px-4 py-5 border-b border-gray-800 flex items-center gap-3">
              <Factory size={24} className="text-indigo-400 shrink-0" />
              <span className="hidden md:block text-sm font-bold text-white leading-tight">
                Software<br />Factory
              </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-2 space-y-1 mt-2">
              <NavLink href="/" icon={<Home size={18} />} label="Dashboard" />
              <NavLink href="/new" icon={<PlusCircle size={18} />} label="New Project" />
              <NavLink href="/settings" icon={<Settings size={18} />} label="Agent Config" />
            </nav>

            {/* Footer badge */}
            <div className="p-3 border-t border-gray-800">
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                spec-kit SDD
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors group"
    >
      <span className="shrink-0">{icon}</span>
      <span className="hidden md:block text-sm font-medium">{label}</span>
    </Link>
  );
}
