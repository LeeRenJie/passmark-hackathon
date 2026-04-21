import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

test("Language toggle swaps UI chrome between EN and BM", async ({ page }) => {
  test.setTimeout(90_000);
  await runSteps({
    page,
    userFlow: "language toggle EN to BM",
    steps: [
      { description: "Navigate to https://data.gov.my" },
      { description: "Capture the visible header nav text in English" },
      {
        description: "Open the language switcher and select Bahasa Malaysia",
        data: { value: "BM" },
      },
      {
        description: "Wait for the UI to reload in BM",
        waitUntil: "Header navigation is now in Malay",
      },
    ],
    assertions: [
      { assertion: "Header navigation labels are in Bahasa Malaysia, not English" },
      {
        assertion:
          "At least one label such as 'Papan Pemuka', 'Katalog', or 'Laman Utama' is visible",
      },
      { assertion: "No English-only fallback labels remain in the top-level navigation" },
    ],
    test,
    expect,
  });
});
