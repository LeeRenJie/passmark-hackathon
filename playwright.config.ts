import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { configure } from "passmark";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Route all AI calls through the hackathon-issued OpenRouter key so we
// tap the pooled credits instead of direct Anthropic/Google free tiers.
configure({
  ai: {
    gateway: "openrouter",
  },
});

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Always retry once. OpenRouter occasionally rate-limits gemini-2.5-flash
  // on wait-condition checks, returning a malformed JSON stream. One retry
  // absorbs those transient gateway events without letting them surface as
  // spurious spec failures.
  retries: 1,
  // Gov portals are likely behind Cloudflare/WAF. Serial across tests keeps
  // us polite and avoids rate-limit-driven flakiness during the hackathon run.
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
