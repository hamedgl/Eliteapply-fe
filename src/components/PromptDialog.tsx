import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type PromptOptions = {
  title: string;
  label: string;
  initialValue?: string;
  description?: string;
  type?: "text" | "date" | "datetime-local";
  multiline?: boolean;
  required?: boolean;
  submitLabel?: string;
};

type PendingPrompt = PromptOptions & {
  resolve: (value: string | null) => void;
};

const PromptDialogContext = createContext<
  ((options: PromptOptions) => Promise<string | null>) | null
>(null);

export function PromptDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingPrompt | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) =>
        setPending({ ...options, resolve }),
      ),
    [],
  );

  useEffect(() => {
    if (!pending || !dialogRef.current) return;
    if (!dialogRef.current.open) dialogRef.current.showModal();
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    });
  }, [pending]);

  function finish(value: string | null) {
    pending?.resolve(value);
    dialogRef.current?.close();
    setPending(null);
  }

  return (
    <PromptDialogContext.Provider value={prompt}>
      {children}
      {pending ? (
        <dialog
          ref={dialogRef}
          className="app-prompt-dialog"
          aria-labelledby={titleId}
          aria-describedby={pending.description ? descriptionId : undefined}
          onCancel={(event) => {
            event.preventDefault();
            finish(null);
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              finish(String(data.get("value") ?? ""));
            }}
          >
            <header>
              <div>
                <h2 id={titleId}>{pending.title}</h2>
                {pending.description ? (
                  <p id={descriptionId}>{pending.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="dialog-close"
                onClick={() => finish(null)}
                aria-label="Close dialog"
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <label>
              {pending.label}
              {pending.multiline ? (
                <textarea
                  ref={inputRef as RefObject<HTMLTextAreaElement>}
                  name="value"
                  defaultValue={pending.initialValue}
                  required={pending.required}
                  rows={5}
                />
              ) : (
                <input
                  ref={inputRef as RefObject<HTMLInputElement>}
                  name="value"
                  type={pending.type ?? "text"}
                  defaultValue={pending.initialValue}
                  required={pending.required}
                />
              )}
            </label>
            <div className="dialog-actions">
              <button type="button" onClick={() => finish(null)}>
                Cancel
              </button>
              <button className="primary" type="submit">
                {pending.submitLabel ?? "Save changes"}
              </button>
            </div>
          </form>
        </dialog>
      ) : null}
    </PromptDialogContext.Provider>
  );
}

export function usePromptDialog() {
  const context = useContext(PromptDialogContext);
  if (!context) {
    throw new Error("usePromptDialog must be used within PromptDialogProvider");
  }
  return context;
}
