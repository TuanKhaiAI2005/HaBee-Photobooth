"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

function beep(): void {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 880;
  gain.gain.value = 0.05;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
}

export function CalledNotification({ ticket, mode }: CalledNotificationProps) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem("photoSoundEnabled") === "1";
  });
  const [visibleTicket, setVisibleTicket] = useState<CalledTicket | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  const eventKey = useMemo(() => (ticket?.calledAt ? `${ticket.id}:${new Date(ticket.calledAt).toISOString()}` : null), [ticket]);

  useEffect(() => {
    if (!ticket || !eventKey || seenRef.current.has(eventKey)) {
      return;
    }

    seenRef.current.add(eventKey);
    setVisibleTicket(ticket);

    if (mode === "customer" && "vibrate" in navigator) {
      navigator.vibrate?.([160, 80, 160]);
    }

    if (soundEnabled) {
      try {
        beep();
      } catch {
        // Browser autoplay/audio failures are intentionally ignored.
      }
    }
  }, [eventKey, mode, soundEnabled, ticket]);

  function toggleSound(enabled: boolean): void {
    localStorage.setItem("photoSoundEnabled", enabled ? "1" : "0");
    setSoundEnabled(enabled);
    if (enabled) {
      try {
        beep();
      } catch {
        // The visible UI remains usable if the browser blocks audio.
      }
    }
  }

  return (
    <>
      <div className="photo-card-soft flex flex-wrap items-center gap-3" aria-live="polite">
        <span className="text-sm font-bold">Âm thanh thông báo</span>
        <button className={soundEnabled ? "photo-button-secondary" : "photo-button"} onClick={() => toggleSound(!soundEnabled)} type="button">
          {soundEnabled ? "Tắt âm thanh" : "Bật âm thanh thông báo"}
        </button>
      </div>
      {visibleTicket ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-surface)] p-4 text-[var(--color-navy)] shadow-[5px_5px_0_var(--color-navy)]" role="status">
          <p className="text-xs font-black uppercase text-[var(--color-muted-text)]">{mode === "admin" ? "Vé vừa được gọi" : "Đã tới lượt của bạn"}</p>
          <h2 className="mt-1 text-2xl font-black">{visibleTicket.ticketCode}</h2>
          <p className="mt-2 text-sm">Phòng: <strong>{visibleTicket.roomName}</strong></p>
          {mode === "admin" ? (
            <p className="text-sm">{visibleTicket.customerName} - {visibleTicket.normalizedPhone}</p>
          ) : (
            <p className="text-sm">Vui lòng di chuyển vào đúng phòng và bấm xác nhận khi bạn đã vào phòng.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {mode === "admin" ? (
              <Link className="photo-button-secondary" href={`/admin/rooms/${visibleTicket.roomId}/queue`}>
                Mở phòng
              </Link>
            ) : null}
            <button className="photo-button" onClick={() => setVisibleTicket(null)} type="button">
              Đã hiểu
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
