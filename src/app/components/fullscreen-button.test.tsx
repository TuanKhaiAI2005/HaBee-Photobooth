import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FullscreenButton } from "@/app/components/fullscreen-button";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let fullscreenElement: Element | null;

async function renderButton(): Promise<HTMLButtonElement> {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(<FullscreenButton />);
  });

  const button = container.querySelector("button");
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("Không tìm thấy nút toàn màn hình.");
  }

  return button;
}

describe("FullscreenButton", () => {
  beforeEach(() => {
    fullscreenElement = null;

    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }

    container?.remove();
    Reflect.deleteProperty(document, "fullscreenEnabled");
    Reflect.deleteProperty(document, "fullscreenElement");
    Reflect.deleteProperty(document, "exitFullscreen");
    Reflect.deleteProperty(document.documentElement, "requestFullscreen");
    vi.restoreAllMocks();
  });

  it("bật và thoát chế độ toàn màn hình", async () => {
    const requestFullscreen = vi.fn(async () => {
      fullscreenElement = document.documentElement;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    const exitFullscreen = vi.fn(async () => {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: exitFullscreen,
    });

    const button = await renderButton();
    expect(button.textContent).toContain("Toàn màn hình");

    await act(async () => {
      button.click();
    });

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(button.textContent).toContain("Thoát toàn màn hình");
    expect(button.getAttribute("aria-pressed")).toBe("true");

    await act(async () => {
      button.click();
    });

    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(button.textContent).toContain("Toàn màn hình");
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("đồng bộ trạng thái khi người dùng thoát bằng phím Esc", async () => {
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: vi.fn(),
    });

    const button = await renderButton();

    fullscreenElement = document.documentElement;
    await act(async () => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(button.textContent).toContain("Thoát toàn màn hình");

    fullscreenElement = null;
    await act(async () => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(button.textContent).toContain("Toàn màn hình");
  });
});
