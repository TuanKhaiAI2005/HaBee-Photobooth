import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoomIcon, RoomLabel, roomLabelText } from "@/app/components/room-label";

describe("room labels", () => {
  it.each([
    ["Phòng 1", "circle", "● Phòng 1"],
    ["  PHÒNG 2  ", "path", "♥   PHÒNG 2  "],
    ["phòng-3", "rect", "■ phòng-3"],
    ["Room 1 ( Nova )", "circle", "● Room 1 ( Nova )"],
    ["Room 2 ( Jolly )", "path", "♥ Room 2 ( Jolly )"],
    ["Room 3 ( Sepia )", "rect", "■ Room 3 ( Sepia )"],
  ])("maps %s to its configured icon", (room, element, textLabel) => {
    expect(renderToStaticMarkup(<RoomIcon room={room} />)).toContain(`<${element}`);
    expect(roomLabelText(room)).toBe(textLabel);
  });

  it("keeps unknown room names readable without inventing an icon", () => {
    expect(renderToStaticMarkup(<RoomIcon room="Studio A" />)).toBe("");
    expect(renderToStaticMarkup(<RoomLabel room="Studio A" />)).toContain("Studio A");
    expect(roomLabelText("Studio A")).toBe("Studio A");
  });
});
