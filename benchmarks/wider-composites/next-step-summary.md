# Wider Composites Follow-Up (width=100, d=88)

## JSON (custom) rerun

Source: `results/json-custom-width100-rerun.json` (2026-04-08, warmup=3, runs=8).

- `n=9`: mean `7.8446s` (stddev `0.1264s`)
- `n=10`: mean `7.8685s` (stddev `0.1239s`)
- Difference (`n10 - n9`): `+0.0239s` (`+0.30%`)

Interpretation: `n=9` and `n=10` are effectively flat in the rerun; no meaningful dip.

## Collision analysis

Source: `results/wider-composites-collision-analysis.json` (2026-04-08).

- `polyfill`: `38 / 681472` collisions (`0.0056%`), max bucket size `2`
- `polyfill-interned`: `40 / 681472` collisions (`0.0059%`), max bucket size `2`

Interpretation: collisions are very low for this slice, so collision rate does not appear to explain the observed performance gap by itself.
