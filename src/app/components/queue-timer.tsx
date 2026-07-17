"use client";

import { useEffect, useState } from "react";
import { formatRemainingTime } from "@/lib/queue/timer";

type QueueTimerProps = {
  expectedEndAt: string | Date | null;
  serverNow: string | Date;
};

export function QueueTimer({ expectedEndAt, serverNow }: QueueTimerProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const serverOffset = new Date(serverNow).getTime() - Date.now();
    const interval = window.setInterval(() => {
      setNow(Date.now() + serverOffset);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [serverNow]);

  if (!expectedEndAt) {
    return <span>Chua bat dau</span>;
  }

  const remaining = Math.max(0, new Date(expectedEndAt).getTime() - (now ?? new Date(serverNow).getTime()));

  return <span>{formatRemainingTime(remaining)}</span>;
}
