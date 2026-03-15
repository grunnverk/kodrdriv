# Logging Backend Decision

## Decision

Kodrdriv keeps the current `winston` implementation as the active backend for now, and formalizes a backend-agnostic contract so `@fjell/logging` can be adopted behind an adapter without changing command-level behavior.

## Why

- Current logging behavior is already deeply integrated in publish/tree flows and tests.
- The immediate priority is human-first output + deterministic model handoff on failures.
- A direct backend swap during this behavior change would increase risk and make regressions harder to isolate.

## Chosen Path

1. Treat logger calls as contract-first at the command layer (stable labels and output format).
2. Keep `winston` as active backend while implementing output/handoff changes.
3. Keep adapter boundaries explicit so `@fjell/logging` can replace backend internals later.

## Acceptance Criteria For Future `@fjell/logging` Migration

- No breaking changes to default operator output contract.
- No loss of explicit debug/verbose diagnostic depth.
- No regressions in MCP-safe output behavior.
- Existing command-level tests pass without rewriting user-facing message contracts.

## Deferred Work

- Full migration of backend internals from `winston` to `@fjell/logging`.
- Backend performance comparison under long-running tree publish workloads.
