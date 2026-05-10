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

The low collision counts reported from the native instrumentation suggest that collision
handling is unlikely to be the primary source of the slowdown as the property count
grows.

### Likely dominant costs

- key construction / object traversal
- hashing / canonicalization cost
- allocation / intern table insertion

### Less likely contributors

- hash collisions
- equality comparison chains

---

## Next step direction

Based on the follow-up discussion, the next investigation should focus on profiling and
implementation shape rather than adding another benchmark variant.

- collect `--perf` data for the native implementation to identify where the time is
  actually spent
- use that profile to distinguish intrinsic costs of the composite-key approach from
  inefficient implementation details
- compare the current single internal hash map with an alternative trie-of-maps design,
  which should have different scaling characteristics as property count grows

This would help decide whether optimization work should target the existing hash-map
implementation or explore a different internal representation.
