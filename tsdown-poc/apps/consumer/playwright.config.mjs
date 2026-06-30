import { defineConfig } from "playwright/test";

const host = "127.0.0.1";
const port = Number(process.env.BROWSER_TEST_PORT ?? 4180);
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "browser-click.spec.mjs",
  timeout: 30_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `bun x --no-install vite preview --host ${host} --port ${port} --strictPort`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
