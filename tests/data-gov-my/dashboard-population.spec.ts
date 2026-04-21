import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

// Hero semantic assertion: range-checks catch regressions (missing data, unit
// conversion bugs, timezone offsets) that selector-based tests can't express.
//
// Note: data.gov.my removed /dashboard/population during the hackathon.
// Kawasanku's country-level (non-drilled) view now carries Malaysia's
// headline population figure, so we target that instead. The range-bounded
// assertion is the same either way — that's the whole point of testing
// semantics over structure.

test("Population dashboard renders core charts", async ({ page }) => {
  test.setTimeout(120_000);
  await runSteps({
    page,
    userFlow: "population dashboard smoke",
    steps: [
      { description: "Navigate to https://data.gov.my/dashboard/kawasanku" },
      {
        description: "Wait for the country-level Malaysia view to render",
        waitUntil:
          "A statement like 'Malaysia has a population of N people' or a headline population number is visible",
      },
    ],
    assertions: [
      {
        assertion:
          "The page shows Malaysia's total population as a number greater than 20 million and less than 40 million",
      },
      {
        assertion:
          "At least one demographic chart or data panel is rendered (population pyramid, ethnicity/sex breakdown, age distribution, or similar)",
      },
      { assertion: "An area or state selector is visible for drilling into sub-national views" },
      {
        assertion:
          "No visible error banners, empty chart placeholders, or NaN values are present",
      },
    ],
    test,
    expect,
  });
});
