# Breaking Apps Hackathon — Test Plan

**Event:** Bug0 Breaking Apps Hackathon (Passmark)
**Window:** 2026-04-13 → 2026-05-10
**Author:** Ren Jie Lee
**Targets:** Malaysian public data portals — `data.gov.my` (primary) + `open.dosm.gov.my` and `kkmnow.moh.gov.my` (stretch)
**Library:** [Passmark](https://www.npmjs.com/package/passmark) — AI-driven Playwright regression testing.

---

## 1. Why these targets

The thesis: **Malaysia's open-data ecosystem is a perfect Passmark target.** Three public, no-auth, no-CAPTCHA portals built by different ministries — MAMPU, DOSM, MOH — all shipping chart-heavy dashboards with real data. Same story arc, different domains.

| Target | Owner | Why |
|---|---|---|
| **data.gov.my** (primary) | MAMPU (PM's Department) | Whole-of-government open data portal. Catalogue, dashboards, public API. The hero target — most specs live here. |
| **open.dosm.gov.my** (stretch) | DOSM | Dept of Statistics open platform. Interactive stats dashboards (inflation, labour, trade). Different tech surface from data.gov.my. |
| **kkmnow.moh.gov.my** (stretch) | Ministry of Health | Health dashboards (hospital utilisation, blood stock, vaccine coverage). Range-check assertions are *very* catchable here. |

Avoided: Malaysian government **auth** portals (LHDN MyTax, EPF i-Akaun, MySejahtera, MyGov single sign-on) — CAPTCHA/WAF will break Passmark, and running AI-driven automation against citizen auth portals is a bad idea legally (Computer Crimes Act 1997) and reputationally. The three picks above are *explicitly* designed for public consumption and have official APIs.

---

## 2. Environment setup

```bash
cd C:/Users/RenJieLee/Desktop/Personal/passmark
npm init playwright@latest hackathon-tests  # select TypeScript
cd hackathon-tests
npm install passmark dotenv
```

`.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
# Optional — cache step resolutions across runs to save AI cost
REDIS_URL=redis://localhost:6379
```

`playwright.config.ts` additions:

```typescript
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });
```

Cost control: keep `REDIS_URL` set locally so repeat runs hit cache, not AI. Use `bypassCache: true` only for the final "clean run" that feeds the article.

---

## 3. Primary target — `data.gov.my`

Public surface worth testing:

- **Homepage** — search, featured datasets, navigation
- **Catalogue** — filter by ministry/frequency/tag
- **Dataset detail** — metadata, download buttons (CSV/Parquet/JSON), API snippet
- **Dashboards** — e.g. `/dashboard/population`, `/dashboard/kawasanku`
- **Language toggle** — EN ↔ BM content switch
- **Data Catalogue API** — `https://api.data.gov.my` cross-check against UI

### 3.1 Test suite layout

```
hackathon-tests/tests/
  data-gov-my/
    homepage.spec.ts
    catalogue-search.spec.ts
    dataset-detail.spec.ts
    dashboard-population.spec.ts
    dashboard-kawasanku.spec.ts
    language-toggle.spec.ts
    api-ui-parity.spec.ts
    api-docs.spec.ts
    mobile-responsive.spec.ts
  dosm/
    opendosm-inflation.spec.ts
  kkmnow/
    hospital-utilisation.spec.ts
```

### 3.2 Spec 1 — homepage sanity

```typescript
// tests/data-gov-my/homepage.spec.ts
import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ headless: !!process.env.CI });

test("Homepage loads with search and navigation", async ({ page }) => {
  test.setTimeout(60_000);
  await runSteps({
    page,
    userFlow: "data.gov.my homepage smoke",
    steps: [
      { description: "Navigate to https://data.gov.my" },
      { description: "Wait for homepage to finish loading", waitUntil: "A search input is visible" },
    ],
    assertions: [
      { assertion: "A global search input is present and visible" },
      { assertion: "The header shows navigation to Catalogue and Dashboard sections" },
      { assertion: "The footer displays MAMPU or official government attribution" },
      { assertion: "At least one featured or highlighted dataset card is visible" },
    ],
    test,
    expect,
  });
});
```

### 3.3 Spec 2 — catalogue search

```typescript
// tests/data-gov-my/catalogue-search.spec.ts
import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test("Catalogue search returns relevant datasets", async ({ page }) => {
  test.setTimeout(90_000);
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
      { assertion: "Every visible result title or description mentions population, demographic, or census" },
      { assertion: "Each result card links to a dataset detail page" },
    ],
    test,
    expect,
  });
});

test("Filtering by frequency narrows results", async ({ page }) => {
  test.setTimeout(90_000);
  await runSteps({
    page,
    userFlow: "filter catalogue by frequency",
    steps: [
      { description: "Navigate to https://data.gov.my/data-catalogue" },
      { description: "Open the frequency or update-period filter" },
      { description: "Select a non-default frequency such as Monthly or Yearly", data: { value: "Yearly" } },
      { description: "Wait for the list to refresh", waitUntil: "Filter chip shows Yearly and results count changed" },
    ],
    assertions: [
      { assertion: "A chip or badge indicating the Yearly filter is applied is visible" },
      { assertion: "The result count is smaller than or equal to the unfiltered count" },
    ],
    test,
    expect,
  });
});
```

### 3.4 Spec 3 — dataset detail + download

```typescript
// tests/data-gov-my/dataset-detail.spec.ts
import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test("Dataset detail page exposes metadata and download formats", async ({ page }) => {
  test.setTimeout(90_000);
  await runSteps({
    page,
    userFlow: "open first dataset and inspect",
    steps: [
      { description: "Navigate to https://data.gov.my/data-catalogue" },
      { description: "Open the first dataset in the catalogue" },
      { description: "Wait for the dataset page to load", waitUntil: "Dataset title and metadata panel are visible" },
    ],
    assertions: [
      { assertion: "The page shows the dataset title, description, and a last-updated timestamp" },
      { assertion: "At least one download action exists for CSV, Parquet, or JSON" },
      { assertion: "A data preview table or chart is visible" },
      { assertion: "An API usage snippet (curl or JS) is shown somewhere on the page" },
    ],
    test,
    expect,
  });
});
```

### 3.5 Spec 4 — population dashboard invariants

```typescript
// tests/data-gov-my/dashboard-population.spec.ts
import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test("Population dashboard renders core charts", async ({ page }) => {
  test.setTimeout(120_000);
  await runSteps({
    page,
    userFlow: "population dashboard smoke",
    steps: [
      { description: "Navigate to https://data.gov.my/dashboard/population" },
      { description: "Wait for the main KPI tiles to finish loading", waitUntil: "A number representing total population is visible" },
    ],
    assertions: [
      { assertion: "A headline KPI shows Malaysia's total population as a number greater than 20 million and less than 40 million" },
      { assertion: "A chart visualizing population by age or ethnicity is rendered" },
      { assertion: "A filter or state selector is available and defaults to a reasonable value" },
      { assertion: "No visible error banners, empty chart placeholders, or NaN values are present" },
    ],
    test,
    expect,
  });
});
```

This is the **strongest assertion in the suite** for a judge — the range check catches real regressions (missing data, unit-conversion bugs, timezone-offset bugs) that selector-based tests miss.

### 3.6 Spec 5 — language toggle

```typescript
// tests/data-gov-my/language-toggle.spec.ts
import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test("Language toggle swaps UI chrome between EN and BM", async ({ page }) => {
  test.setTimeout(90_000);
  await runSteps({
    page,
    userFlow: "language toggle EN to BM",
    steps: [
      { description: "Navigate to https://data.gov.my" },
      { description: "Capture the visible header nav text in English" },
      { description: "Open the language switcher and select Bahasa Malaysia", data: { value: "BM" } },
      { description: "Wait for the UI to reload in BM", waitUntil: "Header navigation is now in Malay" },
    ],
    assertions: [
      { assertion: "Header navigation labels are in Bahasa Malaysia, not English" },
      { assertion: "At least one label such as 'Papan Pemuka', 'Katalog', or 'Laman Utama' is visible" },
      { assertion: "No English-only fallback labels remain in the top-level navigation" },
    ],
    test,
    expect,
  });
});
```

### 3.7 Spec 6 — API ↔ UI parity (the hero test)

```typescript
// tests/data-gov-my/api-ui-parity.spec.ts
import { test, expect } from "@playwright/test";
import { runSteps, assert } from "passmark";

test("Featured datasets count on homepage matches API catalogue response", async ({ page, request }) => {
  test.setTimeout(120_000);

  // Authoritative source: the public API
  const res = await request.get("https://api.data.gov.my/data-catalogue");
  expect(res.ok()).toBeTruthy();
  const catalogue = await res.json();
  const apiCount = Array.isArray(catalogue) ? catalogue.length : catalogue?.data?.length ?? 0;
  expect(apiCount).toBeGreaterThan(0);

  await runSteps({
    page,
    userFlow: "open catalogue and read total",
    steps: [
      { description: "Navigate to https://data.gov.my/data-catalogue" },
      { description: "Wait for the total dataset count indicator to appear", waitUntil: "A total count label is visible" },
    ],
    test,
    expect,
  });

  await assert({
    page,
    assertion: `The UI reports a total dataset count that is within 10% of ${apiCount}`,
    expect,
  });
});
```

This is the standout assertion — **cross-source consistency** is a category of bug that traditional Playwright tests can't express without brittle scraping. Lead with this in the article.

### 3.8 Spec 7 — Kawasanku area drill-down

`Kawasanku` is the state/district/parliament drill-down built into data.gov.my. Good target because it exercises URL-driven state and nested data.

```typescript
// tests/data-gov-my/dashboard-kawasanku.spec.ts
import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test("Kawasanku drills from Malaysia to a specific state", async ({ page }) => {
  test.setTimeout(120_000);
  await runSteps({
    page,
    userFlow: "kawasanku drill into Selangor",
    steps: [
      { description: "Navigate to https://data.gov.my/dashboard/kawasanku" },
      { description: "Wait for the country-level view to load", waitUntil: "A map or KPI panel for Malaysia is visible" },
      { description: "Open the area selector and choose Selangor", data: { value: "Selangor" } },
      { description: "Wait for the state-level view to render", waitUntil: "Breadcrumb or header shows Selangor" },
    ],
    assertions: [
      { assertion: "The page heading, breadcrumb, or URL reflects the Selangor context" },
      { assertion: "At least one demographic KPI (population, median age, or household income) shows a plausible number for Selangor" },
      { assertion: "Values differ from the Malaysia-level view — not reusing national numbers" },
      { assertion: "No chart is empty or shows a loading skeleton after the wait" },
    ],
    test,
    expect,
  });
});
```

### 3.9 Spec 8 — Developer API documentation

```typescript
// tests/data-gov-my/api-docs.spec.ts
import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test("API documentation page exposes working examples", async ({ page }) => {
  test.setTimeout(90_000);
  await runSteps({
    page,
    userFlow: "api docs smoke",
    steps: [
      { description: "Navigate to https://developer.data.gov.my" },
      { description: "Wait for the developer portal landing page to load", waitUntil: "Documentation navigation is visible" },
      { description: "Open the Data Catalogue API section" },
    ],
    assertions: [
      { assertion: "A curl or fetch example request is shown for the catalogue endpoint" },
      { assertion: "The example response body is valid JSON with at least one field name that looks like a dataset identifier" },
      { assertion: "A link or section covering rate limits or authentication is present" },
    ],
    test,
    expect,
  });
});
```

### 3.10 Spec 9 — Mobile viewport smoke

Passmark's visual reasoning makes mobile responsiveness easy to assert without pixel matching.

```typescript
// tests/data-gov-my/mobile-responsive.spec.ts
import { test, expect, devices } from "@playwright/test";
import { runSteps } from "passmark";

test.use({ ...devices["iPhone 14"] });

test("Homepage is usable on mobile without horizontal scroll", async ({ page }) => {
  test.setTimeout(90_000);
  await runSteps({
    page,
    userFlow: "mobile homepage",
    steps: [
      { description: "Navigate to https://data.gov.my" },
      { description: "Wait for the mobile layout to settle", waitUntil: "The page is fully rendered" },
    ],
    assertions: [
      { assertion: "Content fits within the viewport — no horizontal scroll bar is present" },
      { assertion: "A hamburger or mobile navigation menu is visible instead of a full desktop nav" },
      { assertion: "The search input, if present, is reachable without pinch-zoom" },
      { assertion: "No overlapping UI elements or text clipping is visible" },
    ],
    test,
    expect,
  });
});
```

---

## 4. Stretch targets — `open.dosm.gov.my` and `kkmnow.moh.gov.my`

One spec each. Do these **only after** all nine data.gov.my specs are green. They make the article's "MY public data portfolio" thesis complete.

### 4.1 OpenDOSM — inflation dashboard

```typescript
// tests/dosm/opendosm-inflation.spec.ts
import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test("OpenDOSM inflation dashboard shows plausible CPI values", async ({ page }) => {
  test.setTimeout(120_000);
  await runSteps({
    page,
    userFlow: "opendosm inflation",
    steps: [
      { description: "Navigate to https://open.dosm.gov.my/dashboard/consumer-prices" },
      { description: "Wait for the CPI headline and trend chart", waitUntil: "A headline inflation figure is visible" },
    ],
    assertions: [
      { assertion: "A headline year-on-year inflation rate is shown as a percentage between -3% and 15%" },
      { assertion: "A trend chart covering at least the last 12 months is rendered" },
      { assertion: "A breakdown by expenditure category (food, transport, housing, etc.) is visible" },
      { assertion: "No chart placeholder, error banner, or NaN value is shown" },
    ],
    test,
    expect,
  });
});
```

### 4.2 KKMNow — hospital utilisation

```typescript
// tests/kkmnow/hospital-utilisation.spec.ts
import { test, expect } from "@playwright/test";
import { runSteps } from "passmark";

test("KKMNow hospital bed utilisation dashboard loads", async ({ page }) => {
  test.setTimeout(120_000);
  await runSteps({
    page,
    userFlow: "kkmnow hospital beds",
    steps: [
      { description: "Navigate to https://data.moh.gov.my/dashboard/hospital-bed-utilisation" },
      { description: "Wait for the dashboard to render", waitUntil: "A utilisation metric is visible" },
    ],
    assertions: [
      { assertion: "A headline bed-utilisation percentage between 0% and 120% is shown" },
      { assertion: "A state selector or map lets the user drill into individual states" },
      { assertion: "A last-updated timestamp is visible and within the last 90 days" },
      { assertion: "No error banner or empty chart placeholder is present" },
    ],
    test,
    expect,
  });
});
```

The "last updated within 90 days" assertion is a **data freshness** check — another class of regression that vanilla Playwright can't express without hard-coding dates.

---

## 5. Article outline (Hashnode submission)

**Title candidates:**
- "Breaking Malaysia's Open Data Stack with 100 Lines of English — Testing data.gov.my, OpenDOSM, and KKMNow with Passmark"
- "I Let Claude and Gemini Argue About Malaysia's Census, CPI, and Hospital Beds"
- "Regression Testing Three Malaysian Government Dashboards Without Writing a Single Selector"

**Structure:**

1. **Hook** — AI-vs-AI assertion verifying population KPI sits in 20–40M. Screenshot of Passmark's multi-model consensus disagreeing + arbiter deciding.
2. **Why Malaysia's open-data portals** — the MAMPU/DOSM/MOH ecosystem, why public government dashboards are uniquely interesting regression targets (real data, real dashboards, real users), and the legal boundary (only public, unauthenticated portals with official APIs — explicitly out of scope for Computer Crimes Act concerns).
3. **Setup in 5 minutes** — `.env`, Playwright scaffold, first spec against data.gov.my homepage.
4. **The hero test** — API ↔ UI parity spec. Explain why cross-source consistency is a bug class vanilla Playwright can't express without brittle JSON scraping.
5. **Going semantic** — range-bounded KPIs (Malaysia's population is 20–40M, inflation is -3% to 15%, bed utilisation is 0–120%). Why these catch real bugs (unit errors, missing data, localisation breakage) that selectors miss.
6. **Data freshness as an assertion** — the KKMNow "updated within 90 days" check. How you'd ever do this without an LLM reading timestamps.
7. **What Passmark caught I didn't expect** — fill in after runs. Candidates: stale BM translation, broken download link, dashboard placeholder not clearing, mobile nav collision.
8. **Cost & latency** — Redis cache hit-rate across 3 runs, token spend, total wall-clock. Prove to readers it's not prohibitive.
9. **Limits** — animated chart loading, date/locale ambiguity, when plain Playwright is still the better tool.
10. **Takeaway** — natural-language assertions shine on *semantic* invariants (ranges, parity, freshness, localisation). They're the right tool for public data portals specifically.

Social post: tag `@bug0inc` on X, include the multi-model consensus screenshot + a 15-second Playwright trace GIF showing one dashboard spec.

---

## 6. Execution timeline

| Date | Milestone |
|---|---|
| 2026-04-21 | Scaffold project, run Passmark quickstart against demo.vercel.store to confirm env + API keys work |
| 2026-04-22 | data.gov.my specs 1–3 (homepage, catalogue search, dataset detail) |
| 2026-04-23 | data.gov.my specs 4–6 (population dashboard, language toggle, API↔UI parity) |
| 2026-04-24 | data.gov.my specs 7–9 (Kawasanku, API docs, mobile viewport) |
| 2026-04-25 | Stretch — OpenDOSM + KKMNow specs |
| 2026-04-26 | Clean run with `bypassCache: true`, capture traces + screenshots, note any bugs found |
| 2026-04-27 | Draft Hashnode article |
| 2026-04-28 | Polish article, record GIF, publish, social posts |
| 2026-05-10 | Hackathon deadline (≈2-week buffer for rewrites) |

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Any of the three portals changes layout mid-hackathon | Assertions are semantic, not selector-based. Re-run before publish. |
| Dashboard charts lazy-load → flaky waits | Use explicit `waitUntil` with natural-language conditions; avoid `page.waitForTimeout`. |
| AI cost balloons over many iterations | Keep Redis cache on locally; only `bypassCache` on the final recorded run that feeds the article. |
| Multi-model consensus disagrees and arbiter misfires | Document the disagreement in the article — it's a feature, not a bug. |
| Hitting WAF/rate limits on gov portals | Cap concurrency at 1 per target; use `test.describe.serial`. Space reruns; don't hammer. |
| Stretch targets (OpenDOSM/KKMNow) not reached in time | They're explicitly stretch. The article works on data.gov.my alone. |

---

## 8. Submission checklist

- [ ] Forked and starred `bug0inc/passmark`
- [ ] All specs green on a clean-cache run
- [ ] Playwright HTML report archived (zip the `playwright-report/` dir)
- [ ] Hashnode article published with tag `#BreakingApps`
- [ ] X post tagging `@bug0inc`, LinkedIn post tagging Bug0
- [ ] Article submitted via the hackathon form before 2026-05-10
