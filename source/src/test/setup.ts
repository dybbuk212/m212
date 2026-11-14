import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
afterEach(() => { cleanup(); localStorage.clear(); });
window.scrollTo = () => undefined;
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});
import { configure } from "@testing-library/react";
// Portal screens are code-split; the first lazy import in jsdom can exceed the 1s default.
configure({ asyncUtilTimeout: 5000 });
