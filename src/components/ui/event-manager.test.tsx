import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventManager, type CalendarEvent } from "./event-manager";

describe("EventManager", () => {
  it("filters real schedule data and creates from a calendar day", () => {
    const onCreate = vi.fn();
    const events: CalendarEvent[] = [
      {
        id: "reminder:1",
        title: "Submit transcript",
        startAt: "2026-07-23T09:00:00Z",
        kind: "reminder",
      },
      {
        id: "deadline:1",
        title: "Oxford deadline",
        startAt: "2026-07-24T00:00:00Z",
        kind: "deadline",
        allDay: true,
      },
    ];

    render(
      <EventManager
        events={events}
        timezone="UTC"
        initialDate={new Date("2026-07-23T12:00:00Z")}
        onCreate={onCreate}
      />,
    );

    expect(screen.getByText("Submit transcript")).toBeInTheDocument();
    expect(screen.getByText("Oxford deadline")).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("Search reminders and deadlines"),
      { target: { value: "Oxford" } },
    );
    expect(screen.queryByText("Submit transcript")).not.toBeInTheDocument();
    expect(screen.getByText("Oxford deadline")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Add reminder on Thursday, July 23, 2026/i,
      }),
    );
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({}),
    );
    expect(onCreate.mock.calls[0][0].getDate()).toBe(23);
  });
});
