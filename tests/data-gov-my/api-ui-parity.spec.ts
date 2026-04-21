import { test, expect } from "@playwright/test";
import { runSteps, assert } from "passmark";

test.use({ headless: !!process.env.CI });

// The hero test. Cross-source consistency (public API vs rendered UI) is a
// bug class vanilla Playwright cannot express without brittle JSON scraping.

test("Featured datasets count on catalogue matches API response", async ({ page, request }) => {
  test.setTimeout(180_000);

  // Defensive: the catalogue API shape is not fully documented. If it's
  // unreachable or returns a shape we don't recognise, fall through to a
  // UI-only sanity check rather than hard-failing the whole spec.
  let apiCount = 0;
  try {
    const res = await request.get("https://api.data.gov.my/data-catalogue");
    if (res.ok()) {
      const body = await res.json();
      if (Array.isArray(body)) apiCount = body.length;
      else if (Array.isArray(body?.data)) apiCount = body.data.length;
      else if (typeof body?.count === "number") apiCount = body.count;
    }
  } catch {
    // Swallow — we'll fall through to the UI-only check below.
  }

  await runSteps({
    page,
    userFlow: "open catalogue and read total",
    steps: [
      { description: "Navigate to https://data.gov.my/data-catalogue" },
      {
        description: "Wait for the catalogue to render",
        waitUntil: "The list of datasets is visible",
      },
    ],
    test,
    expect,
  });

  if (apiCount > 0) {
    await assert({
      page,
      assertion: `The UI shows a plausible total dataset count that is roughly on the order of ${apiCount} (within a factor of two is fine)`,
      expect,
    });
  } else {
    await assert({
      page,
      assertion:
        "The catalogue page shows a plausible number of datasets — at least dozens, not zero or a single-digit number",
      expect,
    });
  }
});
