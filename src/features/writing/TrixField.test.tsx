import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { TrixField } from "./TrixField";
import { contentToHtml, DEFAULT_FONT } from "./documentHtml";

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
});
