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
