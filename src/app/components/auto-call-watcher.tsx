"use client";

import { useEffect, useMemo, useRef } from "react";
import { autoCallNearServiceEndAction } from "@/lib/admin/queue-actions";

type AutoCallWatcherProps = {
  roomIds: string[];
};

const autoCallCheckIntervalMs = 15_000;

export function AutoCallWatcher({ roomIds }: AutoCallWatcherProps) {
  const stableRoomIds = useMemo(() => [...new Set(roomIds)].sort(), [roomIds]);
  const roomIdKey = stableRoomIds.join(",");
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (stableRoomIds.length === 0) {
      return;
    }

    async function checkAutoCall(): Promise<void> {
      if (inFlightRef.current || document.visibilityState !== "visible") {
        return;
      }

      inFlightRef.current = true;
      try {
        await autoCallNearServiceEndAction(stableRoomIds);
      } finally {
        inFlightRef.current = false;
      }
    }

    void checkAutoCall();
    const intervalId = window.setInterval(() => {
      void checkAutoCall();
    }, autoCallCheckIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [roomIdKey, stableRoomIds]);

  return null;
}
