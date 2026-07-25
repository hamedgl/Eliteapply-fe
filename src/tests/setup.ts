import"@testing-library/jest-dom/vitest";

// jsdom's ElementInternals has no form-association API (used by trix-editor).
// ponytail: test-env polyfill only, real browsers implement this natively.
const internals = globalThis.ElementInternals?.prototype;
if (internals && !internals.setFormValue) {
  internals.setFormValue = () => {};
  internals.setValidity = () => {};
  internals.checkValidity = () => true;
  internals.reportValidity = () => true;
}

// jsdom's Blob has no `text()`, which file imports use to read a dropped file.
// ponytail: test-env polyfill only, real browsers implement this natively.
if (globalThis.Blob && !Blob.prototype.text) {
  Blob.prototype.text = function text(this: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

// jsdom does not implement the modal <dialog> methods used by our dialogs.
// ponytail: test-env polyfill only, real browsers implement this natively.
const dialog = globalThis.HTMLDialogElement?.prototype;
if (dialog && !dialog.showModal) {
  dialog.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  dialog.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}
