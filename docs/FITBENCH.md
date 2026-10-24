# FitBench

Preset 1, West Village. Natural wine / small plates against a sports bar. The treatment column is fixture playback from Oct 23, 2026. The LLM-only column is the desk control: the model writes from the neighborhood and the two names, and Qloo is not called.

Weights are the starting point from the build plan: place 0.55, brand 0.30, explainability 0.15. They were not changed after this table.

| | Treatment | LLM-only |
|---|---|---|
| What ran | Fixture place, brand, and explainability hops, scored in `src/lib/scoring.ts` | The model. Same address and concept names. No hops |
| Scores | Natural wine / small plates **76**. Sports bar **22** | None |
| Verdict | GO vs NO-GO | No verdict |
| A cited line | driven by Via Carota (0.64) | None. The note is the model’s guess. |
| Stamp | GROUNDED | UNGROUNDED |

The treatment adds a fit score and a named affinity. The ablation states a preference and cites nothing.

The live desk, October 24, 2026, is a different pair of numbers. Qloo Insights for the same preset scored natural wine **90 GO** and the sports bar **86 GO**. Wine still leads. Those scores use the same weights. They are not the fixture 76 and 22, and the weights were not edited to produce them.

The 76 comes from the fixture affinities already on the West Village score hop (places 0.84 and 0.79, brand 0.71, explainability weight 0.64). It is not a live Qloo call, and it is not the back-test. `src/lib/backtest/runBacktest.ts` completes on the same playback and drops cases the catalog cannot resolve. That run is a pipeline check. The published back-test waits until the weights are frozen and Qloo is live.
