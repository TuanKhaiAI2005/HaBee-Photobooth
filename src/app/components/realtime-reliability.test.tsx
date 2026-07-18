import React, { StrictMode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueueConnectionIndicator } from "@/app/components/connection-indicator";
import { CalledNotification } from "@/app/components/called-notification";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  createSupabaseBrowserClient: vi.fn(),
  router: { refresh: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: mocks.createSupabaseBrowserClient,
}));

type ChannelStatus = "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED";

type FakeChannel = {
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

type FakeSupabase = {
  channel: ReturnType<typeof vi.fn>;
  removeChannel: ReturnType<typeof vi.fn>;
  emitStatus: (status: ChannelStatus) => void;
  emitQueueEvent: () => void;
};

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let renderedViews: Array<{ unmount: () => Promise<void> }> = [];
let currentVisibilityState: DocumentVisibilityState = "visible";

function createFakeSupabase(): FakeSupabase {
  let statusHandler: ((status: ChannelStatus) => void) | null = null;
  let eventHandler: (() => void) | null = null;
  const channel: FakeChannel = {
    on: vi.fn((_event, _config, callback: () => void) => {
      eventHandler = callback;
      return channel;
    }),
    subscribe: vi.fn((callback: (status: ChannelStatus) => void) => {
      statusHandler = callback;
      return channel;
    }),
  };

  return {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
    emitStatus: (status: ChannelStatus) => statusHandler?.(status),
    emitQueueEvent: () => eventHandler?.(),
  };
}

function setOnline(online: boolean): void {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: online,
  });
}

function setVisibility(state: DocumentVisibilityState): void {
  currentVisibilityState = state;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => currentVisibilityState,
  });
}

async function render(ui: React.ReactNode): Promise<{ container: HTMLDivElement; root: Root; unmount: () => Promise<void> }> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(ui);
  });

  const view = {
    container,
    root,
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
  renderedViews.push(view);
  return view;
}

