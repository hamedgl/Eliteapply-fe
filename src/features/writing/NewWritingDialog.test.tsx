import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewWritingDialog } from "./NewWritingDialog";

const importFile = vi.fn();

vi.mock("../../lib/api/phase3", () => ({
  writingApi: {
    templates: async () => [],
    template: async () => null,
    import: (...args: unknown[]) => importFile(...args),
    create: async () => {
      throw new Error("not used in these tests");
    },
  },
  documentText: (content: { text?: string }) => content?.text ?? "",
}));

afterEach(() => {
  cleanup();
  importFile.mockReset();
});

function renderDialog() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NewWritingDialog onClose={() => {}} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fileInput = (container: HTMLElement) =>
  container.querySelector('input[type="file"]') as HTMLInputElement;

const pdf = (name = "Oxford SOP.pdf", size = 2048) => {
  const file = new File(["%PDF-1.7"], name, { type: "application/pdf" });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("NewWritingDialog import", () => {
  it("sends the file to the server and shows the extracted result", async () => {
    importFile.mockResolvedValue({
      title: "Oxford SOP",
      text: "Dear Admissions Committee,\n\nI am applying.",
      word_count: 842,
      character_count: 5120,
      source_format: "pdf",
      truncated: false,
      warnings: [],
    });
    const { container } = renderDialog();

    await userEvent.upload(fileInput(container), pdf());

    await waitFor(() =>
      expect(screen.getByText("Imported Oxford SOP.pdf")).toBeInTheDocument(),
    );
    expect(importFile).toHaveBeenCalledWith(
      expect.any(File),
      "motivation_letter",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Oxford SOP");
    expect(
      screen.getByText("842 words will open in the editor"),
    ).toBeInTheDocument();
  });

  it("surfaces truncation and extraction warnings", async () => {
    importFile.mockResolvedValue({
      title: "Long draft",
      text: "Body text",
      word_count: 2,
      character_count: 9,
      source_format: "pdf",
      truncated: true,
      warnings: ["Page 3 appears to be a scanned image and produced no text."],
    });
    const { container } = renderDialog();

    await userEvent.upload(fileInput(container), pdf("Long draft.pdf"));

    await waitFor(() =>
      expect(screen.getByText(/left out/)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(
        "Page 3 appears to be a scanned image and produced no text.",
      ),
    ).toBeInTheDocument();
  });

  it("explains an image-only file rather than importing nothing", async () => {
    importFile.mockResolvedValue({
      title: "Scan",
      text: "",
      word_count: 0,
      character_count: 0,
      source_format: "pdf",
      truncated: false,
      warnings: ["This PDF contains no extractable text."],
    });
    const { container } = renderDialog();

    await userEvent.upload(fileInput(container), pdf("Scan.pdf"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "This PDF contains no extractable text.",
      ),
    );
  });

  it("rejects a file over the size cap without uploading it", async () => {
    const { container } = renderDialog();

    await userEvent.upload(
      fileInput(container),
      pdf("huge.pdf", 11 * 1024 * 1024),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("larger than 10 MB"),
    );
    expect(importFile).not.toHaveBeenCalled();
  });
});
