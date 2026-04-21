import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

// Hero semantic assertion: range-checks catch regressions (missing data, unit
// conversion bugs, timezone offsets) that selector-based tests can't express.

test("Population dashboard renders core charts", async ({ page }) => {
  test.setTimeout(120_000);
  await runSteps({
    page,
    userFlow: "population dashboard smoke",
    steps: [
      { description: "Navigate to https://data.gov.my/dashboard/population" },
      {
        description: "Wait for the main KPI tiles to finish loading",
        waitUntil: "A number representing total population is visible",
      },
    ],
    assertions: [
      {
        assertion:
          "A headline KPI shows Malaysia's total population as a number greater than 20 million and less than 40 million",
      },
      {
        assertion:
          "At least one population-related chart is rendered — this may be a breakdown by age, ethnicity, gender, or a time-series of births, deaths, or total population",
      },
      { assertion: "A filter or state selector is available and defaults to a reasonable value" },
      {
        assertion:
          "No visible error banners, empty chart placeholders, or NaN values are present",
      },
    ],
    test,
    expect,
  });
});
