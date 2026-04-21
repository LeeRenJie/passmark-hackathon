import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

// Verifies API keys + passmark + playwright are wired up end-to-end before we
// point the suite at government portals. Mirrors the Passmark README example.

test.use({ headless: !!process.env.CI });

test("Passmark quickstart — add product to cart on demo.vercel.store", async ({ page }) => {
  test.setTimeout(90_000);
  await runSteps({
    page,
    userFlow: "quickstart shopping cart smoke",
    steps: [
      { description: "Navigate to https://demo.vercel.store" },
      { description: "Click Acme Circles T-Shirt" },
      { description: "Select color", data: { value: "White" } },
      { description: "Select size", data: { value: "S" } },
      { description: "Add to cart", waitUntil: "My Cart is visible" },
    ],
    assertions: [{ assertion: "You can see My Cart with Acme Circles T-Shirt" }],
    test,
    expect,
  });
});
