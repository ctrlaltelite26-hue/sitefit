# Back-test

Weights are frozen in `src/lib/scoring.ts`: place **0.55**, brand **0.30**, explainability **0.15**. They were chosen before this run and were not changed after it. The git tag `weights-frozen` is not on a commit yet. Tag that revision when it is committed. Do not edit `SCORE_WEIGHTS` after that.

This run is fixture playback from `npm run test:score` on Oct 23, 2026. `QLOO_API_KEY` is unset, so the hackathon host was not called. The catalog affinities were written for the demo. A hit here checks the pipeline. It is not evidence that the score predicts a real closing.

| Case | Survivor score | Closed score | Picked the survivor? | Notes |
|---|---|---|---|---|
| wv-buvette-vs-windsor | — | — | dropped | Buvette does not resolve on fixture playback |
| wv-fairfax-vs-riviera | — | — | dropped | Fairfax and Riviera do not resolve |
| wb-madewell-vs-urban-outfitters | 23 | 11 | yes | Fixture brands only. No place hop |
| wb-lululemon-vs-aland | — | — | dropped | Aland does not resolve |
| sl-seco-vs-shake-shack | 43 | 7 | yes | Both score. Neither reaches go |
| sl-bandini-vs-starbucks-mohawk | — | — | dropped | Echo Park is not in the fixture catalog |

**Hit rate:** 2 of 2 scored cases. **Dropped:** 4. **Misses:** none among the cases that scored.

## Status check (October 23, 2026)

Public pages checked the same day still match the case file. No survivor was reclassified, and no closed business was found reopened.

| Case | What the check showed |
|---|---|
| Buvette | ilovebuvette.com still lists 42 Grove Street, open daily. |
| Fairfax | fairfax.nyc and OpenTable still list 234 West 4th Street with hours. The page still calls it an all-day neighborhood restaurant (“Birds, Burgers and Booze”). The drift caveat stands. |
| The Windsor, Riviera | Historical closures (2015 and 2017). This pass did not search them again. |
| Madewell Williamsburg | madewell.com lists 109 North 6th Street with hours on October 23, 2026. |
| Lululemon Williamsburg | The store page lists 129 North 6th Street as open. |
| Urban Outfitters, 98 North 6th | Brownstoner: closed to customers April 21, 2024. |
| Aland | Not re-checked beyond the existing caveat: the flagship vacated and the business moved. It is not a clean failure. |
| Seco | Yelp, updated October 2026, lists 3820 Sunset Boulevard as open. |
| Shake Shack Silver Lake | Listed permanently closed. The 2024 closure wave still names Silver Lake. |
| Bar Bandini | barbandini.com still lists hours at 2150 Sunset Boulevard. |
| Starbucks, 2134 Sunset | The Eastsider named that Echo Park store in the September 2025 closure wave. No reopening showed up in this pass. |

Re-run this file against the live host once the key exists. Keep the dropped rows. Do not retune the weights to raise the hit rate.

## Live run (October 24, 2026)

Same weights. The live scorer uses the agent’s signal: search the anchor, then Insights with `signal.interests.entities` and `feature.explainability=true`. A location-only Insights list has no affinity, so it is not the score. `SCORE_WEIGHTS` was not edited after these numbers.

| Case | Survivor | Closed | Picked the survivor? | Notes |
|---|---|---|---|---|
| wv-buvette-vs-windsor | 97 | 78 | yes | |
| wv-fairfax-vs-riviera | — | — | dropped | Riviera Cafe does not exact-match |
| wb-madewell-vs-urban-outfitters | 94 | 93 | yes | One point apart |
| wb-lululemon-vs-aland | — | — | dropped | Insights returned 400 |
| sl-seco-vs-shake-shack | — | — | dropped | Seco and Barr Seco do not exact-match |
| sl-bandini-vs-starbucks-mohawk | 97 | 93 | yes | |

**Hit rate:** 3 of 3 scored cases. **Dropped:** 3. **Misses:** none among the cases that scored.

The hackathon quota on this run was 50,000 requests per month, with about 49,700 remaining, and 10 requests per second. That is not a thin quota. Silver Lake on the host is `Silver Lake, Los Angeles`. The bare name resolves to a different town.
