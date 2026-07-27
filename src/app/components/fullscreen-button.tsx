"use client";

import { useState, useSyncExternalStore } from "react";

type WebkitFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
};

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  const fullscreenDocument = document as WebkitFullscreenDocument;
  return document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null;
}

function subscribeToFullscreenChange(onStoreChange: () => void): () => void {
  document.addEventListener("fullscreenchange", onStoreChange);
  document.addEventListener("webkitfullscreenchange", onStoreChange);

  return () => {
    document.removeEventListener("fullscreenchange", onStoreChange);
    document.removeEventListener("webkitfullscreenchange", onStoreChange);
  };
}

function getFullscreenSnapshot(): boolean {
  return Boolean(getFullscreenElement());
}

function getServerFullscreenSnapshot(): boolean {
  return false;
}

export function FullscreenButton() {
  const isFullscreen = useSyncExternalStore(
    subscribeToFullscreenChange,
    getFullscreenSnapshot,
    getServerFullscreenSnapshot,
  );
  const [error, setError] = useState<string | null>(null);

  async function toggleFullscreen(): Promise<void> {
    const fullscreenDocument = document as WebkitFullscreenDocument;
    const rootElement = document.documentElement as WebkitFullscreenElement;

    setError(null);

    try {
      if (getFullscreenElement()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (fullscreenDocument.webkitExitFullscreen) {
          await fullscreenDocument.webkitExitFullscreen();
        }
      } else if (rootElement.requestFullscreen) {
        await rootElement.requestFullscreen();
      } else if (rootElement.webkitRequestFullscreen) {
        await rootElement.webkitRequestFullscreen();
      } else {
        setError("Trình duyệt này không hỗ trợ chế độ toàn màn hình.");
        return;
      }
    } catch {
      setError("Không thể bật toàn màn hình. Hãy kiểm tra quyền của trình duyệt.");
    }
  }

  const label = isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình";

  return (
    <div className="grid justify-items-end gap-1">
      <button
        aria-label={label}
        aria-pressed={isFullscreen}
        className="photo-button-secondary gap-2"
        onClick={toggleFullscreen}
        title={label}
        type="button"
      >
        {isFullscreen ? (
          <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
            <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        ) : (
          <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
            <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        )}
        <span>{label}</span>
      </button>
      {error ? (
        <p className="max-w-xs text-right text-xs font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
