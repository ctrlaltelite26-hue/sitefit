# Sitefit — Build Plan (start → finish)

**Hackathon:** [Qloo Agentic Hackathon](https://qloo.devpost.com/) — *Agents, but with taste.*  
**Deadline:** Oct 30, 2026 @ 11:45pm EDT  
**Prizes:** $15k / $6k / $4k + Jason Calacanis invests $25k in his favorite entry  
**Builder:** Solo unless noted · **Window:** Oct 23–29 build (7 days, compressed) · submit Oct 30  
**Product:** A site-fit agent that writes a go / no-go lease memo from Qloo cultural affinity, not census data or LLM guesswork.

### Solo MVP freeze (do not expand)

| Must ship | Stretch (only if ahead) | Explicitly out |
|-----------|-------------------------|----------------|
| Back-test: 3–5 real opened-vs-closed pairs, weights frozen first | Back-test grows to 8–10 pairs | Tuning weights after seeing back-test results |
| Two-concept comparison on one address | Heatmap / block grid (`urn:heatmap`) | Multi-tenant SaaS, billing, auth |
| Preset deals that always return Qloo data | Freeform address + concept search | Live rent comps, foot traffic, Placer |
| Agent loop: resolve → fan-out insights → score → memo | PDF / shareable memo link | Consumer recs, dating, travel concierge |
| Evidence drawer: every claim cites a Qloo hop | Co-tenant “pitch deck” page | Identity, cookies, user profiles |
| Hosted demo + public repo + OSS license | Extra cities beyond the preset set | Storing Qloo payloads in the public repo |

If time collapses: **one preset deal, two concepts, one memo with cited affinities** beats a pretty empty chat.

The judge must be able to say: “this memo is wrong if you unplug Qloo.”

---

## 1. Pitch and falsifiable claim

**Pitch.** Sitefit is the memo a restaurant group, franchisee, or retail broker sends the night before a lease signing. Placer and census PDFs count how many people walk past. Sitefit answers a different question: **are they the right people?** The agent takes one address and two concepts, asks Qloo what that block culturally over-indexes for, and returns a go / no-go with evidence.

**Who writes the check (company story, not the MVP).** VP of Development at a multi-unit restaurant group, a franchise development manager, or a leasing broker. They already pay for foot-traffic tools and demographic packets. A single site is a $500k–$2M decision. Qloo already sold the raw insight to Clarion Partners (Magnificent Mile tenant pitch) and to a jewelry brand picking streets. Sitefit sells the **decision artifact**, not the graph.

**What this is not.** A heatmap explorer. A “AI concierge.” Qloo’s Clarion case study rebuilt as a dashboard. If a judge can get the same answer by clicking around Qloo’s own site, you do not have a product.

**Falsifiable claim (FitBench).**

| Condition | Metric | Target |
|-----------|--------|--------|
| LLM-only memo (no Qloo; same address + concepts) | Invented affinities / unsourced “this area feels like…”) | Report Y% of claims unsourced (expect high) |
| Sitefit treatment | Every affinity sentence cites a Qloo entity + score | **100%** of scored claims cited |
| Ablation: Qloo results dropped; model still writes memo | Memo still sounds confident | Must happen; UI must refuse or watermark “ungrounded” |
| Preset deals | Both concepts return a score and a winner | 3/3 presets produce a memo |
| Latency | Intake → memo | p50 < 20s, p95 < 45s on presets |
| **Back-test (FitBack)** | Real pairs where one concept survived and one closed; weights frozen before running | Report hit rate honestly (e.g. “picked the survivor in 4 of 5”). Target ≥ 3/5; publish misses too |

**Invariant S1.** The model never invents an affinity number. Scores come from Qloo `affinity` / explainability only.

**Invariant S2.** A memo row with `verdict` (`go` / `caution` / `no-go`) cannot be written unless at least one successful Insights call contributed to that concept.

**Invariant S3.** If Qloo returns empty entities for a hop, the UI shows `insufficient cultural signal`, not a guessed paragraph.

**Invariant S4.** Scoring weights are frozen and committed (with a git tag) **before** the back-test runs. No weight changes after looking at back-test outcomes. This is what makes the scores credible instead of tuned-to-win.

---

## 2. Why this wins (criteria map)

| Criterion | How Sitefit scores |
|-----------|-------------------|
| **Technological Implementation** | Multiple real Insights hops (place, brand, artist/movie), `/search` + `/v2/tags`, `feature.explainability=true`, location as WKT / locality query. Not one `/v2/insights` call. |
| **Design** | A finished memo a broker would forward. Preset deals so the judge is never stuck on search. Agent trace visible, not hidden. |
| **Potential Impact** | Named buyer, existing budget, expensive wrong call. Calacanis can see the Placer-shaped company. A back-test on real openings and closures shows the scores predict something. |
| **Quality of Idea** | Cross-domain taste (wine-bar comps → brands / films / nearby places) is the non-obvious Qloo use. Site selection is Qloo’s real sales motion, wrapped as an agent that does the analyst’s job. |

**Judge map**

| Judge | What they should see |
|-------|----------------------|
| Jason Calacanis | Company: lease memo → broker wedge → brand / landlord seats |
| Mike Diolosa (Qloo CTO) | Locality + brands + places + explainability, not a wrapper of one rec list |
| Todd Boehly | Real-asset decision, not a toy |
| Michael Abrams / Cedric | Cross-domain culture on the evidence drawer (artists, films, brands on a block) |
| Nicole Seligman | The agent actually tools; the model does not decide fit alone |

---

## 3. Hard constraints and design consequences

| Constraint | Source | Consequence |
|------------|--------|-------------|
| Hackathon key only works on `https://hackathon.api.qloo.com` | Qloo hackathon guide | Never call staging/prod. Env: `QLOO_BASE_URL` + `QLOO_API_KEY` |
| Auth is `X-Api-Key`, not Bearer | Guide | Client header is fixed; 401 = wrong host or wrong header |
| `/v2/insights` is **GET**; query string, not JSON body | Guide (POST “will fail”) | Resolve names with `/search` first. Do not rely on POST-only params (`signal.interests.entities.query`) unless you verify POST on the hackathon host |
| Do not use `/recs` or `/recommendations` | Guide | Insights only |
| Supported Insights types | Guide | `artist`, `book`, `brand`, `destination`, `movie`, `person`, `place`, `podcast`, `tv_show`, `video_game`. **No** `urn:entity:food_and_drink`. Food = `place` or `brand` |
| `urn:heatmap` is **not** in the supported-type list | Guide + 403 rule | Treat heatmap as stretch. If 403, neighborhood read = nearby `place` + `brand` lists |
| Invalid params are **silently ignored** | Guide | Empty 200 ≠ “no culture here.” Validate params per `filter.type` before scoring |
| Tags and audiences must be Qloo IDs, not strings | Guide | `/v2/tags` then `filter.tags` / `signal.interests.tags` |
| `take` max 50 | Parameter reference | Page if needed; presets only need 8–12 |
| `feature.explainability=true` | Parameter reference | Turn on for every scoring call; this is the “why” in the memo |
| Location: WKT is **longitude first** | `filter.location` | `POINT(-73.99823 40.722668)` not lat-lon |
| `filter.location.query` fuzzy-matches localities | Docs | Presets use known localities (`West Village`, `Williamsburg`, `Silver Lake`) |
| Cache Qloo server-side only | Guide | In-memory / private cache OK. **Never commit response JSON** |
| Keys take a few business days | Guide | Request key **day one**. Build against fixtures until it arrives |
| Demo must be hosted and public | Devpost | Vercel (or equivalent). Localhost does not qualify |
| OSS license file visible | Devpost | MIT or Apache-2.0 in repo root |
| “If it works the same without Qloo, wrong thing” | Brief | LLM-only ablation is a first-class demo toggle, not a test-only flag |

---

## 4. The product (what the judge does)

### 4.1 Two-minute path

1. Land on a deal desk with **three preset deals** already named. No signup.
2. Click **West Village corner — wine bar vs sports bar** (or another preset).
3. Watch the agent work: resolve site → resolve concepts → neighborhood taste → score A → score B → write memo.
4. Read a one-page memo: winner, scores, three cited reasons each, landlord-ready paragraph, and an evidence drawer.

