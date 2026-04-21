import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

test("OpenDOSM inflation dashboard shows plausible CPI values", async ({ page }) => {
  test.setTimeout(240_000);
  await runSteps({
    page,
    userFlow: "opendosm inflation",
    steps: [
      { description: "Navigate to https://open.dosm.gov.my/dashboard/consumer-prices" },
      {
        description: "Wait for the CPI headline and trend chart",
        waitUntil: "A headline inflation figure is visible",
      },
    ],
    assertions: [
      {
        assertion:
          "A headline year-on-year inflation rate is shown as a percentage between -3% and 15%",
      },
      { assertion: "A trend chart covering at least the last 12 months is rendered" },
      {
        assertion:
          "A breakdown by expenditure category (food, transport, housing, etc.) is visible",
      },
      { assertion: "No chart placeholder, error banner, or NaN value is shown" },
    ],
    test,
    expect,
  });
});
