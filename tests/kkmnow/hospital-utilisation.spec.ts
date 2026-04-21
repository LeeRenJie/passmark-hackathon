import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

// The KKMNow dashboard lazy-loads its utilisation numbers below the fold and
// sometimes rate-limits the Gemini wait-condition checker via OpenRouter.
// One retry absorbs transient gateway hiccups; a scroll step forces the
// IntersectionObserver-gated content to hydrate before assertions run.
test.describe.configure({ retries: 1 });

test("KKMNow hospital bed utilisation dashboard loads", async ({ page }) => {
  test.setTimeout(240_000);
  await runSteps({
    page,
    userFlow: "kkmnow hospital beds",
    steps: [
      { description: "Navigate to https://data.moh.gov.my/dashboard/hospital-bed-utilisation" },
      {
        description:
          "Scroll down slowly through the entire page to trigger lazy-loading of charts, ranked lists, and the facility table below the fold",
      },
      {
        description: "Pause briefly for any remaining lazy-loaded charts to render",
        waitUntil:
          "The page shows either a map of Malaysia, a ranked list of states with percentages, or a facility table — not just section labels",
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
