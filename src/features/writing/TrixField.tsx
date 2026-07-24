import { useEffect, useId, useRef, type ReactNode } from "react";
import "trix";
import "trix/dist/trix.css";
import type { FontKey } from "./documentHtml";

type TrixEditorElement = HTMLElement & {
  editor?: { loadHTML(html: string): void };
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "trix-editor": React.DetailedHTMLProps<
        React.HTMLAttributes<TrixEditorElement>,
        TrixEditorElement
      > & { input?: string; toolbar?: string };
      "trix-toolbar": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

/**
 * Rich text field backed by Trix.
 *
 * Trix owns its DOM, so the element stays uncontrolled: incoming `value` is
 * pushed in only when it differs from what the editor last emitted, otherwise
 * every keystroke would reload the document and reset the caret and undo stack.
 *
 * The toolbar is rendered here rather than left to Trix's auto-insertion so that
 * document-level controls can share the same bar as the formatting buttons.
 */
export function TrixField({
  value,
  onChange,
  ariaLabel,
  font,
  toolbarExtra,
}: {
  value: string;
  onChange: (html: string) => void;
  ariaLabel: string;
  font: FontKey;
  toolbarExtra?: ReactNode;
}) {
  const inputId = useId();
  const toolbarId = useId();
  const editorRef = useRef<TrixEditorElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef<string | null>(null);
  // Kept in a ref so a new inline callback each render does not re-bind listeners.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const editorEl = editorRef.current;
    const inputEl = inputRef.current;
    if (!editorEl || !inputEl) return;

    const handleChange = () => {
      lastEmitted.current = inputEl.value;
      onChangeRef.current(inputEl.value);
    };
    // No upload endpoint exists for writing documents, and an unhandled attachment
    // is inlined as a base64 data URL — megabytes of it inside the document JSON.
    const rejectFiles = (event: Event) => event.preventDefault();
    const removeAttachment = (event: Event) => {
      const { attachment } = event as Event & {
        attachment?: { remove(): void };
      };
      attachment?.remove();
    };

    editorEl.addEventListener("trix-change", handleChange);
    editorEl.addEventListener("trix-file-accept", rejectFiles);
    editorEl.addEventListener("trix-attachment-add", removeAttachment);
    return () => {
      editorEl.removeEventListener("trix-change", handleChange);
      editorEl.removeEventListener("trix-file-accept", rejectFiles);
      editorEl.removeEventListener("trix-attachment-add", removeAttachment);
    };
  }, []);

  useEffect(() => {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    const applyExternalValue = () => {
      if (value === lastEmitted.current) return;
      lastEmitted.current = value;
      editorEl.editor?.loadHTML(value);
    };
    if (editorEl.editor) {
      applyExternalValue();
      return;
    }
    // `trix-initialize` fires once the element upgrades; until then `editor` is undefined.
    editorEl.addEventListener("trix-initialize", applyExternalValue);
    return () =>
      editorEl.removeEventListener("trix-initialize", applyExternalValue);
  }, [value]);

  return (
    <div className="writing-trix" data-font={font}>
      <div className="writing-trix-bar">
        <trix-toolbar id={toolbarId} />
        {toolbarExtra ? (
          <div className="writing-trix-bar-extra">{toolbarExtra}</div>
        ) : null}
      </div>
      <input ref={inputRef} id={inputId} type="hidden" />
      <trix-editor
        ref={editorRef}
        input={inputId}
        toolbar={toolbarId}
        aria-label={ariaLabel}
      />
    </div>
  );
}
