# Kodrdriv Compatibility Gate

## What the gate is

The compatibility gate is a deterministic preflight check that answers:

- Is this project compatible with Kodrdriv right now?
- Is it safe to run publish or tree publish right now?

It is designed to fail fast, explain blockers clearly, and provide actionable remediation commands.

## What it checks

### Blocking checks (must pass)

- Git context (valid repo, clean working tree for publish flows)
- Branch safety (not on target branch, sync state, merge conflict risk)
- Version safety (valid dev/release version state and collision prevention)
- Repository hygiene required by Kodrdriv:
  - required `.gitignore` patterns
  - lockfile policy consistency
  - required scripts (such as `prepublishOnly` where applicable)
- Environment readiness (required tokens and environment variables)

### Advisory checks (warning by default)

- Local workspace link status
- Workflow configuration recommendations
- Other non-critical readiness hints

## Profiles

The gate supports two profiles:

- `quick`: low-overhead compatibility check intended for fast local readiness.
- `strict`: expanded checks for release-critical operations such as `publish` and `tree publish`.

## Output contract

The gate should emit both human-readable and machine-readable output:

- `ready`: boolean
- `classification`: `ok` | `warning` | `blocked` | `bypassed`
- `profile`: `quick` | `strict`
- `blockers[]`: stable code, message, remediation commands
- `warnings[]`: non-blocking issues

CLI output should include a concise readiness summary with copy/paste remediation.

## Bypass policy

Bypass is emergency-only and must be explicit.

- Requires explicit bypass flag and reason text
- Emits high-visibility risk warnings
- Defaults to disallowed in CI unless policy explicitly enables it

## Enforcement expectations

- `publish` and `tree publish` must run strict compatibility checks by default before expensive work starts
- Standalone compatibility check must exist for onboarding and preflight use
- CLI and MCP surfaces should use the same underlying gate engine and result model

## Performance expectations

- `quick` profile should complete quickly for clean repositories
- `strict` profile should fail before expensive release phases when blockers are known
- Every blocker should include a direct remediation path
