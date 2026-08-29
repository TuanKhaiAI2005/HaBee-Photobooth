import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QueueNumber } from "@/app/components/queue-number";

describe("QueueNumber", () => {
  it("renders the QueueTicket queue number for admin and staff views", () => {
    expect(renderToStaticMarkup(<QueueNumber queueNumber={12} />)).toContain("STT 12");
  });

  it("renders a dash for legacy tickets without a queue number", () => {
    expect(renderToStaticMarkup(<QueueNumber queueNumber={null} />)).toContain("STT —");
  });
});
