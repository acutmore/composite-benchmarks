# Wider Composites Follow-Up (width=100, d=88)

## JSON (custom) rerun

Source: `results/json-custom-width100-rerun.json` (2026-04-08, warmup=3, runs=8).

- `n=9`: mean `7.8446s` (stddev `0.1264s`)
- `n=10`: mean `7.8685s` (stddev `0.1239s`)
- Difference (`n10 - n9`): `+0.0239s` (`+0.30%`)

Interpretation: `n=9` and `n=10` are effectively flat in the rerun; no meaningful dip.

---

## Collision analysis (polyfill)

Source: `results/wider-composites-collision-analysis.json` (2026-04-08).

- `polyfill`: `38 / 681472` collisions (`0.0056%`), max bucket size `2`
- `polyfill-interned`: `40 / 681472` collisions (`0.0059%`), max bucket size `2`

Interpretation: collisions are very low for this slice, so collision rate does not appear to explain the observed performance gap.

---

## Collision analysis (native)

Source: `results/native-collision-analysis.json`.

- `native`: `162 / ~681k` collisions (`~0.0238%`)
- max bucket size: `1`
- total equality checks: `60`

Interpretation:

- Collision rate remains very low in the native implementation.
- Bucket sizes do not grow beyond `1`, indicating no meaningful clustering.
- Equality checks are negligible relative to total insertions.

Conclusion:

👉 Collisions are unlikely to be a primary driver of performance differences in this slice, even in the native implementation.

---

## Updated hypothesis

Given both polyfill and native results:

- Collision behavior is minimal and consistent across implementations.
- The current benchmark shape (`creation` loop over a single mutated object) primarily exercises:
  - key construction
  - hashing / canonicalization
  - intern lookup (mostly miss + create)

It does **not strongly exercise retained-key hit-path behavior**.

### Likely dominant costs

- key construction / object traversal
- hashing / canonicalization cost
- allocation / intern table insertion

### Less likely contributors

- hash collisions
- equality comparison chains

---

## Next step direction

Based on these results, a useful next benchmark dimension would be:

- separating **create-path vs retained-hit-path behavior**, e.g.
  - reuse of previously created composite keys
  - repeated lookups against stable key sets

This would help isolate:
- intern table hit cost vs creation cost
- impact of key reuse vs recomputation