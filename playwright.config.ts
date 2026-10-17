import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120000,
  use: {
    baseURL: process.env.LEDGER_E2E_URL ?? "http://localhost:3000",
    storageState: process.env.LEDGER_E2E_STATE,
  },
  reporter: "list",
});
