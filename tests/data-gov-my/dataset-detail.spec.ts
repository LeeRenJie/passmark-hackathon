import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

test("Dataset detail page exposes metadata and download formats", async ({ page }) => {
  test.setTimeout(90_000);
  await runSteps({
    page,
    userFlow: "open first dataset and inspect",
    steps: [
      { description: "Navigate to https://data.gov.my/data-catalogue" },
      { description: "Open the first dataset in the catalogue" },
      {
        description: "Wait for the dataset page to load",
        waitUntil: "Dataset title and metadata panel are visible",
      },
    ],
    assertions: [
      { assertion: "The page shows the dataset title, description, and a last-updated timestamp" },
      { assertion: "At least one download action exists for CSV, Parquet, or JSON" },
      { assertion: "A data preview table or chart is visible" },
      {
        assertion:
          "An API usage snippet in any programming language (Python, JavaScript, curl, etc.) is shown somewhere on the page",
      },
    ],
    test,
    expect,
  });
});
