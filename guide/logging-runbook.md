# Logging Continuation Runbook

## Purpose

Use this runbook when a long-running `kodrdriv tree publish` or `kodrdriv tree commit` run fails and you want to continue with model-assisted debugging.

## What To Look For In Console Output

On failure, tree execution emits a deterministic handoff envelope:

- `KODRDRIV_MODEL_HANDOFF_BEGIN`
- single-line JSON payload with `run_id`, `log_path`, `related_logs`, and prompt guidance
- human-readable `Model handoff:` block
- `KODRDRIV_MODEL_HANDOFF_END`

## Continuation Workflow

1. Capture `run_id` and `log_path` from the handoff payload.
2. Open the sidecar manifest from `related_logs` first (if present).
3. Inspect `stderr` and stack traces in the run log.
4. Apply the smallest safe fix.
5. Re-run the same tree command.
6. Use `--debug` only when run log context is insufficient.

## Runtime Log Location

Default runtime log location is user-level:

- `~/.kodrdriv/log`

This avoids repository-local `output/` noise for operational logs.

## Logging Backend Migration Notes

Current backend is `winston`, with migration planning for `@fjell/logging`.
The migration guardrail is contract stability:

- keep failure handoff envelope fields stable
- keep human-facing default output concise
- keep debug depth available without changing command UX
