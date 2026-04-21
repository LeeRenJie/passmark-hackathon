# Passmark × Malaysia's Open-Data Stack

An end-to-end regression-testing suite for three Malaysian government open-data portals, built with [**Passmark**](https://github.com/bug0inc/passmark) — Bug0's open-source AI-driven Playwright testing library.

Submitted to Bug0's [**Breaking Apps Hackathon**](https://hashnode.com/hackathons/breaking-things) (April–May 2026).

## Thesis

Malaysia's three sibling open-data portals — [`data.gov.my`](https://data.gov.my) (MAMPU), [`OpenDOSM`](https://open.dosm.gov.my) (Department of Statistics), and [`KKMNow`](https://data.moh.gov.my) (Ministry of Health) — are **civic infrastructure** consumed by journalists, researchers, policy analysts, and downstream credit-scoring and academic systems. They should be regression-tested the way production SaaS is regression-tested, and there is no public record of anyone doing so.

This suite is a proof-of-concept that **AI-driven plain-English testing** — specifically Passmark — makes it cheap enough to do.

The tests here never read a DOM selector. Every assertion is a natural-language, semantic claim like *"the headline total-population KPI is a number between 20 million and 40 million"* or *"the latest inflation rate is shown as a percentage between -3% and 15%"*. Two LLMs independently verify each assertion; a third arbitrates disagreements.

## Test coverage

11 specs, 13 tests total, covering:

| # | Spec | What it proves |
|---|---|---|
| 1 | `data-gov-my/homepage` | Basic availability + navigation |
| 2 | `data-gov-my/catalogue-search` | Search relevance + frequency-filter correctness (2 tests) |
| 3 | `data-gov-my/dataset-detail` | Metadata + download formats + API snippet |
| 4 | `data-gov-my/dashboard-population` | **Range-bounded KPI** — 20M < total population < 40M |
| 5 | `data-gov-my/dashboard-kawasanku` | State drill-down changes view (Malaysia → Selangor) |
| 6 | `data-gov-my/language-toggle` | Bahasa Malaysia / English locale swap |
| 7 | `data-gov-my/api-ui-parity` | UI dataset count matches public catalogue API |
| 8 | `data-gov-my/api-docs` | Developer portal has working examples |
| 9 | `data-gov-my/mobile-responsive` | No horizontal scroll on iPhone viewport |
| 10 | `dosm/opendosm-inflation` | CPI range check (-3% to 15%) + trend chart + category breakdown |
| 11 | `kkmnow/hospital-utilisation` | Bed-utilisation percentages 0-120% + data freshness |
| 12 | `smoke/quickstart` | Passmark canonical example against `demo.vercel.store` |

Every assertion is semantic, not structural. None of them reference a CSS class, `data-testid`, or DOM path.

## Running the suite

### Prerequisites

- Node.js 18+
- Docker (for the Redis step-cache)
- An OpenRouter API key (`sk-or-...`) — obtainable free from the Breaking Apps Hackathon, or via [openrouter.ai](https://openrouter.ai)

### Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium webkit

# Start Redis for step caching (Passmark caches successful single-tool actions here)
docker run -d --name passmark-redis -p 6379:6379 redis:alpine

# Create .env
cat > .env <<EOF
OPENROUTER_API_KEY=sk-or-...
REDIS_URL=redis://localhost:6379
EOF
```

### Run tests

```bash
# Smoke test — confirms Passmark + OpenRouter wiring works (~1 min)
npm run test:smoke

# Full suite (~20 min cold cache; faster with warm cache on reruns)
npm run test

# Individual portals
npm run test:data-gov-my
npm run test:dosm
npm run test:kkmnow

# Open the HTML report after a run
npm run report
```

## Architecture notes

### Why semantic assertions matter

A traditional Playwright assertion checks DOM structure: *"an element with class `kpi-total` contains the text 34.2 million"*. That catches the page rendering, not whether the numbers make sense.

A Passmark semantic assertion captures the invariant you actually care about: *"Malaysia's total population KPI is a number between 20 million and 40 million"*. It catches unit-conversion bugs, missing-data bugs, timezone regressions, and locale-flip bugs — the entire class of data-integrity regressions that selector tests sail past.

### Why Redis step caching

Passmark caches **successful single-tool Playwright actions** to Redis, keyed by `userFlow + step.description`. On subsequent runs, cached steps replay as native Playwright at millisecond speed with zero LLM cost. Multi-step descriptions (e.g. *"open the area selector and choose Selangor, then wait"*) are **not** cached by design — they're considered behaviourally non-deterministic on replay.

To maximise cache coverage, author each description as a single atomic action:

```typescript
// Poorly cached (compound)
{ description: "Open the frequency filter, select Yearly, and wait for the list to refresh" }

// Well cached (atomic × 3)
{ description: "Open the frequency filter" }
{ description: "Select Yearly", data: { value: "Yearly" } }
{ description: "Wait for the list to refresh", waitUntil: "Filter chip shows Yearly" }
```

### Why OpenRouter gateway

All AI calls route through OpenRouter rather than direct Anthropic / Google SDKs. This has two benefits:

1. **Pooled credits** — a single API key covers Claude, Gemini, and the arbiter model.
2. **Rate-limit pooling** — free-tier Gemini caps at 5 RPM, which can't sustain a multi-model-consensus run across 13 specs. OpenRouter removes that ceiling.

See `playwright.config.ts` for the `configure({ ai: { gateway: "openrouter" } })` wiring.

## Repo layout

```
.
├── playwright.config.ts       # Passmark + dotenv wiring, serial worker setup
├── tests/
│   ├── smoke/                 # Canonical Passmark README example
│   ├── data-gov-my/           # 9 specs against MAMPU's portal
│   ├── dosm/                  # 1 spec against OpenDOSM (inflation)
│   └── kkmnow/                # 1 spec against KKMNow (bed utilisation)
├── scripts/
│   └── capture-report.js      # Reproducible HTML-report → PNG capture
├── screenshots/               # Captured pass/fail detail views from a clean run
├── docs/
│   └── hackathon-test-plan.md # The design document that preceded the suite
├── .env.example               # Template for local config
├── .gitignore
├── package.json
└── README.md
```

## Credits

- **[Passmark](https://github.com/bug0inc/passmark)** — the open-source core this suite is built on
- **[Bug0](https://bug0.com)** — for running the hackathon and provisioning pooled OpenRouter credits
- **[data.gov.my](https://data.gov.my)**, **[OpenDOSM](https://open.dosm.gov.my)**, **[KKMNow](https://data.moh.gov.my)** — for operating the public portals this suite tests, and for open-sourcing the frontend stack on GitHub

## License

MIT — see `LICENSE`. The specs in this repo are intended as a reference pattern; fork and adapt freely.