Optional later: “try your own deal” (address + two concept names). If Qloo is thin, fall back to `insufficient cultural signal` instead of hallucinating.

### 4.2 Screens (lock this; do not invent a fourth)

| Screen | Job |
|--------|-----|
| **Deal desk** | Pick a preset or start a custom deal. Copy: “Cultural fit for people about to sign a lease.” |
| **Run** | Live tool trace. Each hop shows type, location, and entity count. No chat wallpaper. |
| **Memo** | Side-by-side Concept A / Concept B. Verdict chips. Cited sentences. Forwardable summary. |
| **Evidence** | Drawer or second column: raw Qloo hops (name, type, affinity). This is how Diolosa audits you. |

One viewport, desktop-first. Mobile is stretch.

**UI stack, strict.** Every screen is Tailwind CSS and shadcn/ui. That is the only UI stack. Primitives live in `src/components/ui`. App screens compose those primitives with Tailwind utilities. Theme them to the memo palette in `UI-PROMPTS.md`. If shadcn has no primitive for a piece, build it with Tailwind on the nearest shadcn primitive. No CSS modules, no styled-components, no second component library, and no pasted Stitch markup as the implementation.

**UI source.** Build these screens from `stitch_sitefit_leasing_memo_platform/*/code.html`, checked against `UI-PROMPTS.md` and this section. Read the HTML before porting a screen. The screenshot can hide invented copy: the evidence sheet once contained foot traffic, demographics, renamed concepts, and a made-up “Local cohesion” score while still looking like a memo. Port a block only after the text in the file matches the locked concept names, fit scores, and cited affinities. No foot traffic, demographics, census, income, or crime. Drop labels that are not in the prompt (`DOC REF`, `EXECUTION LOG`, `CONFIDENTIAL`). The evidence file is corrected; the sheet behind the drawer stays the lease memo.

### 4.3 Preset deals (ship these; do not wait on freeform)

Presets exist so judges never hit empty Insights. Each preset stores **resolved Qloo entity IDs** in *our* code (names + IDs we looked up once). That is not “caching Qloo response data”; it is input configuration. If a stored ID 404s, re-search by name at runtime.

| ID | Site | Concept A (should win) | Concept B (should lose) | Why it is the demo |
|----|------|------------------------|-------------------------|--------------------|
| `west-village-wine-vs-sports` | West Village, NYC | Natural wine / small plates (comps: I Sodi, Via Carota, or similar resolved places) | Sports bar (comps: a known NYC sports-bar brand/place) | The layman story. Quiet taste vs generic traffic. |
| `williamsburg-athleisure-vs-outlet` | Williamsburg, Brooklyn | Athleisure / contemporary apparel brand | Outlet / off-price | Clarion-shaped: tenant mix, not restaurants only. |
| `silver-lake-natural-vs-chain` | Silver Lake, LA | Independent coffee + wine hybrid | National fast-casual chain | West-coast preset so the demo is not NYC-only. |

**Acceptance for a preset:** both concepts get a numeric fit score; at least two cross-domain entities appear in the evidence drawer (e.g. a brand and an artist/film, not only restaurants). Presets are illustrations, not proof: the proof is the back-test (§5.7).

**Counter-intuitive preset (if time).** Include one deal where the “obvious” concept loses and the evidence drawer shows why. This signals the scores are not staged.

**Solo 7-day scope:** ship preset 1 (West Village) reliably. Presets 2–3 only if ahead.

If a preset’s locality is empty on the hackathon host, replace the locality — do not fake the score.

---

## 5. Architecture

### 5.1 Shape

One Next.js app (App Router). No monorepo. Server talks to Qloo; the browser never sees `QLOO_API_KEY`.

```
Browser (deal desk / run / memo)
        │
        ▼
Next.js Route Handlers
  POST /api/deals          create deal from preset or custom
  POST /api/deals/:id/run  start agent
  GET  /api/deals/:id      deal + memo + hops
        │
        ▼
Agent orchestrator (Vercel AI SDK or equivalent tool loop)
  tools: searchEntities, searchTags, insights, scoreConcept
        │
        ├── Qloo client (GET only on hackathon host)
        │     /search
        │     /v2/tags
        │     /v2/insights
        │
        └── Memo writer (model)
              input = structured hop results only
              output = zod Memo schema
        │
        ▼
In-memory deal store (Map) for the demo
  optional: SQLite / Vercel KV if you need persistence across refresh
```

**Why an agent framework:** the brief requires an agentic tool, an agent-powered app, or Qloo wired into an existing agent. Tool-calling with a forced tool sequence is the honest reading. Do not fake the trace with `setTimeout`.

**Why the model is not the scorer:** Qloo returns affinity 0–1. We average / compare in code. The model only writes prose that quotes those numbers.

### 5.2 Agent loop (fixed order)

The model may retry a tool, but it may not skip a step or invent a hop.

1. **`resolveSite`**  
   Input: preset locality name and/or WKT `POINT(lon lat)`.  
   Qloo: `/search` if needed; Insights `filter.type=urn:entity:place` + `filter.location.query` (and/or `filter.location`) + restaurant/place tags if we have them.  
   Output: `site { locality, point?, nearbyPlaces[8] }`.

2. **`resolveConcepts`**  
   For each concept: `/search` on stored comps (place + brand).  
   Output: `concepts[].anchors[]` with `entity_id`, `name`, `type`.

3. **`neighborhoodTaste`**  
   From the site, pull what the block “is”:  
   - places already in step 1  
   - Insights `filter.type=urn:entity:brand` + `signal.location.query=<locality>`  
   - Insights `filter.type=urn:entity:artist` + same location signal  
   - optional movie/tv if the previous two return data  
   Output: `taste { brands, artists, places }` — the cultural fingerprint of the site.

4. **`scoreConcept` (once per concept, in code)**  
   For concept C:  
   - Insights `filter.type=urn:entity:place`  
     `signal.interests.entities=<C anchors>`  
     `filter.location.query=<locality>` (or WKT + radius)  
     `feature.explainability=true`  
     `take=10`  
   - Insights `filter.type=urn:entity:brand` with the same signals (no location filter if brand+location is invalid — **check Entity Type Parameter Guide**; if empty, drop location and keep signals).  
   - Optional: `filter.entities=<anchor ids>` against neighborhood entities to read affinity of the concept toward the site’s taste.  
   Code computes `fitScore` 0–100 from returned affinities (see §6.3).  
   Output: `score { fitScore, nearbyFits[], explain[] }`.

5. **`writeMemo`**  
   Model receives only the structured object from 1–4. Zod schema. If a field is missing, the sentence is omitted.

**Tool budget:** max 12 Qloo calls per run. Presets should land around 7–9.

### 5.3 Qloo client rules

```
GET {QLOO_BASE_URL}/search?query=...&types=urn:entity:place&take=6
GET {QLOO_BASE_URL}/v2/tags?query=...
GET {QLOO_BASE_URL}/v2/insights?filter.type=...&...
Header: X-Api-Key: {QLOO_API_KEY}
```

- Log every request: path, `filter.type`, param keys, status, `entities.length`, duration. No API key in logs.
- Retry once on 429 / 5xx. Do not retry empty 200.
- Private cache key: `hash(path + sorted query)`. TTL 24h in the demo process is fine.
- Normalize a hop into:

```ts
type QlooHop = {
  id: string
  purpose: "site_places" | "site_brands" | "site_artists" | "concept_places" | "concept_brands"
  filterType: string
  params: Record<string, string>      // no secrets
  entityCount: number
  entities: Array<{
    entityId: string
    name: string
    type: string
    affinity: number | null
    popularity: number | null
    tags: string[]
    explain?: Array<{ inputId: string; inputName?: string; weight: number }>
  }>
  warning?: string                    // empty, 403, ignored-param suspicion
}
```

### 5.4 Data model (minimum)

| Entity | Key fields |
|--------|------------|
| `Deal` | id, presetId?, siteLabel, localityQuery, pointWkt?, createdAt |
| `Concept` | id, dealId, label, role (`challenger` \| `control`), anchorQueries[] |
| `Anchor` | conceptId, entityId, name, type, source (`preset` \| `search`) |
| `Hop` | dealId, QlooHop |
| `Score` | conceptId, fitScore, method, hopIds[] |
| `Memo` | dealId, winnerConceptId, verdictA, verdictB, summary, reasons[], landlordPitch, ungrounded=false |

