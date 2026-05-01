"use client";
import { useEffect, useRef } from "react";
import type { WSEvent } from "@/types";

// Use env var if set (e.g. for tunnel/remote access), otherwise same-origin port 8000
const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL ??
  (typeof window !== "undefined"
    ? `ws://${window.location.hostname}:8000`
    : "ws://localhost:8000");

export function useProjectWebSocket(
  projectId: string | null,
  onEvent: (event: WSEvent) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const ws = new WebSocket(`${WS_BASE}/ws/${projectId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 20_000);
    };

    ws.onmessage = (ev) => {
      try {
        const event: WSEvent = JSON.parse(ev.data);
        onEvent(event);
      } catch {
        // ignore non-JSON (e.g. "pong")
      }
    };

    ws.onclose = () => {
      if (pingRef.current) clearInterval(pingRef.current);
    };

    return () => {
      ws.close();
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [projectId, onEvent]);

  return wsRef;
}
