# Compatibility Gate Requirements

This document defines requirements for the Kodrdriv compatibility gate.

## 1. Gate purpose

The gate MUST provide deterministic preflight validation for:

- overall Kodrdriv compatibility of a repository
- operation safety before `publish` and `tree publish`

The gate MUST fail fast on known blockers and return remediation guidance.

## 2. Check categories

### 2.1 Blocking checks

The gate MUST block execution when critical checks fail, including:

- git repository validity and operation preconditions
- branch safety and synchronization state
- merge conflict risk against target branch
- version safety and release-state validation
- required repository hygiene rules (`.gitignore`, lockfile policy, required scripts)
- required environment credentials and variables

### 2.2 Advisory checks

The gate SHOULD report non-critical issues as warnings, including:

- local dependency link recommendations
- workflow and release automation recommendations

Warnings MUST NOT block execution by default unless policy is configured to enforce them.

## 3. Profiles

The gate MUST support profile-based execution:

- `quick`: compatibility-focused, minimal overhead checks
- `strict`: release-focused checks for publish-critical operations

`publish` and `tree publish` MUST default to `strict`.

## 4. Result contract

The gate MUST emit a structured result with:

- `ready` (boolean)
- `classification` (`ok`, `warning`, `blocked`, `bypassed`)
- `profile` (`quick`, `strict`)
- `blockers[]` with stable code, message, and remediation steps
- `warnings[]` with stable code and message where available

The CLI SHOULD render a compact readiness summary table.
Machine-readable output MUST remain stable for CI and agent workflows.

## 5. Exit behavior

- `blocked` MUST return non-zero exit status.
- `ok` and `warning` SHOULD return zero exit status.
- `bypassed` MUST be explicitly marked in logs/output and policy records.

## 6. Bypass policy

Bypass MUST be explicit and emergency-only:

- operator MUST provide explicit bypass intent flag
- operator MUST provide bypass reason text
- output MUST include high-visibility risk warning
- CI MUST default to bypass disallowed unless explicitly enabled by policy

## 7. Enforcement

- `publish` MUST run strict compatibility gate before expensive operations.
- `tree publish` MUST run strict compatibility gate before expensive operations.
- standalone compatibility command MUST be available for non-publish preflight.
- MCP and CLI implementations MUST share the same gate semantics.

## 8. Performance and usability

- `quick` profile SHOULD complete in seconds on clean repositories.
- strict checks MUST surface known blockers before long-running release steps.
- each blocker MUST include concrete remediation commands where possible.

## 9. Documentation and operability

The project MUST document:

- when to run `quick` vs `strict`
- what each blocker code means
- bypass governance and CI policy behavior
- migration guidance for teams adopting enforced gates
