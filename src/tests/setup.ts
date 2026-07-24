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
