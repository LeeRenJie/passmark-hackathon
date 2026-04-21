import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

test("Catalogue search returns relevant datasets", async ({ page }) => {
  test.setTimeout(180_000);
  await runSteps({
    page,
    userFlow: "catalogue search for population",
    steps: [
      { description: "Navigate to https://data.gov.my/data-catalogue" },
      { description: "Type 'population' into the search field", data: { value: "population" } },
      { description: "Submit the search", waitUntil: "Result list has updated" },
    ],
    assertions: [
      { assertion: "Result list contains at least 3 datasets" },
      {
        assertion:
          "Every visible result relates to population or demographics — this can be through the result's title, its description, or the category heading it appears under",
      },
      { assertion: "Each result card links to a dataset detail page" },
    ],
    test,
    expect,
  });
});

test("Filtering by frequency narrows results", async ({ page }) => {
  test.setTimeout(180_000);
  await runSteps({
    page,
    userFlow: "filter catalogue by frequency",
    steps: [
      { description: "Navigate to https://data.gov.my/data-catalogue" },
      { description: "Open the frequency or update-period filter" },
      {
        description: "Select a non-default frequency such as Monthly or Yearly",
        data: { value: "Yearly" },
      },
      {
        description: "Wait for the list to refresh",
        waitUntil: "Filter chip shows Yearly and results count changed",
      },
    ],
    assertions: [
      { assertion: "A chip or badge indicating the Yearly filter is applied is visible" },
      { assertion: "The result count is smaller than or equal to the unfiltered count" },
    ],
    test,
    expect,
  });
});
