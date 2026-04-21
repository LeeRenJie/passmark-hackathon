import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

test("Homepage loads with search and navigation", async ({ page }) => {
  test.setTimeout(120_000);
  await runSteps({
    page,
    userFlow: "data.gov.my homepage smoke",
    steps: [
      { description: "Navigate to https://data.gov.my" },
      {
        description: "Wait for the homepage to finish loading",
        waitUntil: "The main hero area and site navigation are visible",
      },
    ],
    assertions: [
      {
        assertion:
          "The header shows navigation links to Catalogue (Data Catalogue) and Dashboard sections",
      },
      { assertion: "A main hero section or headline describing the platform is visible" },
      { assertion: "The footer displays MAMPU or official government attribution" },
      {
        assertion:
          "The page links to at least one featured item — a dashboard, dataset, or call-to-action card",
      },
    ],
    test,
    expect,
  });
});
