# Sitefit

Lease memos from cultural fit. One address, two concepts, a go or no-go, and every claim cited from a Qloo hop.

The buyer is a broker or landlord who is about to sign a retail lease. A wrong concept on the wrong corner is a lost tenant. Sitefit does not estimate foot traffic, census, income, or crime.

## Presets

Open one card on the deal desk. The trace is the calls from that run. The memo quotes those affinities.

| Preset | Comparison | Live result, Oct 24, 2026 |
|---|---|---|
| West Village | Natural wine / small plates vs a sports bar | 90 GO vs 86 GO. Wine leads. |
| Williamsburg | Contemporary apparel vs off-price | 87 GO vs 58 CAUTION |

Silver Lake is off the desk. `Seco` and `Barr Seco` have no exact-name place on the hackathon host, so that card cannot score the wine concept. The locality string sent for Los Angeles is `Silver Lake, Los Angeles`. Bare `Silver Lake` resolves to a different town.

Preset 1 is the demo. The memo writer quotes the hops. If the draft does not, the template memo still cites the scores. Williamsburg’s last run used the template.

“Write this without Qloo” asks the model for a note from the names alone, stamps it UNGROUNDED, and cites nothing. A custom pair that does not resolve shows “Insufficient cultural signal” and no verdict.

## What Qloo is doing

The server calls Qloo. The browser never sees the key. Each grounded run, in order:

1. Insights for places at the locality.
2. Search for each concept’s anchors.
3. Insights for neighborhood brands and artists.
4. Insights for each concept’s places and brands, with `feature.explainability=true`.
5. A fit score in code, not in the model: `100 × (0.55 place + 0.30 brand + 0.15 explainability)`. Go is 70 or above. Caution starts at 45. Below that is no-go.
6. A memo from the configured model. OpenAI is used when `OPENAI_API_KEY` is set, then Anthropic, then Qwen. It may only quote names and numbers from those hops. With no model key, a template writes that memo.

Allowed calls are GET on `https://hackathon.api.qloo.com` for `/search`, `/v2/tags`, and `/v2/insights`, with header `X-Api-Key`. Details: [docs/QLOO_CONSTRAINTS.md](docs/QLOO_CONSTRAINTS.md).

## Back-test

Weights were chosen before the run and were not changed after it. [docs/BACKTEST.md](docs/BACKTEST.md) has two tables.

The live run on October 24, 2026 scored 3 cases and picked the survivor in all 3. Fairfax/Riviera, Lululemon/Aland, and Seco/Shake Shack dropped. There were no misses among the scored cases.

The older fixture playback table is a pipeline check: 2 of 2 scored, 4 dropped.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000.

| Variable | Role |
|---|---|
| `QLOO_API_KEY` | Hackathon key. Empty means fixture playback. |
| `QLOO_BASE_URL` | Must stay `https://hackathon.api.qloo.com`. |
| `OPENAI_API_KEY` | First choice for the memo writer. |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL, ending in `/v1`. |
| `OPENAI_MODEL` | OpenAI model id. Empty uses `gpt-4o-mini`. |
| `ANTHROPIC_API_KEY` | Memo writer when OpenAI is unset. |
| `ANTHROPIC_BASE_URL` | Anthropic base URL. |
| `ANTHROPIC_MODEL` | Anthropic model id. Empty uses `claude-haiku-4-5`. |
| `QWEN_CLOUD_API_KEY` | Memo writer when OpenAI and Anthropic are unset. Qwen Cloud, OpenAI-compatible. |
| `QWEN_CLOUD_BASE_URL` | Qwen compatible-mode URL, ending in `/v1`. |
| `QWEN_MODEL` | Qwen model id. |

```bash
npm run test:score
```

UI is Tailwind CSS and shadcn/ui only.

## License

MIT. See [LICENSE](LICENSE).