In-memory is enough for the hosted demo if the URL encodes `dealId` and you accept that a cold start loses it. For judges, **presets re-run**, they do not need saved history. If you add persistence, persist *our* memo + hop summaries, not raw Qloo dumps in git.

### 5.5 Scoring (deterministic)

Do this in TypeScript, not in the prompt.

```
placeAffinity  = mean(top 5 place affinities for concept signals ∩ site location)
brandOverlap   = mean(top 5 brand affinities for concept signals)
explainBoost   = mean(explainability weights from neighborhood entities, if present)
fitScore       = 100 * clamp(0.55*placeAffinity + 0.30*brandOverlap + 0.15*explainBoost)

verdict:
  >= 70  go
  45–69  caution
  < 45   no-go
```

**Do not tune weights so the intended winner wins.** Deciding the winner first and adjusting the formula until it agrees is circular, and a sharp judge will see it. Instead:

1. Pick starting weights from reasoning (place fit matters most, then brand overlap, then explainability), not from results.
2. Sanity-check on preset 1 only for bugs (null handling, scale, obviously broken output), not to force a winner.
3. **Freeze weights and tag the commit (`weights-frozen`) before running the back-test** (invariant S4).
4. Publish the formula and the frozen weights on the memo (“how we scored this”) and in `docs/BACKTEST.md`.

If `placeAffinity` is null (empty hop) and `brandOverlap` is null → no score, invariant S3.

### 5.6 LLM-only ablation (demo toggle)

A control on the deal desk: **“Write this without Qloo.”** Same address and concept names, no tools, same memo schema. The page stamps **UNGROUNDED**. Use this in the Devpost description and, if there is time, as a second column. This is the “Qloo is the product” proof.

---

### 5.7 Back-test (FitBack): does the score predict anything?

**Why.** Three presets you designed are a staged demo. A back-test checks Sitefit against things that already happened, so the claim becomes “the score predicts real outcomes,” not “we made the demo agree with us.”

**Method.**

1. **Collect 3–5 real pairs (8–10 if ahead).** Each pair: two concepts that opened on the same street or block within roughly the same period. One is still operating; the other closed within ~2 years. Sources: local news, Eater / Time Out closings coverage, Google Maps or Yelp “permanently closed” listings. Record source links for every case.
2. **Prefer the preset localities** (West Village, Williamsburg, Silver Lake) so Qloo coverage is already verified. Drop any case where Qloo returns `insufficient cultural signal` and report it as dropped, not as a hit.
3. **Blind the run.** The case file stores the outcome, but the agent only receives locality + the two concept names / comps. The outcome is compared after scoring, in code.
4. **Freeze weights first** (S4), then run every case once.
5. **Report everything:** hit rate, each case’s scores, misses, and dropped cases. Misses are fine; hiding them is not.

**Caveats to state honestly.** Small sample; survivorship and timing effects; Qloo data reflects today, not the year the business opened; closure can have non-cultural causes (rent, management, pandemic). The back-test is evidence, not proof.

**Case format** (`src/lib/backtest/cases.ts`, our own data, no Qloo payloads):

```ts
type BacktestCase = {
  id: string
  locality: string
  survivor: { label: string; anchorQueries: string[] }
  closed:   { label: string; anchorQueries: string[]; closedYear: number }
  sources: string[]          // links proving open/closed status
}
```

**Output.** `docs/BACKTEST.md` table (case, survivor score, closed score, picked correctly?, notes) + a small “Back-test: X of Y” badge on the deal desk linking to it.

### 5.7.1 Back-test cases (researched Oct 23, 2026)

Each case below is a real pair of businesses close to each other, where one is still operating and the other closed. Every claim has a source link. All links were checked on Oct 23, 2026 and load (a few store/Yelp pages block scripted fetches, which is noted). **No preset has an exact textbook match.** Where a pair only roughly matches the preset's concept contrast, the notes say so. Confidence covers both how solid the facts are and how well the pair fits the contrast.

#### West Village, NYC (natural wine / small plates vs sports bar)

