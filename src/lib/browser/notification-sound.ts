"use client";

export type NotificationSoundHandle = {
  started: Promise<boolean>;
  stop: () => void;
};

type NotificationSoundOptions = {
  durationMs?: number;
  loop?: boolean;
};

const notificationSoundUrl = "/nhachuong.mp3";
const defaultDurationMs = 10_000;

let sharedContext: AudioContext | null = null;
let sharedContextConstructor: typeof AudioContext | null = null;
let sharedBuffer: AudioBuffer | null = null;
let sharedBufferPromise: Promise<AudioBuffer | null> | null = null;
let fallbackAudio: HTMLAudioElement | null = null;
let fallbackAudioConstructor: typeof Audio | null = null;
let activeStop: (() => void) | null = null;

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.AudioContext ?? window.webkitAudioContext ?? null;
}

function getSharedContext(create: boolean): AudioContext | null {
  const AudioContextClass = getAudioContextConstructor();

  if (!AudioContextClass) {
    return null;
  }

  if (
    sharedContext
    && (
      sharedContextConstructor !== AudioContextClass
      || sharedContext.state === "closed"
    )
  ) {
    activeStop?.();
    sharedContext = null;
    sharedBuffer = null;
    sharedBufferPromise = null;
  }

  if (!sharedContext && create) {
    sharedContext = new AudioContextClass();
    sharedContextConstructor = AudioContextClass;
  }

  return sharedContext;
}

function loadNotificationBuffer(context: AudioContext): Promise<AudioBuffer | null> {
  if (sharedBuffer) {
    return Promise.resolve(sharedBuffer);
  }

  if (!sharedBufferPromise) {
    sharedBufferPromise = fetch(notificationSoundUrl, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Cannot load notification sound: ${response.status}`);
        }

        return response.arrayBuffer();
      })
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        sharedBuffer = buffer;
        return buffer;
      })
      .catch(() => null);
  }

  return sharedBufferPromise;
}

function playSilentUnlock(context: AudioContext): void {
  const silentBuffer = context.createBuffer(1, 1, context.sampleRate);
  const silentSource = context.createBufferSource();
  silentSource.buffer = silentBuffer;
  silentSource.connect(context.destination);
  silentSource.start();
}

function getFallbackAudio(): HTMLAudioElement | null {
  if (typeof Audio === "undefined") {
    return null;
  }

  if (!fallbackAudio || fallbackAudioConstructor !== Audio) {
    fallbackAudio = new Audio(notificationSoundUrl);
    fallbackAudio.preload = "auto";
    fallbackAudioConstructor = Audio;
  }

  return fallbackAudio;
}

export function primeNotificationSound(): Promise<boolean> {
  const context = getSharedContext(true);

  if (!context) {
    getFallbackAudio()?.load();
    return Promise.resolve(false);
  }

  // A zero-filled one-frame buffer unlocks the Web Audio pipeline from the
  // registration gesture without producing the customer notification sound.
  playSilentUnlock(context);
  const resumed = context.state === "running"
    ? Promise.resolve()
    : context.resume();

  return Promise.all([resumed, loadNotificationBuffer(context)])
    .then(([, buffer]) => context.state === "running" && buffer !== null)
    .catch(() => false);
}

export function startNotificationSound({
  durationMs = defaultDurationMs,
  loop = true,
}: NotificationSoundOptions = {}): NotificationSoundHandle | null {
  if (typeof window === "undefined") {
    return null;
  }

  const context = getSharedContext(false);
  activeStop?.();

  let stopped = false;
  let timeoutId: number | null = null;
  let source: AudioBufferSourceNode | null = null;
  let fallback: HTMLAudioElement | null = null;

  const stop = (): void => {
    if (stopped) {
      return;
    }

    stopped = true;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    if (source) {
      try {
        source.stop();
      } catch {
        // A source that already ended cannot be stopped twice.
      }
      source.disconnect();
      source = null;
    }
    if (fallback) {
      fallback.pause();
      fallback.currentTime = 0;
      fallback = null;
    }

    if (activeStop === stop) {
      activeStop = null;
    }
  };

  activeStop = stop;

  const startFallback = (): Promise<boolean> => {
    const audio = getFallbackAudio();

    if (!audio || stopped) {
      return Promise.resolve(false);
    }

    fallback = audio;
    audio.loop = loop;
    audio.muted = false;
    audio.volume = 1;
    audio.currentTime = 0;

    try {
      return audio.play()
        .then(() => {
          if (stopped) {
            return false;
          }

          timeoutId = window.setTimeout(stop, durationMs);
          return true;
        })
        .catch(() => {
          stop();
          return false;
        });
    } catch {
      stop();
      return Promise.resolve(false);
    }
  };

  const started = context
    ? (context.state === "running" ? Promise.resolve() : context.resume())
      .then(() => loadNotificationBuffer(context))
      .then((buffer) => {
        if (!buffer || stopped || context.state !== "running") {
          return startFallback();
        }

        source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        source.connect(context.destination);
        source.start();
        timeoutId = window.setTimeout(stop, durationMs);
        return true;
      })
      .catch(() => startFallback())
    : startFallback();

  return { started, stop };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
