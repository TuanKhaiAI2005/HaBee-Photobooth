"use client";

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

type SoundHandle = {
  stop: () => void;
};

function playTone(context: AudioContext, startAt: number, frequency: number, duration: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const volume = gain.gain;

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  volume.value = 0.42;
  if (volume.setValueAtTime && volume.exponentialRampToValueAtTime) {
    volume.setValueAtTime(0.001, startAt);
    volume.exponentialRampToValueAtTime(0.42, startAt + 0.04);
    volume.setValueAtTime(0.42, startAt + duration - 0.12);
    volume.exponentialRampToValueAtTime(0.001, startAt + duration);
  }

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
}

function startNotificationSound(): SoundHandle | null {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  const context = new AudioContextClass();
  let stopped = false;
  let elapsedMs = 0;

  function playChime(): void {
    if (stopped) {
      return;
    }

    const now = context.currentTime;
    playTone(context, now, 659, 0.55);
    playTone(context, now + 0.58, 880, 0.72);
  }

  playChime();
  const intervalId = window.setInterval(() => {
    elapsedMs += 1800;
    if (elapsedMs >= 15_000) {
      stop();
      return;
    }

    playChime();
  }, 1800);
  const timeoutId = window.setTimeout(() => stop(), 15_000);

  function stop(): void {
    if (stopped) {
      return;
    }

    stopped = true;
    window.clearInterval(intervalId);
    window.clearTimeout(timeoutId);
    void context.close?.();
  }

  return { stop };
}

function canUseBrowserNotifications(): boolean {
  return "Notification" in window;
}

function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!canUseBrowserNotifications()) {
    return "unsupported";
  }

  return Notification.permission;
}

function showBrowserNotification(ticket: CalledTicket, mode: "admin" | "customer"): void {
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") {
    return;
  }

  const title = mode === "admin" ? "Ve vua duoc goi" : "Da toi luot cua ban";
  const body = mode === "admin"
    ? `${ticket.ticketCode} - ${ticket.roomName}`
    : `Ve ${ticket.ticketCode} duoc goi vao ${ticket.roomName}.`;

  new Notification(title, {
    body,
    tag: `called-${ticket.id}`,
  });
}

export function CalledNotification({ ticket, mode }: CalledNotificationProps) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem("photoSoundEnabled") === "1";
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined") {
      return "unsupported";
    }

    return getNotificationPermission();
  });
  const [visibleTicket, setVisibleTicket] = useState<CalledTicket | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const soundRef = useRef<SoundHandle | null>(null);

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

    showBrowserNotification(ticket, mode);

    if (soundEnabled) {
      try {
        soundRef.current?.stop();
        soundRef.current = startNotificationSound();
      } catch {
        // Browser autoplay/audio failures are intentionally ignored.
      }
    }
  }, [eventKey, mode, soundEnabled, ticket]);

  useEffect(() => {
    if (!ticket) {
      soundRef.current?.stop();
      soundRef.current = null;
    }

    return () => {
      soundRef.current?.stop();
      soundRef.current = null;
    };
  }, [ticket]);

  async function toggleSound(enabled: boolean): Promise<void> {
    localStorage.setItem("photoSoundEnabled", enabled ? "1" : "0");
    setSoundEnabled(enabled);

    if (enabled && canUseBrowserNotifications() && Notification.permission === "default") {
      setNotificationPermission(await Notification.requestPermission());
    } else {
      setNotificationPermission(getNotificationPermission());
    }

    if (enabled) {
      try {
        soundRef.current?.stop();
        soundRef.current = startNotificationSound();
      } catch {
        // The visible UI remains usable if the browser blocks audio.
      }
    } else {
      soundRef.current?.stop();
      soundRef.current = null;
    }
  }

  function dismissNotification(): void {
    soundRef.current?.stop();
    soundRef.current = null;
    setVisibleTicket(null);
  }

  return (
    <>
      <div className="photo-card-soft flex flex-wrap items-center gap-3" aria-live="polite">
        <span className="text-sm font-bold">Am thanh thong bao</span>
        <button className={soundEnabled ? "photo-button-secondary" : "photo-button"} onClick={() => toggleSound(!soundEnabled)} type="button">
          {soundEnabled ? "Tat am thanh" : "Bat am thanh thong bao"}
        </button>
        {notificationPermission !== "unsupported" ? (
          <span className="text-xs font-bold text-[var(--color-muted-text)]">
            {notificationPermission === "granted" ? "Thong bao may: da bat" : "Thong bao may: chua bat"}
          </span>
        ) : null}
      </div>
      {visibleTicket ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-lg border-2 border-[var(--color-navy)] bg-[var(--color-surface)] p-4 text-[var(--color-navy)] shadow-[5px_5px_0_var(--color-navy)]" role="status">
          <p className="text-xs font-black uppercase text-[var(--color-muted-text)]">{mode === "admin" ? "Ve vua duoc goi" : "Da toi luot cua ban"}</p>
          <h2 className="mt-1 text-2xl font-black">{visibleTicket.ticketCode}</h2>
          <p className="mt-2 text-sm">Phong: <strong>{visibleTicket.roomName}</strong></p>
          {mode === "admin" ? (
            <p className="text-sm">{visibleTicket.customerName} - {visibleTicket.normalizedPhone}</p>
          ) : (
            <p className="text-sm">Vui long di chuyen vao dung phong va bam xac nhan khi ban da vao phong.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="photo-button" onClick={dismissNotification} type="button">
              Da hieu
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
