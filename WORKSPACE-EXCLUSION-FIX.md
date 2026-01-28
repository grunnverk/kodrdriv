# Workspace Exclusion Fix

## Problem

The `check_development` MCP prompt was incorrectly identifying test directories and documentation directories as packages that needed to be checked. This resulted in false positives for packages like:

- `kodrdriv-docs` (in `doc/` or `docs/`)
- `@test/external-unlink-test` (in `test-*/`)
- `@test/app` (in `test-*/`)
- `test-project` (in `test-*/`)

These directories should be excluded from workspace scanning as they are not real packages that need development readiness checks.

## Root Cause

Two functions were calling `scanForPackageJsonFiles` without passing exclusion patterns:

1. **`check-development.ts`** - The `executeCheckDevelopment` function
2. **`shared.ts`** - The `discoverTreePackages` function (used by all tree tools)

The `workspace.ts` resource already had the correct exclusion logic, but it wasn't being used consistently across all tools.

## Solution

Added the same exclusion pattern logic to both files:

### Default Exclusion Patterns

```typescript
const DEFAULT_EXCLUDE_SUBPROJECTS = [
    'doc/',
    'docs/',
    'test-*/',
];
```

### Implementation

Both files now:

1. Load the kodrdriv config to get custom exclusions (if any)
2. Build a comprehensive list of exclusion patterns:
   - Standard build artifacts: `node_modules/`, `dist/`, `build/`, `.git/`
   - Subproject exclusions from config or defaults
3. Pass these patterns to `scanForPackageJsonFiles`

### Files Modified

- **`src/mcp/tools/check-development.ts`**
  - Added `loadConfig` import
  - Added `DEFAULT_EXCLUDE_SUBPROJECTS` constant
  - Modified `executeCheckDevelopment` to load config and build exclusion patterns
  
- **`src/mcp/tools/shared.ts`**
  - Added `loadConfig` import
  - Added `DEFAULT_EXCLUDE_SUBPROJECTS` constant
  - Modified `discoverTreePackages` to load config and build exclusion patterns

## Configuration

Users can customize exclusions in their `.kodrdrivrc.json`:

```json
{
  "workspace": {
    "excludeSubprojects": [
      "doc/",
      "docs/",
      "test-*/",
      "examples/",
      "custom-test-dir/"
    ]
  }
}
```

## Impact

This fix affects:

- **`check_development` prompt** - Now correctly ignores test/doc directories
- **All tree tools** - `tree_commit`, `tree_publish`, `tree_link`, etc. now use consistent exclusions
- **Workspace resource** - Already had correct behavior, now consistent with tools

## Testing

All precommit checks pass:
- ✅ Linting
- ✅ TypeScript compilation
- ✅ Unit tests (1055 tests passed)
- ✅ MCP compliance tests

## Related Files

The exclusion pattern logic is now consistent across:
- `src/mcp/resources/workspace.ts` (original implementation)
- `src/mcp/resources/tree-graph.ts` (already using exclusions)
- `src/mcp/tools/check-development.ts` (fixed)
- `src/mcp/tools/shared.ts` (fixed)
