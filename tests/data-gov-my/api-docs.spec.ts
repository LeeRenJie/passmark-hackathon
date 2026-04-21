import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

test("API documentation page exposes working examples", async ({ page }) => {
  test.setTimeout(90_000);
  await runSteps({
    page,
    userFlow: "api docs smoke",
    steps: [
      { description: "Navigate to https://developer.data.gov.my" },
      {
        description: "Wait for the developer portal landing page to load",
        waitUntil: "Documentation navigation is visible",
      },
      { description: "Open the Data Catalogue API section" },
    ],
    assertions: [
      {
        assertion:
          "At least one code example request in any language (curl, fetch, Python, requests, etc.) is shown for a catalogue endpoint",
      },
      {
        assertion:
          "The page either displays an example response body or clearly links to a response-format section where the response shape is documented",
      },
      { assertion: "A link or section covering rate limits or authentication is present" },
    ],
    test,
    expect,
  });
});
