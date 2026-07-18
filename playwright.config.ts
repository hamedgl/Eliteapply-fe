import { defineConfig } from "@playwright/test";

const browser = {
  browserName: "chromium" as const,
  launchOptions: {
    executablePath:
      process.env.PW_EXECUTABLE_PATH ?? "/usr/bin/google-chrome",
  },
};

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: browser },
    {
      name: "mobile-chromium",
      use: {
        ...browser,
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
