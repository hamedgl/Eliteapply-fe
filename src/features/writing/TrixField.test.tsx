import { describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach } from "vitest";
import { TrixField } from "./TrixField";
import { contentToHtml, DEFAULT_FONT } from "./documentHtml";

afterEach(cleanup);

function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <TrixField
      value={value}
      onChange={setValue}
      ariaLabel="Document content"
      font={DEFAULT_FONT}
    />
  );
}

const editorOf = (container: HTMLElement) =>
  container.querySelector("trix-editor") as HTMLElement;

describe("TrixField", () => {
  it("exposes the editor by its accessible name", async () => {
    render(<Harness initial="" />);
    await waitFor(() =>
      expect(screen.getByLabelText("Document content")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Text colour")).toBeInTheDocument();
    expect(screen.getByLabelText("Highlight colour")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Clear text and highlight colours",
      }),
    ).toBeInTheDocument();
  });

  it("keeps legacy plain-text paragraphs separate once loaded", async () => {
    const { container } = render(
      <Harness initial={contentToHtml({ text: "Para one.\n\nPara two." })} />,
    );
    await waitFor(() =>
      expect(editorOf(container).textContent).toContain("Para two."),
    );
    expect(editorOf(container).querySelectorAll("div")).toHaveLength(2);
  });

  it("renders plain text that looks like markup instead of dropping it", async () => {
    const { container } = render(
      <Harness initial={contentToHtml({ text: "keep <script>me</script> here" })} />,
    );
    await waitFor(() =>
      expect(editorOf(container).textContent).toBe("keep <script>me</script> here"),
    );
  });

  it("strips attachments, which have no upload endpoint and inline as data URLs", async () => {
    const { container } = render(<Harness initial='<div><img src="x"></div>' />);
    await waitFor(() => expect(editorOf(container)).toBeInTheDocument());
    await waitFor(() =>
      expect(editorOf(container).querySelector("figure")).toBeNull(),
    );
    expect(editorOf(container).querySelector("[data-trix-attachment]")).toBeNull();
  });

  it("applies text and highlight colours to the selection", async () => {
    const { container } = render(<Harness initial="<div>Colour me</div>" />);
    const editor = editorOf(container) as HTMLElement & {
      editor?: { setSelectedRange(range: [number, number]): void };
    };
    await waitFor(() => expect(editor.textContent).toContain("Colour me"));
    editor.editor?.setSelectedRange([0, 6]);

    fireEvent.change(screen.getByLabelText("Text colour"), {
      target: { value: "#2456d3" },
    });
    editor.editor?.setSelectedRange([0, 6]);
    fireEvent.change(screen.getByLabelText("Highlight colour"), {
      target: { value: "#ffed78" },
    });

    const input = container.querySelector(
      'input[type="hidden"]',
    ) as HTMLInputElement;
    await waitFor(() => expect(input.value).toContain("color:"));
    expect(input.value).toContain("background-color:");

    editor.editor?.setSelectedRange([0, 6]);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Clear text and highlight colours",
      }),
    );
    await waitFor(() => expect(input.value).not.toContain("color:"));
    expect(input.value).not.toContain("background-color:");
  });
});
