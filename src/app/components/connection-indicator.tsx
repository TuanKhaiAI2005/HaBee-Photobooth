"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ConnectionState = "connecting" | "connected" | "syncing" | "degraded" | "offline" | "error";
type IndicatorMode = "admin" | "staff" | "customer" | "public";

type QueueConnectionIndicatorProps = {
  roomId?: string;
  mode?: IndicatorMode;
  fallbackMs?: number;
};

const DEFAULT_FALLBACK_MS = 10_000;
const CUSTOMER_FALLBACK_MS = 15_000;
const REFRESH_DEBOUNCE_MS = 350;
const SUBSCRIBE_TIMEOUT_MS = 8_000;

function formatTime(date: Date | null): string | null {
  return date ? date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null;
}

function getConnectionText(state: ConnectionState, mode: IndicatorMode, lastSyncedAt: Date | null): string {
  const lastSync = formatTime(lastSyncedAt);

  if (mode === "customer") {
    if (state === "connecting" || state === "syncing") return "Đang cập nhật lượt của bạn";
    if (state === "connected") return lastSync ? `Đã kết nối. Đồng bộ lần cuối lúc ${lastSync}` : "Đã kết nối";
    if (state === "offline") return "Mất mạng - vui lòng kiểm tra kết nối";
    if (state === "degraded") return "Kết nối yếu - hệ thống đang tự cập nhật";
    return "Không thể đồng bộ lượt của bạn";
  }

  if (state === "connecting") return "Đang kết nối";
  if (state === "connected") return lastSync ? `Realtime đã kết nối. Đồng bộ lần cuối lúc ${lastSync}` : "Realtime đã kết nối";
  if (state === "syncing") return "Đang đồng bộ";
  if (state === "degraded") return "Kết nối không ổn định - đang tự làm mới";
  if (state === "offline") return "Mất mạng";
  return "Không thể đồng bộ";
}

export function QueueConnectionIndicator({
  roomId,
  mode = "admin",
  fallbackMs,
}: QueueConnectionIndicatorProps) {
  const router = useRouter();
  const [state, setState] = useState<ConnectionState>("connecting");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const dirtyRef = useRef(false);
  const mountedRef = useRef(false);
  const intervalMs = fallbackMs ?? (mode === "customer" || mode === "public" ? CUSTOMER_FALLBACK_MS : DEFAULT_FALLBACK_MS);

  const text = useMemo(() => getConnectionText(state, mode, lastSyncedAt), [lastSyncedAt, mode, state]);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let subscribed = false;
    let intentionalClose = false;
    let subscribeTimeout: ReturnType<typeof setTimeout> | null = null;

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const runRefresh = () => {
      if (!mountedRef.current || (typeof navigator !== "undefined" && !navigator.onLine)) {
        return;
      }

      if (inFlightRef.current) {
        dirtyRef.current = true;
        return;
      }

      inFlightRef.current = true;
      setState((current) => (current === "connected" ? "syncing" : current));
      router.refresh();
      window.setTimeout(() => {
        inFlightRef.current = false;
        setLastSyncedAt(new Date());
        setState((current) => (current === "syncing" ? (subscribed ? "connected" : "degraded") : current));

        if (dirtyRef.current) {
          dirtyRef.current = false;
          runRefresh();
        }
      }, 0);
    };

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = setTimeout(runRefresh, REFRESH_DEBOUNCE_MS);
    };

    const startPolling = () => {
      if (pollingRef.current || (typeof navigator !== "undefined" && !navigator.onLine)) {
        return;
      }

      pollingRef.current = setInterval(() => {
        if (document.visibilityState !== "visible") {
          return;
        }

        runRefresh();
      }, intervalMs);
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      window.setTimeout(() => setState("offline"), 0);
    } else if (!supabase) {
      window.setTimeout(() => setState("degraded"), 0);
      startPolling();
    } else {
      window.setTimeout(() => setState("connecting"), 0);
      subscribeTimeout = setTimeout(() => {
        if (!subscribed) {
          setState("degraded");
          startPolling();
        }
      }, SUBSCRIBE_TIMEOUT_MS);

      channel = supabase
        .channel(roomId ? `queue-events:${roomId}` : "queue-events:public-overview")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "QueueEvent",
            ...(roomId ? { filter: `roomId=eq.${roomId}` } : {}),
          },
          scheduleRefresh,
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            subscribed = true;
            setState("connected");
            stopPolling();
            if (subscribeTimeout) {
              clearTimeout(subscribeTimeout);
              subscribeTimeout = null;
            }
          }

          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || (status === "CLOSED" && !intentionalClose)) {
            subscribed = false;
            setState("degraded");
            startPolling();
          }
        });
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runRefresh();
        if (!subscribed) {
          startPolling();
        }
      }
    };

    const onOffline = () => {
      setState("offline");
      stopPolling();
    };

    const onOnline = () => {
      setState(subscribed ? "syncing" : "degraded");
      runRefresh();
      if (!subscribed) {
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      mountedRef.current = false;
      intentionalClose = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      stopPolling();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (subscribeTimeout) {
        clearTimeout(subscribeTimeout);
      }
      if (channel && supabase) {
        void supabase.removeChannel(channel);
      }
    };
  }, [intervalMs, mode, roomId, router]);

  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-muted-text)]" role="status">
      {text}
    </div>
  );
}