| Case id | Survivor (name, address, opened, status source) | Closed (name, address, opened–closed, closure source) | Why it fits the contrast | Confidence |
|---|---|---|---|---|
| `wv-buvette-vs-windsor` | **Buvette**, 42 Grove St. Opened early 2011 (soft open late Jan 2011). Status: [ilovebuvette.com NY page](https://ilovebuvette.com/eat-drink-newyork-location) lists it as a current location. Opening: [Grub Street, Jan 2011](https://www.grubstreet.com/2011/01/buvette.html), [Eater, Feb 2011](https://ny.eater.com/2011/2/1/6699295/opening-alert) | **The Windsor**, 234 W 4th St (at W 10th St). Opened Oct 27, 2010 and closed Mar 2015, with the fixtures auctioned Apr 2015. Opening: [Grub Street, Oct 2010](https://www.grubstreet.com/2010/10/first_look_at_the_windsor_the.html), [Eater, Oct 2010](https://ny.eater.com/2010/10/27/6712899/nightlife-opening-report-the-windsor-snap-and-more). Closure: [Eater, Mar 4, 2015](https://ny.eater.com/2015/3/4/8148903/upscale-sports-bar-the-windsor-temporarily-shuts-its-doors-in-the), [Eater, Apr 23, 2015](https://ny.eater.com/2015/4/23/8478709/the-final-remains-of-posh-sports-bar-the-windsor-auctioned-off) | They opened about 3 months apart, about 3 blocks apart. Buvette is a French wine bar and small-plates "gastrothèque". The Windsor was an upscale sports bar with eight flat-screens. The Windsor lasted about 4.4 years. | **High** for the facts. Caveat: Eater links the closure partly to a partner dispute and a pending health grade, not only to fit. |
| `wv-fairfax-vs-riviera` | **Fairfax**, 234 W 4th St (the Windsor's old space, via Perla in 2016). Opened Aug 1, 2017 as an all-day café and wine bar. Status: [fairfax.nyc](https://www.fairfax.nyc/location/fairfax/) lists current hours. Opening: [Eater, Aug 2017](https://ny.eater.com/2017/8/1/16078330/fairfax-wine-bar-open-west-village-gabriel-stulman), [Grub Street, Aug 2017](https://www.grubstreet.com/2017/08/gabriel-stulman-opens-fairfax.html), [Happy Cooking timeline](https://www.happycookingnyc.com/our-story/) | **Riviera Cafe & Sports Bar**, 225 W 4th St (at 7th Ave S). Open about 48 years (c. 1969) and closed Aug 31, 2017. Closure: [Gothamist, Aug 2017](https://gothamist.com/food/riviera-cafe-will-shut-down-after-48-years-in-the-west-village), [Grub Street, Aug 2017](https://www.grubstreet.com/2017/08/nycs-rivieria-caf-and-sports-bar-will-close.html), [Eater, Mar 2018](https://ny.eater.com/2018/3/8/17097872/john-fraser-riviera-cafe-west-village). The space was still vacant in 2022: [WestView News, Jun 2022](https://westviewnews.org/2022/06/04/in-and-out-69/gcapsis/) | They sit across the street from each other. The sports bar closed the same month the wine bar opened, and the wine/small-plates concept is still there 9 years later. | **Low–medium.** It is not a fast failure (Riviera ran 48 years and gave no reason for closing). Fairfax now bills itself as an "all-day neighborhood restaurant" ("Birds, Burgers and Booze"), so the concept has drifted from a pure wine bar. Use it as a timing case, not a clean A/B. |

**Site note:** 234 W 4th St went from sports bar (The Windsor, 2010–15) to Perla (Italian, 2016–17) to wine bar (Fairfax, 2017–present). That same-address sequence makes a strong slide even outside the formal back-test.

#### Williamsburg, Brooklyn (contemporary/athleisure vs outlet/off-price)

**I could not find a real off-price or outlet store that opened and closed on the N 6th St / Bedford Ave corridor in the same period as a surviving contemporary brand.** That corridor has had almost no off-price tenants since about 2014. The only documented outlets (A.P.C. Surplus, 33 Grand St, opened 2008; Built by Wendy outlet, 46 N 6th St) don't have reliable closure dates and have no same-period survivor. Both cases below use the closest real contrast: a contemporary or athleisure brand against a mass-market or fast-fashion multi-brand store.

| Case id | Survivor (name, address, opened, status source) | Closed (name, address, opened–closed, closure source) | Why it fits the contrast | Confidence |
|---|---|---|---|---|
| `wb-madewell-vs-urban-outfitters` | **Madewell Williamsburg**. Opened Oct 29, 2014 at 127 N 6th St and is now listed at 109 N 6th St (moved along the same street; move date not verified). Status: [Madewell store page](https://www.madewell.com/store-locator/store/madewell/3024/) shows current hours (blocks curl; loads via fetch). Opening: [Brownstoner, Oct 2014](https://www.brownstoner.com/brooklyn-life/madewell-opens-in-its-williamsburg-store-wednesday/) | **Urban Outfitters ("Space Ninety 8")**, 98 N 6th St. Opened 2014 and closed Apr 21, 2024. Closure: [Brownstoner, Apr 2024](https://www.brownstoner.com/brooklyn-life/urban-outfitters-williamsburg-store-closes-98-north-6th-street/), [Brooklyn Paper](https://www.brooklynpaper.com/urban-outfitters-shutters-williamsburg-store/) | Same street, same opening year (2014). Contemporary, brand-led apparel against a mass-market mall chain. | **Medium–low.** Not off-price. UO lasted 10 years, and the closure was framed as the lease ending and rents rising. |
| `wb-lululemon-vs-aland` | **Lululemon Williamsburg**, 129 N 6th St. Opened Jul 21, 2017. Status: [lululemon store page](https://shop.lululemon.com/stores/us/brooklyn/williamsburg) (blocks curl; loads via fetch). Opening: [BKMAG, Jul 2017](https://www.bkmag.com/2017/07/19/lululemon-open-new-store-williamsburg/), [amNY](https://www.amny.com/entertainment/things-to-do/lululemon-opening-new-stores-in-midtown-williamsburg-on-july-21-1-13807896/) | **Aland (first US store / flagship)**, 92 N 6th St. Lease signed Jan 2017, opened Jul 2018, and vacated before the H&M pop-up that COS had replaced by Apr 2024. Exact closure date not verified (est. ~2023). Sources: [The Real Deal, Jan 2017](https://therealdeal.com/new-york/2017/01/12/lululemon-korean-retailer-ink-leases-on-wburgs-ascending-north-6th-st/) (both leases in one article), [Brownstoner, Nov 2019](https://www.brownstoner.com/real-estate-market/brooklyn-retail-real-estate-store-openings-williamsburg-warby-parker-everlane-madewell-mens/) (Aland opened Jul 2018), [L3 Capital](https://www.l3capital.com/property-portfolio/92-94-n-6th-st/) ("Upon Aland vacating…"), [Brownstoner, Apr 2024](https://www.brownstoner.com/brooklyn-life/urban-outfitters-williamsburg-store-closes-98-north-6th-street/) (H&M pop-up at 92 N 6th replaced by COS) | The leases were signed the same month on the same block of N 6th St. Athleisure against a Korean fast-fashion multi-brand store. | **Low.** Aland did not leave Williamsburg; it moved to a smaller store at 76 N 4th St ([alandusa.com](https://www.alandusa.com/pages/store-location)). Treat it as "flagship closed", not "business failed". The closure year is approximate. |

#### Silver Lake, LA (independent coffee/wine vs national fast-casual chain)

| Case id | Survivor (name, address, opened, status source) | Closed (name, address, opened–closed, closure source) | Why it fits the contrast | Confidence |
|---|---|---|---|---|
| `sl-seco-vs-shake-shack` | **Seco** (opened as "Barr Seco"), 3820 Sunset Blvd. Opened late Aug 2024 as a daytime café (Dayglow coffee) that becomes a natural-wine bar at night. Status: [Resy listing](https://resy.com/cities/los-angeles-ca/venues/seco-silverlake) (loads, JS-only) and [Yelp](https://www.yelp.com/biz/seco-los-angeles) (search index shows "Updated October 2026"; direct fetch blocked). Opening: [Eater LA, Sep 4, 2024](https://la.eater.com/2024/9/4/24236191/barr-seco-silver-lake-wine-bar-restaurant-los-angeles) | **Shake Shack Silver Lake**, 3903 W Sunset Blvd (at Hyperion, Sunset Junction). Opened Nov 2022 and closed by Sep 25, 2024 (about 22 months). Opening: [The Eastsider, Nov 2022](https://www.theeastsiderla.com/eastsider_on_the_go/restaurants_and_bars/35-japanese-breakfast-take-home-turkey-dinners-shake-shack-silver-lake-opens/article_ed30198c-65d8-11ed-ba20-372574037cf6.html), [What Now LA](https://whatnow.com/los-angeles/restaurants/shake-shack-opening-in-silver-lake-by-end-of-the-year/). Closure: [ABC7, Aug 30, 2024](https://abc7.com/post/shake-shack-closing-9-underperforming-locations-including-5-los-angeles/15244525/) ("underperforming"), and the Eater LA piece above notes the "recent departure of Shake Shack" | Same Sunset Junction stretch, about one block apart. This is the closest exact match to the preset: an independent coffee + natural-wine hybrid against a national fast-casual chain that closed in under 2 years. | **Medium.** The facts are solid. But Seco opened as Shake Shack was leaving, so their open periods overlap by only weeks. 3903 Sunset had also housed earlier short-lived tenants (California Sun, Mixed Company), which suggests a weak site. Counter-evidence: Sweetgreen (a national chain) is still open at 3925 Sunset on the same block ([sweetgreen.com](https://www.sweetgreen.com/locations/silver-lake/)). |
| `sl-bandini-vs-starbucks-mohawk` | **Bar Bandini**, 2150 W Sunset Blvd. Opened Oct 2015 as a natural wine + craft beer bar. Status: [barbandini.com](https://www.barbandini.com/) lists current hours. Opening: [Eater LA, Oct 2015](https://la.eater.com/2015/10/8/9481661/bandini-wine-bar-in-echo-park) | **Starbucks "Sunset Blvd & Mohawk"**, 2134 W Sunset Blvd. Opened Mar 16, 2018 and closed Sep 27, 2025. Sources: [starbuckseverywhere.net closure list](https://www.starbuckseverywhere.net/StarbucksPossibleClosures_Sep2025.htm) (fan tracker that shows both dates), [FOX 11 LA closure list](https://www.foxla.com/news/starbucks-list-store-closures-california) | The same block of Sunset, a few doors apart. An independent natural-wine bar outlasted a national coffee chain. | **Medium–low.** It is in **Echo Park** (next to Silver Lake, but not Silver Lake), so either run it with `locality: "Echo Park"` or drop it if Qloo is thin there. Starbucks is a national coffee chain, not fast-casual, and its closure was part of a company-wide wave of closures. The opening date comes from a fan tracker. |

**A counter-intuitive Silver Lake case is available, but the pair isn't complete.** **The Ruby Fruit** (3510 Sunset Blvd) was an independent natural-wine bar that opened Feb 21, 2023 ([Eater LA](https://la.eater.com/2023/2/23/23612144/ruby-fruit-natural-wine-bar-lesbian-woman-owned-eszett-employees-silver-lake-los-angeles)) and closed Dec 2025 ([NHM LA](https://nhm.org/stories/ruby-fruit)). Meanwhile, chain Sweetgreen at 3925 Sunset is still open, but I didn't verify its opening date. If you verify it, this makes the honest "taste concept loses" case. West Village has a similar survivor: **Wogies** (39 Greenwich Ave, sports bar, open since 2004; still listed in an [Inquirer piece, Oct 2024](https://www.inquirer.com/food/restaurants/cheesesteaks-new-york-city-best-sandwiches-20241007.html), current status not re-checked), but I found no same-period wine bar near it with a clean closure. Vin Sur Vingt at 201 W 11th St closed when its lease expired and then reopened next door ([Forbes, Jul 2024](https://www.forbes.com/sites/garystern/2024/07/22/vin-sur-vingt-bringing-a-little-of-paris-to-nyc-and-beyond/)), so it doesn't count.

#### `src/lib/backtest/cases.ts`

```ts
// Back-test cases researched Oct 23, 2026. Our own data; no Qloo payloads.
// Outcome fields are for scoring AFTER the blind run; never pass them to the agent.
export type BacktestCase = {
  id: string
  locality: string
  survivor: { label: string; anchorQueries: string[] }
  closed:   { label: string; anchorQueries: string[]; closedYear: number }
  sources: string[]          // links proving open/closed status
}

export const BACKTEST_CASES: BacktestCase[] = [
  {
    id: "wv-buvette-vs-windsor",
    locality: "West Village",
    survivor: { label: "Buvette (wine bar / small plates, 42 Grove St, opened 2011)", anchorQueries: ["Buvette"] },
    closed:   { label: "The Windsor (upscale sports bar, 234 W 4th St, 2010–2015)", anchorQueries: ["The Windsor"], closedYear: 2015 },
    sources: [
      "https://ilovebuvette.com/eat-drink-newyork-location",
      "https://www.grubstreet.com/2011/01/buvette.html",
      "https://ny.eater.com/2011/2/1/6699295/opening-alert",
      "https://www.grubstreet.com/2010/10/first_look_at_the_windsor_the.html",
      "https://ny.eater.com/2010/10/27/6712899/nightlife-opening-report-the-windsor-snap-and-more",
      "https://ny.eater.com/2015/3/4/8148903/upscale-sports-bar-the-windsor-temporarily-shuts-its-doors-in-the",
      "https://ny.eater.com/2015/4/23/8478709/the-final-remains-of-posh-sports-bar-the-windsor-auctioned-off",
    ],
  },
  {
    id: "wv-fairfax-vs-riviera",
    locality: "West Village",
    survivor: { label: "Fairfax (all-day café / wine bar, 234 W 4th St, opened 2017)", anchorQueries: ["Fairfax"] },
    closed:   { label: "Riviera Cafe & Sports Bar (225 W 4th St, c.1969–2017)", anchorQueries: ["Riviera Cafe"], closedYear: 2017 },
    sources: [
      "https://www.fairfax.nyc/location/fairfax/",
      "https://ny.eater.com/2017/8/1/16078330/fairfax-wine-bar-open-west-village-gabriel-stulman",
      "https://www.grubstreet.com/2017/08/gabriel-stulman-opens-fairfax.html",
      "https://www.happycookingnyc.com/our-story/",
      "https://gothamist.com/food/riviera-cafe-will-shut-down-after-48-years-in-the-west-village",
      "https://www.grubstreet.com/2017/08/nycs-rivieria-caf-and-sports-bar-will-close.html",
      "https://ny.eater.com/2018/3/8/17097872/john-fraser-riviera-cafe-west-village",
      "https://westviewnews.org/2022/06/04/in-and-out-69/gcapsis/",
    ],
  },
  {
    id: "wb-madewell-vs-urban-outfitters",
    locality: "Williamsburg",
    survivor: { label: "Madewell Williamsburg (contemporary apparel, N 6th St, opened 2014)", anchorQueries: ["Madewell"] },
    closed:   { label: "Urban Outfitters / Space Ninety 8 (98 N 6th St, 2014–2024)", anchorQueries: ["Urban Outfitters"], closedYear: 2024 },
    sources: [
      "https://www.madewell.com/store-locator/store/madewell/3024/",
      "https://www.brownstoner.com/brooklyn-life/madewell-opens-in-its-williamsburg-store-wednesday/",
      "https://www.brownstoner.com/brooklyn-life/urban-outfitters-williamsburg-store-closes-98-north-6th-street/",
      "https://www.brooklynpaper.com/urban-outfitters-shutters-williamsburg-store/",
    ],
  },
  {
    id: "wb-lululemon-vs-aland",
    locality: "Williamsburg",
    survivor: { label: "Lululemon Williamsburg (athleisure, 129 N 6th St, opened 2017)", anchorQueries: ["Lululemon"] },
    // closedYear is approximate: Aland vacated 92 N 6th before the H&M pop-up,
    // which had already been replaced by COS by Apr 2024. Brand relocated to 76 N 4th St.
    closed:   { label: "Aland flagship (Korean fast-fashion multi-brand, 92 N 6th St, 2018–c.2023)", anchorQueries: ["Aland"], closedYear: 2023 },
    sources: [
      "https://shop.lululemon.com/stores/us/brooklyn/williamsburg",
      "https://www.bkmag.com/2017/07/19/lululemon-open-new-store-williamsburg/",
      "https://www.amny.com/entertainment/things-to-do/lululemon-opening-new-stores-in-midtown-williamsburg-on-july-21-1-13807896/",
      "https://therealdeal.com/new-york/2017/01/12/lululemon-korean-retailer-ink-leases-on-wburgs-ascending-north-6th-st/",
      "https://www.brownstoner.com/real-estate-market/brooklyn-retail-real-estate-store-openings-williamsburg-warby-parker-everlane-madewell-mens/",
      "https://www.l3capital.com/property-portfolio/92-94-n-6th-st/",
      "https://www.brownstoner.com/brooklyn-life/urban-outfitters-williamsburg-store-closes-98-north-6th-street/",
      "https://www.alandusa.com/pages/store-location",
    ],
  },
  {
    id: "sl-seco-vs-shake-shack",
    locality: "Silver Lake",
    survivor: { label: "Seco / Barr Seco (café by day, natural wine bar by night, 3820 Sunset Blvd, opened 2024)", anchorQueries: ["Seco", "Barr Seco"] },
    closed:   { label: "Shake Shack Silver Lake (3903 W Sunset Blvd, 2022–2024)", anchorQueries: ["Shake Shack"], closedYear: 2024 },
    sources: [
      "https://la.eater.com/2024/9/4/24236191/barr-seco-silver-lake-wine-bar-restaurant-los-angeles",
      "https://resy.com/cities/los-angeles-ca/venues/seco-silverlake",
      "https://www.yelp.com/biz/seco-los-angeles",
      "https://www.theeastsiderla.com/eastsider_on_the_go/restaurants_and_bars/35-japanese-breakfast-take-home-turkey-dinners-shake-shack-silver-lake-opens/article_ed30198c-65d8-11ed-ba20-372574037cf6.html",
      "https://whatnow.com/los-angeles/restaurants/shake-shack-opening-in-silver-lake-by-end-of-the-year/",
      "https://abc7.com/post/shake-shack-closing-9-underperforming-locations-including-5-los-angeles/15244525/",
    ],
  },
  {
    id: "sl-bandini-vs-starbucks-mohawk",
    locality: "Echo Park", // adjacent to Silver Lake; drop if Qloo signal is thin
    survivor: { label: "Bar Bandini (natural wine + craft beer, 2150 W Sunset Blvd, opened 2015)", anchorQueries: ["Bar Bandini"] },
    closed:   { label: "Starbucks Sunset Blvd & Mohawk (2134 W Sunset Blvd, 2018–2025)", anchorQueries: ["Starbucks"], closedYear: 2025 },
    sources: [
      "https://www.barbandini.com/",
      "https://la.eater.com/2015/10/8/9481661/bandini-wine-bar-in-echo-park",
      "https://www.starbuckseverywhere.net/StarbucksPossibleClosures_Sep2025.htm",
      "https://www.foxla.com/news/starbucks-list-store-closures-california",
    ],
  },
]
```

**Caveats:** Re-check every survivor's "still operating" status, and every closure, right before you submit on Devpost, because businesses open and close fast. The Ruby Fruit, a 2023 Silver Lake survivor candidate, turned out to have closed in Dec 2025. Six cases is a tiny sample. Several closures have non-cultural causes: a partner dispute (The Windsor), lease expiry (Urban Outfitters), a company-wide closure wave (Starbucks, Shake Shack), and a relocation (Aland). Qloo data reflects today, not the year each business opened. For brand-name anchors (Shake Shack, Starbucks, Lululemon, Urban Outfitters), Qloo `/search` will resolve the brand, not the specific closed location, so score them as "concept at this locality". Report the hit rate with every miss and every dropped case.

---

## 6. Repo layout

```
sitefit/
  BUILD-PLAN.md
  README.md                 ← judge-facing: what it is, how to run, presets
  LICENSE                   ← MIT
  .gitignore
  .env.example              ← QLOO_API_KEY, QLOO_BASE_URL, OPENAI_API_KEY (or other)
  package.json
  next.config.ts
  tsconfig.json
  src/
    app/
      page.tsx              ← deal desk
      deals/[id]/page.tsx   ← run + memo
      api/
        deals/route.ts
        deals/[id]/route.ts
        deals/[id]/run/route.ts
    components/
      ui/                   ← shadcn/ui primitives only
      DealDesk.tsx
      PresetCard.tsx
      AgentTrace.tsx
      MemoView.tsx
      EvidenceDrawer.tsx
      AblationBanner.tsx
    lib/
      qloo/
        client.ts           ← GET helper, headers, errors
        search.ts
        tags.ts
        insights.ts
        normalize.ts
      agent/
        tools.ts
        runDeal.ts          ← forced loop
        prompts.ts
        memoSchema.ts       ← zod
      scoring.ts
      backtest/
        cases.ts            ← real opened-vs-closed pairs + source links
        runBacktest.ts      ← blind run, compares outcomes after scoring
      store.ts              ← in-memory deals
      presets.ts            ← the three deals + stored entity IDs
    types/
      deal.ts
      qloo.ts
  fixtures/
    hops/                   ← sanitized, hand-authored hop shapes for offline tests
                              (invented IDs/scores; NOT live Qloo dumps)
  docs/
    QLOO_CONSTRAINTS.md     ← host, GET-only, no /recs, empty-200, no public cache
    FITBENCH.md             ← ablation notes
    BACKTEST.md             ← frozen weights, method, results, misses
    DEMO.md                 ← two-minute script
```

shadcn/ui is the only component library. Primitives stay in `src/components/ui`. Do not add a second design-system folder or a second component library.

---

## 7. Stack lock

| Piece | Choice | Why |
|-------|--------|-----|
| App | Next.js (App Router) + TypeScript | Matches other projects in this workspace; one deploy to Vercel |
| UI | **Tailwind CSS + shadcn/ui only** | Every screen, component, and state. No other CSS system and no other component library. The memo look comes from the theme, not from a second kit |
| Agent | Vercel AI SDK `generateText` + tools | Counts as an agent framework; easy trace |
| Model | Whatever you already have a key for (OpenAI / Anthropic) | Used only to write the memo and optionally pick tool args |
| Qloo | Raw `fetch` client | No SDK required; hackathon host + GET semantics are easy to get wrong inside a wrapper |
| Validation | zod | Memo + hop envelopes |
| Hosting | Vercel | Public HTTPS demo |
| License | MIT | Devpost requirement |

**Do not** put the Qloo key in `NEXT_PUBLIC_*`.

---

## 8. Step-by-step build (phases, compressed to Oct 23–30, solo)

Same phases and gates as the original plan, re-dated for a 7-day build. Phases 2 and 3 overlap: build both against fixtures until the Qloo key lands.

**Phase review, required.** After each phase, before starting the next one, review the work and write the status into this file under that phase. Walk every task row. For each task state **done**, **partial**, or **not done**, restate its acceptance criterion, and give evidence: the file path, the command and its result, or what you saw in the running app. Then state the phase gate as **met** or **not met**, and list what is still open. Replace the previous status block for that phase. Do not mark a task done from this plan alone. Check the files. For UI, check the running app. A partial task stays partial until the criterion is met. The chat summary is a copy of the block written here. Every phase keeps a status block, including phases that have not started.

### Phase 0 — Unblock (Fri Oct 23)

| # | Task | Acceptance criteria |
|---|------|---------------------|
| 0.1 | **Request Qloo hackathon API key first thing** | Form submitted; keys take a few business days, so this is the biggest schedule risk. Project idea: “Site-fit agent that writes cultural go/no-go lease memos from Qloo Insights (place + brand + locality).” |
| 0.2 | Join Discord `#api-help` | Bookmarked. Use it when empty-200 hits, or if the key hasn’t arrived by Mon Oct 26 |
| 0.3 | Scaffold `sitefit/` Next.js app (TypeScript, Tailwind, ESLint, `src/`) + initialize shadcn/ui + MIT `LICENSE` + `.env.example` + `.gitignore` | `npm run dev` serves a placeholder. `src/components/ui` exists. Tailwind and shadcn/ui are the only UI stack (§7) |
| 0.4 | Write `docs/QLOO_CONSTRAINTS.md` from §3 | README links it |
| 0.5 | Confirm model API key exists | Memo writer can run offline on fixture hops |

**Do not wait on the Qloo key to start Phase 1 UI or Phase 2 fixtures.**

**Status (reviewed Oct 24, 2026). Gate: not met.**

| # | Status | Evidence |
|---|--------|----------|
| 0.1 | **Done** | `QLOO_API_KEY` is set in `.env.local`. `npm run qloo:smoke` runs `mode=live` and returns West Village places. |
| 0.2 | **Not done** | Discord `#api-help` has not been joined from this project. |
| 0.3 | **Done** | Next.js app, Tailwind, shadcn/ui (`src/components/ui`), `LICENSE`, `.env.example`, `.gitignore` are in this folder. |
| 0.4 | **Done** | `docs/QLOO_CONSTRAINTS.md` exists. `README.md` links it. |
| 0.5 | **Done** | `QWEN_CLOUD_API_KEY`, `QWEN_CLOUD_BASE_URL`, and `QWEN_MODEL` are set. Qwen wrote the West Village memo. |

Still open: join Discord `#api-help`.

### Phase 1 — Deal desk + memo UI on fixtures (Sat Oct 24)

| # | Task | Acceptance criteria |
|---|------|---------------------|
| 1.1 | Deal desk with three preset cards | Clicking a card creates a deal and routes to `/deals/:id` |
| 1.2 | Memo layout: two columns, verdict chips, landlord pitch | Readable at 1280px; looks like a memo, not a chat |
| 1.3 | Agent trace component | Renders a hardcoded list of hops (purpose, count, duration) |
| 1.4 | Evidence drawer | Lists fixture entities with fake affinities |
| 1.5 | Ablation banner component | Hidden unless `ungrounded=true` |
| 1.6 | Back-test cases into `src/lib/backtest/cases.ts` | The 6 researched pairs from §5.7.1 are in code with source links; outcome fields never passed to the agent |

**UI rule for this phase.** Deal desk, run, memo, evidence, and the ablation banner are Tailwind + shadcn/ui only. Read the Stitch HTML for layout and copy, then rebuild it. Do not ship the Stitch page as the app.

**Gate:** a teammate (or you tomorrow) can explain the screen in 30 seconds without reading this file.

**Status (reviewed Oct 23, 2026). Gate: met.**

| # | Status | Evidence |
|---|--------|----------|
| 1.1 | **Done** | Three preset cards on `/`. Opening West Village runs `openDeal` and routes to `/deals/:id`. |
| 1.2 | **Done** | Memo shows two columns, GO / NO-GO chips, cited reasons, and the landlord paragraph. |
| 1.3 | **Done** | Trace lists seven fixture hops with purpose, entity count, and duration. |
| 1.4 | **Done** | Evidence drawer lists fixture entities and affinities, including a film. The page labels them as fixtures. |
| 1.5 | **Done** | Grounded memo has no banner. “Write this without Qloo” produces an UNGROUNDED note with no affinities. |
| 1.6 | **Done** | `src/lib/backtest/cases.ts` has the six §5.7.1 pairs and source links. `toAgentInput` omits `closedYear` and `sources`. No screen imports the cases. |

Still open for later phases: scores are fixtures, not live Qloo. Deals live in process memory. Case labels still contain years such as “2010–2015”; a blind run must not send those strings.

### Phase 2 — Qloo client + first live hop (Sun–Mon Oct 25–26 on fixtures; live the day the key lands)

The client, smoke script, and fixture playback are in the repo. Live search and Insights now run when `QLOO_API_KEY` is set. Seco still has no exact-name id.

| # | Task | Acceptance criteria | Status |
|---|------|---------------------|--------|
| 2.1 | `lib/qloo/client.ts` | GET, `X-Api-Key`, base URL from env, typed errors for 401/403/400 | **Done** |
| 2.2 | `search.ts` | Resolves “Via Carota” to a place id on the hackathon host | **Done** |
| 2.3 | `insights.ts` | `filter.type=urn:entity:place&filter.location.query=West%20Village&take=8` returns entities | **Done** |
| 2.4 | Script: `npx tsx src/lib/qloo/smoke.ts` | Prints names + affinities; no key leaked | **Done** |
| 2.5 | Fill `presets.ts` with **live** entity IDs for the three deals | Each preset has ≥2 anchors per concept that search-resolve | **Partial** — West Village and Williamsburg resolve. Seco does not. |

If West Village is empty, try `Greenwich Village`, `Lower East Side`, `Williamsburg` before changing the story.

**Gate:** one successful live Insights call committed as a smoke script, not as a cached payload.

**Status (reviewed Oct 24, 2026). Gate: met.**

| # | Status | Evidence |
|---|--------|----------|
| 2.1 | **Done** | `src/lib/qloo/client.ts` sends GET with `X-Api-Key`, allows only `https://hackathon.api.qloo.com`, and `errorForStatus` types 400, 401, and 403. Logs omit the key. |
| 2.2 | **Done** | `npm run qloo:smoke` resolves “Via Carota” to `3F659C60-D199-4E55-9B72-62DEEFB6AA11` on the hackathon host. |
| 2.3 | **Done** | The same run returns eight West Village places. A location-only list has no affinity. Scoring calls use `signal.interests.entities`, which do. |
| 2.4 | **Done** | `npm run qloo:smoke` prints names and ids. The output has no key. Quota on that run: 50,000 per month, 10 per second. |
| 2.5 | **Partial** | West Village and Williamsburg anchors store the live ids from exact-name search. `Seco` and `Barr Seco` do not exact-match. |

Still open: an exact-name entity for Seco. That card is off the desk until one exists.

### Phase 3 — Scoring + neighborhood taste (Sun–Mon Oct 25–26)

| # | Task | Acceptance criteria | Status |
|---|------|---------------------|--------|
| 3.1 | `neighborhoodTaste` hops (places + brands + artists) | At least two types return data on preset 1 | **Done** |
| 3.2 | `scoreConcept` in code | Deterministic scores from weights chosen by reasoning (§5.5), **not** tuned so the wine bar wins. Sanity-check preset 1 for bugs only | **Done** — 76 vs 22, weights unchanged |
| 3.3 | `feature.explainability=true` parsed into hop.entities[].explain | Memo can say “driven by Via Carota (0.xx)” | **Done** |
| 3.4 | Empty-hop path | Forced empty fixture → `insufficient cultural signal`, no verdict | **Done** |
| 3.5 | FitBench table in `docs/FITBENCH.md` | Treatment vs LLM-only on preset 1, even if qualitative | **Done** |
| 3.6 | `src/lib/backtest/runBacktest.ts` | Runs blind over `cases.ts` on fixture hops end to end; compares outcome only after scoring | **Done** — fixture playback; four cases drop |

**Gate:** preset 1 produces two scores and a winner with Qloo unplugged in a unit test of `scoring.ts` (feed hops, no network), and `runBacktest.ts` completes on fixtures.

**Status (reviewed Oct 23, 2026). Gate: met.**

| # | Status | Evidence |
|---|--------|----------|
| 3.1 | **Done** | `neighborhoodTaste` in `src/lib/taste.ts` requests place, brand, and artist. Fixture playback for West Village returns places and brands. `npm run test:score` asserts both. |
| 3.2 | **Done** | `src/lib/scoring.ts` uses weights 0.55 / 0.30 / 0.15. Preset 1 scores 76 and 22 with no network. Winner is natural wine / small plates. Weights were not changed to chase the old fixture 82. |
| 3.3 | **Done** | `feature.explainability=true` is parsed in `normalize.ts` and copied onto hop entities. The West Village memo says “driven by Via Carota (0.64)”. |
| 3.4 | **Done** | An empty score hop returns no score and no verdict. A custom deal with no affinities shows “Insufficient cultural signal.” |
| 3.5 | **Done** | `docs/FITBENCH.md` compares the fixture treatment with the ungrounded desk copy on preset 1. |
| 3.6 | **Done** | `npm run test:score` runs `src/lib/backtest/runBacktest.ts` on fixture playback. Six cases finish. Two score. Four drop because the catalog has no anchor. Outcome is compared only after scoring. |

Still open: the `weights-frozen` tag needs a commit. The live back-test is in `docs/BACKTEST.md`. The fixture table remains a pipeline check.

### Phase 4 — Agent loop + live run (Sun Oct 25 – Wed Oct 28; live runs Tue–Wed)

| # | Task | Acceptance criteria | Status |
|---|------|---------------------|--------|
| 4.1 | `runDeal.ts` executes §5.2 in order | Trace on screen matches actual tool calls | **Done** — live West Village run, 11 calls |
| 4.2 | Memo writer + zod | Invalid model output retries once, then uses a template memo that still cites scores | **Done** — Qwen wrote West Village; a rejected draft uses the template |
| 4.3 | `POST /api/deals/:id/run` | Idempotent enough: second click does not double-bill Qloo if a memo exists (or clearly “re-run”) | **Done** |
| 4.4 | Custom deal path (stretch-if-easy) | Search box → resolve → same loop; failure is honest | **Done** |
| 4.5 | LLM-only toggle | Produces a stamped ungrounded memo | **Done** — the model writes the note; Qloo is not called |
| 4.6 | **Freeze weights, tag `weights-frozen`, run the back-test live** | `docs/BACKTEST.md` reports hit rate, every miss, and dropped cases (invariant S4). No weight changes afterwards | **Partial** — live table written. Weights unchanged. The git tag needs a commit. |

**Gate:** a cold visitor on the hosted preview can click preset 1 and get a memo without you on the call.

**Status (reviewed Oct 23, 2026). Gate: not met.**

| # | Status | Evidence |
|---|--------|----------|
| 4.1 | **Done** | `src/lib/agent/runDeal.ts` calls site places, concept search, brand taste, artist taste, then each concept’s place and brand score. `npm run test:score` checks that order and a budget of 12. The West Village trace on the deal page lists those calls. |
| 4.2 | **Done** | `src/lib/agent/memoSchema.ts` is the zod contract. Qwen wrote the West Village memo. Williamsburg’s draft did not agree, so the template cited 87 and 58. A bad payload still retries once. |
| 4.3 | **Done** | `POST /api/deals/:id/run` returns the saved memo on a second call. `Re-run` sends `{ rerun: true }`. The unit test throws if the second call touches search or insights. |
| 4.4 | **Done** | A custom pair is searched and run through the same loop. “Unknown room” against “Other room” in Nowhere returns insufficient cultural signal and no verdict. |
| 4.5 | **Done** | “Write this without Qloo” calls the model with the neighborhood and the two names, stamps UNGROUNDED, and cites no affinity. It does not call Qloo. |
| 4.6 | **Partial** | Live back-test on October 24, 2026: 3 of 3 scored cases picked the survivor, 3 dropped, no misses among the scored cases. Weights stayed 0.55 / 0.30 / 0.15. Recorded in `docs/BACKTEST.md`. The `weights-frozen` tag needs a commit. |

Still open: a hosted preview and the git tag. A local preset click now calls the hackathon host.

### Phase 5 — Host, polish, submit (Deploy Wed Oct 28 · polish Thu Oct 29 · submit Fri Oct 30)

| # | Task | Acceptance criteria | Status |
|---|------|---------------------|--------|
| 5.1 | Deploy to Vercel (Wed Oct 28) | HTTPS URL works in a private window | **Not done** — no deploy in this pass |
| 5.2 | README: presets, env, “what Qloo is doing,” constraints, back-test result | Judge can run locally if they have keys | **Done** |
| 5.3 | `docs/DEMO.md` two-minute script | You can perform it without improvising | **Done** |
| 5.4 | OSS license visible; repo public | Devpost fields filled | **Partial** — MIT `LICENSE` is in the repo. No public git remote. Devpost fields are empty. |
| 5.5 | Devpost text: buyer, why Qloo is load-bearing, FitBench | See §11 | **Partial** — draft is in `docs/DEVPOST.md`. It is not pasted into Devpost. |
| 5.6 | Presets 2 and 3 live (only if ahead) | Preset 1 is the must-ship; hide any preset that’s flaky | **Partial** — Williamsburg is live (87 GO vs 58 CAUTION). Silver Lake is off the desk. |
| 5.7 | Rate-limit / quota check | If thin, post in `#api-help` right away | **Done** — 50,000/month, about 49,700 left, 10/second. Not thin. |
| 5.8 | Re-verify back-test statuses | Every survivor still open, every closure still accurate (§5.7.1 caveats) | **Done** — October 23, 2026 check recorded in `docs/BACKTEST.md`. No status change. |
| 5.9 | Devpost submit (Fri Oct 30) | Submitted early, well before 11:45pm EDT. No new features this day | **Not done** |

**Cut order if behind:** custom deals → presets 2–3 → counter-intuitive preset → artist/film hop → ablation UI (keep the server path) → back-test grows beyond 3 cases → pretty type → persistence. **Do not cut:** preset 1 live, the frozen-weights back-test (even 3 cases), hosted demo, license.

**Status (reviewed Oct 24, 2026). Gate: not met.**

| # | Status | Evidence |
|---|--------|----------|
| 5.1 | **Not done** | No hosted URL. The app runs locally. |
| 5.2 | **Done** | `README.md` lists the live preset scores, the Qwen env vars, what each Qloo step does, the constraints link, and the live back-test. |
| 5.3 | **Done** | `docs/DEMO.md` reads West Village 90 vs 86 and the live back-test as 3 of 3 scored, 3 dropped. |
| 5.4 | **Partial** | MIT `LICENSE` is in the repo. The folder is not a git repository, so it is not public. Devpost fields are not filled. |
| 5.5 | **Partial** | `docs/DEVPOST.md` covers the buyer, why Qloo is load-bearing, and the live FitBench result. It has not been pasted into Devpost. |
| 5.6 | **Partial** | Williamsburg completed live: 87 GO vs 58 CAUTION. Silver Lake is hidden because Seco does not resolve. |
| 5.7 | **Done** | Response headers: `x-month-ratelimit-limit` 50000, remaining about 49700, `x-second-ratelimit-limit` 10. Not thin, so no `#api-help` post. |
| 5.8 | **Done** | October 23, 2026 open/closed check is unchanged in `docs/BACKTEST.md`. |
| 5.9 | **Not done** | Not submitted. Deadline is Friday, October 30, 2026. |

Still open: deploy, a public repo, the Devpost form, and the Friday submit.

---

---

## 9. Prompt and schema (memo writer)

The model is a clerk. Give it numbers. Take a document.

```ts
// memoSchema.ts — keep this the contract
{
  winnerConceptId: string
  summary: string                    // ≤ 80 words, must mention both scores
  concepts: [{
    conceptId: string
    verdict: "go" | "caution" | "no-go"
    headline: string                 // ≤ 20 words
    reasons: [{
      text: string                   // must include a number or entity name from hops
      hopId: string
      entityName: string
      affinity: number
    }]                               // 2–4
  }]
  landlordPitch: string              // ≤ 120 words, forwardable
  risks: string[]                    // 0–3, only if supported by hops
}
```

System rules (put in `prompts.ts`):

- Use only names and numbers present in the JSON.
- If you want to say “this block loves X” you must have an entity named X in a hop.
- Do not mention census, foot traffic, income, or crime.
- Do not mention Qloo internals (URNs) in the landlord pitch; URNs stay in the evidence drawer.
- If a concept has no score, say so. Do not pick a winner.

---

## 10. Demo script (two minutes)

Judges are not required to watch a video. They will **use the app**. This script is for you when you walk someone through it, and for the Devpost description.

**0:00 — Desk.**  
“This is a lease memo, not a recommendation chatbot. Someone is about to rent a shop.”

**0:15 — Preset.**  
Click West Village. “Natural wine versus a sports bar, same corner.”

**0:25 — Trace.**  
Point at hops: nearby places, brands, artists, then each concept scored against that fingerprint.

**0:50 — Memo.**  
Wine bar is go, sports bar is no-go. Read one cited sentence out loud. Open evidence. “That number is Qloo affinity, not the model.”

**1:10 — Back-test.**  
“We froze the scoring formula, then ran it on real streets where one place survived and one closed. It picked the survivor in X of Y. Here are the misses too.”

**1:25 — Ablation.**  
Toggle “without Qloo.” Show fluent nonsense vs cited memo. “Unplug the graph and you are guessing again.”

**1:45 — Buyer.**  
“The person who pays already buys Placer. We answer cultural fit. Brokers need this tonight; brands and landlords buy it next.”

**1:55 — Stop.**  
Do not keep talking.

---

## 11. Submission (Devpost)

Required:

1. Link to a **functional hosted demo** (Vercel).
2. Public GitHub / GitLab / Bitbucket with all source and run instructions.
3. Text description: what the agent does and what is Qloo-powered.
4. Externally published — no localhost, no private login.
5. Open-source license file in the repo.

Video is **not** required. Do not spend Phase 5 on a film if the live demo is weak.

**Description outline**

- One sentence: lease memos from cultural fit.
- Who pays and what a wrong site costs.
- The loop: resolve, neighborhood taste, score in code, write with citations.
- Why it dies without Qloo (ablation).
- Back-test: weights frozen first, real opened-vs-closed pairs, hit rate and misses reported.
- Honest limits: hackathon coverage, no foot traffic, three trusted presets.

---

## 12. Risk register

| Risk | Trigger | Mitigation | Cut line |
|------|---------|------------|----------|
| API key delayed | No email by Oct 17 | Fixtures + UI; resubmit form; Discord | Ship UI + smoke the day the key lands |
| Empty Insights on a locality | 200 + `entities: []` | Try alternate locality names; drop heatmap; widen radius / drop radius=0 | Replace preset locality |
| 403 on heatmap or a type | Unsupported type | Skip that hop; keep place + brand | Artists/films optional |
| Silent bad params | Empty results | Log param set; compare to Entity Type Parameter Guide | Fewer params, known-good only |
| GET-only vs POST query helpers | Resolve-by-name fails | `/search` first, then IDs on GET | Never depend on POST |
| Model invents reasons | Fluent memo | Zod + hopId required; reject unsourced reasons | Template memo from scores |
| Looks like Qloo’s Clarion deck | Dashboard of affinities | Product is the **memo + verdict**, not the map | No map unless heatmap works *and* time remains |
| Quota | 429 / monthly cap | Cache hops in process; Discord raise; presets only | Disable custom deals |
| Judge wanders | Custom search empty | Presets above the fold; custom below | Hide custom |
| “Not a company” | Consumer UI | Copy and memo language stay B2B | No “discover the city” |
| Scores look rigged | Judge asks “did you tune it to win?” | Weights frozen + tagged before back-test; publish misses | Even 3 back-test cases beats none |
| Back-test cases thin on Qloo | `insufficient cultural signal` on a pair | Use preset localities; report dropped cases | Ship with fewer cases, stated honestly |
| 7-day solo timeline | Key late or loop slips | Fixtures first; one preset only | Cut order in §8 |

---

## 13. Calendar (compressed)

| Dates | Focus |
|-------|--------|
| Fri Oct 23 | Request Qloo key, scaffold, constraints doc |
| Sat Oct 24 | Deal desk + memo UI on fixtures; start collecting back-test pairs |
| Sun–Mon Oct 25–26 | Qloo client, scoring, agent loop, back-test runner, all on fixtures |
| Tue–Wed Oct 27–28 | Live Qloo on preset 1, freeze weights, run back-test, ablation toggle, deploy |
| Thu Oct 29 | README, DEMO.md, public repo, cold-visitor pass; extra presets only if ahead |
| Fri Oct 30 | Devpost submit early, before 11:45pm EDT. No new features |

---

## 14. Definition of done

1. A stranger can open the hosted URL, click **West Village**, and get a two-concept memo with cited affinities.  
2. Unplugging Qloo either blocks the verdict or produces a stamped ungrounded ablation.  
3. `scoring.ts` unit tests pass on fixture hops (empty hops give no score; scores are deterministic).  
4. Back-test run with weights frozen first; `docs/BACKTEST.md` reports hit rate, misses, and dropped cases.  
5. README + `docs/QLOO_CONSTRAINTS.md` + MIT license + public repo.  
6. Devpost submitted with demo URL, repo URL, and a description that names the buyer.

---

## 15. First commands (when you start building)

```bash
cd sitefit
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
npx shadcn@latest init
# add LICENSE, .env.example, docs/
```

UI from this point is Tailwind CSS and shadcn/ui only. See §7.

`.env.example`:

```
QLOO_API_KEY=
QLOO_BASE_URL=https://hackathon.api.qloo.com
# model key for memo writer — pick one
OPENAI_API_KEY=
```

Request the Qloo key before writing more code:  
https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide#getting-your-api-key
