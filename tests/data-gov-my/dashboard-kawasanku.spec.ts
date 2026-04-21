import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

test("Kawasanku drills from Malaysia to a specific state", async ({ page }) => {
  test.setTimeout(240_000);
  await runSteps({
    page,
    userFlow: "kawasanku drill into Selangor",
    steps: [
      { description: "Navigate to https://data.gov.my/dashboard/kawasanku" },
      {
        description: "Wait for the country-level view to load",
        waitUntil: "A map or KPI panel for Malaysia is visible",
      },
      {
        description:
          "In the area search input, type 'Selangor' and select the Selangor option from the dropdown, then wait for the page to navigate to the state view",
        data: { value: "Selangor" },
        waitUntil: "A heading or summary mentioning Selangor is visible",
      },
    ],
    assertions: [
      { assertion: "The page heading, breadcrumb, or URL reflects the Selangor context" },
      {
        assertion:
          "At least one demographic KPI (population, median age, or household income) shows a plausible number for Selangor",
      },
      { assertion: "Values differ from the Malaysia-level view — not reusing national numbers" },
    ],
    test,
    expect,
  });
});
