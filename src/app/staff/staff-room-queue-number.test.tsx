import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StaffRoomQueueNumber } from "@/app/staff/staff-room-queue-number";

describe("StaffRoomQueueNumber", () => {
  it("renders the current queue number in the staff room header format", () => {
    expect(renderToStaticMarkup(<StaffRoomQueueNumber queueNumber={12} />)).toContain("STT: 12");
  });

  it("renders two hyphens when a room has no current queue number", () => {
    expect(renderToStaticMarkup(<StaffRoomQueueNumber queueNumber={null} />)).toContain("STT: --");
  });
});
