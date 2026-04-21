import { test, expect, devices } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ ...devices["iPhone 14"], headless: !!process.env.CI });

// Mobile regression without pixel matching — Passmark's visual reasoning
// asserts layout semantics (no horizontal scroll, reachable controls) directly.

test("Homepage is usable on mobile without horizontal scroll", async ({ page }) => {
  test.setTimeout(180_000);
  await runSteps({
    page,
    userFlow: "mobile homepage",
    steps: [
      { description: "Navigate to https://data.gov.my" },
      { description: "Wait for the mobile layout to settle", waitUntil: "The page is fully rendered" },
    ],
    assertions: [
      { assertion: "Content fits within the viewport — no horizontal scroll bar is present" },
      {
        assertion:
          "A hamburger or mobile navigation menu is visible instead of a full desktop nav",
      },
      { assertion: "The search input, if present, is reachable without pinch-zoom" },
      { assertion: "No overlapping UI elements or text clipping is visible" },
    ],
    test,
    expect,
  });
});
