import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

// Data-freshness assertion: "updated within 90 days" cannot be expressed in
// vanilla Playwright without hard-coding a date. LLM reads the timestamp.

test("KKMNow hospital bed utilisation dashboard loads", async ({ page }) => {
  test.setTimeout(180_000);
  await runSteps({
    page,
    userFlow: "kkmnow hospital beds",
    steps: [
      { description: "Navigate to https://data.moh.gov.my/dashboard/hospital-bed-utilisation" },
      {
        description: "Wait for the dashboard numbers to hydrate",
        waitUntil:
          "At least one concrete bed-utilisation percentage value (e.g. a number like 87%) is visible on the page — not just the section label 'Hospital Bed Utilisation (%)'",
      },
    ],
    assertions: [
      {
        assertion:
          "At least one bed-utilisation percentage between 0% and 120% is shown on the page — this can be a headline KPI, a ranked list, a chart, or a table",
      },
      { assertion: "A state selector or map lets the user drill into individual states" },
      { assertion: "A last-updated timestamp is visible and within the last 90 days" },
      { assertion: "No error banner or empty chart placeholder is present" },
    ],
    test,
    expect,
  });
});