async function flushTimers(ms = 0): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("QueueConnectionIndicator realtime reliability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.refresh.mockReset();
    mocks.router.refresh = mocks.refresh;
    mocks.createSupabaseBrowserClient.mockReset();
    setOnline(true);
    setVisibility("visible");
  });

  afterEach(async () => {
    for (const view of renderedViews.splice(0)) {
      await view.unmount();
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("does not poll while Realtime is SUBSCRIBED", async () => {
    const supabase = createFakeSupabase();
    mocks.createSupabaseBrowserClient.mockReturnValue(supabase);
    const view = await render(<QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />);

    act(() => supabase.emitStatus("SUBSCRIBED"));
    await flushTimers(5_000);

    expect(mocks.refresh).not.toHaveBeenCalled();
    await view.unmount();
  });

  it.each(["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"] as const)(
    "%s starts exactly one fallback polling loop",
    async (status) => {
      const supabase = createFakeSupabase();
      mocks.createSupabaseBrowserClient.mockReturnValue(supabase);
      const view = await render(<QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />);

      await act(async () => {
        supabase.emitStatus(status);
        supabase.emitStatus(status);
      });
      await flushTimers(3_000);

      expect(mocks.refresh).toHaveBeenCalledTimes(3);
      await view.unmount();
    },
  );

  it("stops fallback polling when Realtime recovers", async () => {
    const supabase = createFakeSupabase();
    mocks.createSupabaseBrowserClient.mockReturnValue(supabase);
    const view = await render(<QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />);

    await act(async () => supabase.emitStatus("CHANNEL_ERROR"));
    await flushTimers(1_000);
    await act(async () => supabase.emitStatus("SUBSCRIBED"));
    await flushTimers(3_000);

    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    await view.unmount();
  });

  it("cleans up duplicate Strict Mode subscriptions and leaves one active subscription", async () => {
    const supabase = createFakeSupabase();
    mocks.createSupabaseBrowserClient.mockReturnValue(supabase);
    const view = await render(
      <StrictMode>
        <QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />
      </StrictMode>,
    );

    expect(supabase.channel).toHaveBeenCalledTimes(2);
    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);

    await view.unmount();
    expect(supabase.removeChannel).toHaveBeenCalledTimes(2);
  });

  it("does not create another subscription when rerendered with the same scope", async () => {
    const supabase = createFakeSupabase();
    mocks.createSupabaseBrowserClient.mockReturnValue(supabase);
    const view = await render(<QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />);

    await act(async () => {
      view.root.render(<QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />);
    });

    expect(supabase.channel).toHaveBeenCalledTimes(1);
    expect(supabase.removeChannel).not.toHaveBeenCalled();
    await view.unmount();
  });

  it("cleans channel, timer, and event listeners on unmount", async () => {
    const addDocument = vi.spyOn(document, "addEventListener");
    const removeDocument = vi.spyOn(document, "removeEventListener");
    const addWindow = vi.spyOn(window, "addEventListener");
    const removeWindow = vi.spyOn(window, "removeEventListener");
    const supabase = createFakeSupabase();
    mocks.createSupabaseBrowserClient.mockReturnValue(supabase);
    const view = await render(<QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />);

    await act(async () => supabase.emitStatus("CHANNEL_ERROR"));
    await view.unmount();
    renderedViews = renderedViews.filter((rendered) => rendered !== view);
    await flushTimers(3_000);

    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(addDocument).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(removeDocument).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(addWindow).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(addWindow).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeWindow).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(removeWindow).toHaveBeenCalledWith("online", expect.any(Function));
  });

  it("refetches once when a hidden tab becomes visible", async () => {
    const supabase = createFakeSupabase();
    mocks.createSupabaseBrowserClient.mockReturnValue(supabase);
    const view = await render(<QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />);

    setVisibility("hidden");
    setVisibility("visible");
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    await flushTimers();

    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    await view.unmount();
  });

  it("does not spam requests while offline", async () => {
    const supabase = createFakeSupabase();
    mocks.createSupabaseBrowserClient.mockReturnValue(supabase);
    const view = await render(<QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />);

    await act(async () => supabase.emitStatus("CHANNEL_ERROR"));
    await act(async () => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    await flushTimers(5_000);

    expect(mocks.refresh).not.toHaveBeenCalled();
    await view.unmount();
  });

  it("refetches when the browser comes online again", async () => {
    const supabase = createFakeSupabase();
    mocks.createSupabaseBrowserClient.mockReturnValue(supabase);
    const view = await render(<QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />);

    await act(async () => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    await act(async () => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    await flushTimers();

    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    await view.unmount();
  });

  it("coalesces multiple QueueEvent inserts within 200ms into one refetch", async () => {
    const supabase = createFakeSupabase();
    mocks.createSupabaseBrowserClient.mockReturnValue(supabase);
    const view = await render(<QueueConnectionIndicator fallbackMs={1_000} roomId="room-1" />);

    await act(async () => {
      supabase.emitQueueEvent();
      supabase.emitQueueEvent();
      supabase.emitQueueEvent();
    });
    await flushTimers(199);
    expect(mocks.refresh).not.toHaveBeenCalled();
    await flushTimers(1);

    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    await view.unmount();
  });
});

describe("CalledNotification duplicate protection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.setItem("photoSoundEnabled", "1");
  });

  afterEach(async () => {
    for (const view of renderedViews.splice(0)) {
      await view.unmount();
    }
    vi.useRealTimers();
    localStorage.clear();
    document.body.innerHTML = "";
    Reflect.deleteProperty(window, "AudioContext");
  });

  it("does not replay a CALLED notification for the same ticket and calledAt during recovery rerenders", async () => {
    const oscillatorStart = vi.fn();
    class AudioContextMock {
      currentTime = 0;
      createOscillator() {
        return { frequency: { value: 0 }, connect: vi.fn(), start: oscillatorStart, stop: vi.fn() };
      }
      createGain() {
        return { gain: { value: 0 }, connect: vi.fn() };
      }
      get destination() {
        return {};
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: AudioContextMock });

    const ticket = {
      id: "ticket-1",
      ticketCode: "A001",
      roomId: "room-1",
      roomName: "Phòng 1",
      calledAt: "2026-07-17T10:25:14.000Z",
    };
    const view = await render(<CalledNotification mode="customer" ticket={ticket} />);

    await act(async () => {
      view.root.render(<CalledNotification mode="customer" ticket={{ ...ticket }} />);
      window.dispatchEvent(new Event("online"));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(oscillatorStart).toHaveBeenCalledTimes(1);
    await view.unmount();
  });
});
