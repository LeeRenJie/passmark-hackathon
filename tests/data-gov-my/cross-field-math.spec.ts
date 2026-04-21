import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

// A different shape of semantic assertion: cross-field math.
// Instead of checking a single value against a range, we check that
// values across multiple fields on the page are internally consistent.
//
// If Malaysia's total population is the sum of its male and female
// populations (duh), then the headline KPI and the sex breakdown should
// agree within a small margin. Selector-based tests cannot express
// "these three numbers should be mathematically consistent" without
// scraping all three and doing math by hand. Passmark makes it one
// assertion.

test("Cross-field math: sex breakdown sums to total population", async ({ page }) => {
  test.setTimeout(180_000);
  await runSteps({
    page,
    userFlow: "population sex breakdown consistency",
    steps: [
      { description: "Navigate to https://data.gov.my/dashboard/kawasanku" },
      {
        description: "Wait for the Malaysia country-level view to render with breakdown data",
        waitUntil:
          "A headline total population figure is visible and a breakdown by sex (male, female) is shown somewhere on the page",
      },
    ],
    assertions: [
      {
        assertion:
          "The male and female population values shown on the page add up to approximately the headline total population, within a 5% margin",
      },
      {
        assertion:
          "Any percentage-based breakdowns visible on the page (by sex, age, or ethnicity) sum to approximately 100% within a 2 percentage-point margin",
      },
      {
        assertion:
          "No breakdown value is negative or greater than the headline total",
      },
    ],
    test,
    expect,
  });
});
