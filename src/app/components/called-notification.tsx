"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  startNotificationSound,
  type NotificationSoundHandle,
} from "@/lib/browser/notification-sound";

type CalledTicket = {
  id: string;
  ticketCode: string;
  customerName?: string;
  normalizedPhone?: string;
  roomId: string;
  roomName: string;
  calledAt: Date | string | null;
};

type CalledNotificationProps = {
  ticket: CalledTicket | null;
  mode: "admin" | "customer";
};

const notificationSoundDurationMs = 20_000;

function canUseBrowserNotifications(): boolean {
  return "Notification" in window;
}

function showBrowserNotification(ticket: CalledTicket, mode: "admin" | "customer"): void {
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") {
    return;
  }

  const title = mode === "admin" ? "Vé vừa được gọi" : "Đã tới lượt của bạn";
  const body = mode === "admin"
    ? `${ticket.ticketCode} - ${ticket.roomName}`
    : `Vé ${ticket.ticketCode} được gọi vào ${ticket.roomName}.`;

  new Notification(title, {
    body,
    tag: `called-${ticket.id}`,
  });
}

export function CalledNotification({ ticket, mode }: CalledNotificationProps) {
  const isCustomerMode = mode === "customer";
  const [visibleTicket, setVisibleTicket] = useState<CalledTicket | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const soundRef = useRef<NotificationSoundHandle | null>(null);

  const eventKey = useMemo(() => (ticket?.calledAt ? `${ticket.id}:${new Date(ticket.calledAt).toISOString()}` : null), [ticket]);

  const playSound = useCallback((durationMs: number, loop: boolean): void => {
    soundRef.current?.stop();
    soundRef.current = startNotificationSound({ durationMs, loop });
  }, []);

  useEffect(() => {
    if (!ticket || !eventKey || seenRef.current.has(eventKey)) {
      return;
    }

    seenRef.current.add(eventKey);
    setVisibleTicket(ticket);

    if (isCustomerMode && "vibrate" in navigator) {
      navigator.vibrate?.([160, 80, 160]);
    }

    if (isCustomerMode) {
      showBrowserNotification(ticket, mode);
    }

    if (isCustomerMode) {
      playSound(notificationSoundDurationMs, true);
    }
  }, [eventKey, isCustomerMode, mode, playSound, ticket]);

  useEffect(() => {
    if (!eventKey) {
      soundRef.current?.stop();
      soundRef.current = null;
    }

    return () => {
      soundRef.current?.stop();
      soundRef.current = null;
    };
  }, [eventKey]);

  function dismissNotification(): void {
    soundRef.current?.stop();
    soundRef.current = null;
    setVisibleTicket(null);
  }

  return (
    <>
      {visibleTicket ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-surface)] p-4 text-[var(--color-navy)] shadow-[5px_5px_0_var(--color-navy)]" role="status">
          <p className="text-xs font-black uppercase text-[var(--color-muted-text)]">{mode === "admin" ? "Vé vừa được gọi" : "Đã tới lượt của bạn"}</p>
          <h2 className="mt-1 text-2xl font-black">{visibleTicket.ticketCode}</h2>
          <p className="mt-2 text-sm">Phòng: <strong>{visibleTicket.roomName}</strong></p>
          {mode === "admin" ? (
            <p className="text-sm">{visibleTicket.customerName} - {visibleTicket.normalizedPhone}</p>
          ) : (
            <p className="text-sm">Vui lòng di chuyển vào đúng phòng khi đến lượt.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="photo-button" onClick={dismissNotification} type="button">
              Đã hiểu
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
