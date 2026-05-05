# Wider Composites Follow-Up (width=100, d=88)

## JSON (custom) rerun

Source: `results/json-custom-width100-rerun.json` (2026-04-08, warmup=3, runs=8).

- `n=9`: mean `7.8446s` (stddev `0.1264s`)
- `n=10`: mean `7.8685s` (stddev `0.1239s`)
- Difference (`n10 - n9`): `+0.0239s` (`+0.30%`)

Interpretation: `n=9` and `n=10` are effectively flat in the rerun; no meaningful dip.

---

## Hypothesis

The current benchmark shape (`creation` loop over a single mutated object) primarily exercises:
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