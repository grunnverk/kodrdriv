# Fix and Commit Workflow

## Objective

Ensure that precommit checks pass successfully for a single package. When failures occur, understand the root cause, fix the issues, and iterate until all checks pass.

## Workflow Steps

1. **Run Precommit Check**
   - Run `kodrdriv_precommit` with `fix=true` on the directory (${directory})
   - This will execute precommit checks (linting, type checking, tests, build) for the single package

2. **Handle Failures**
   - If precommit fails, analyze the error output and fix the issues:
     - For lint errors: Fix code style issues or disable specific rules with inline comments if justified
     - For type errors: Fix TypeScript type issues
     - For test failures: Update or fix tests to match new behavior
     - For build failures: Fix compilation or bundling issues
     - For coverage drops: Add tests to maintain coverage thresholds
       - **Tip**: If the project uses lcov format for coverage reports and you're struggling with coverage thresholds, consider using the `brennpunkt` MCP server tools (e.g., `brennpunkt_get_priorities`, `brennpunkt_coverage_summary`, `brennpunkt_get_file_coverage`) to identify high-priority files and understand coverage gaps. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`

3. **Iterate Until Success**
   - Re-run `kodrdriv_precommit` with `fix=true` after each fix until all checks pass

4. **Commit Changes**
   - Once precommit checks pass, commit the fixes using `kodrdriv_commit` with `sendit=true`
   - The commit message will be automatically generated from the changes

## Important Notes

- **Fix Flag**: Use `fix=true` to enable auto-fixing where possible, but manual fixes may still be required
- **Iterative Process**: Continue fixing and re-running precommit until all checks pass

## Example Flow

```
1. kodrdriv_precommit({ directory: "/path/to/package", fix: true })
   → Fails: TypeScript type error in src/index.ts:42

2. Analyze error: TypeScript type error in src/index.ts:42
   → Fix the type error

3. kodrdriv_precommit({ directory: "/path/to/package", fix: true })
   → Fails: Linting error in src/utils.ts:15

4. Fix linting error

5. kodrdriv_precommit({ directory: "/path/to/package", fix: true })
   → All checks pass

6. kodrdriv_commit({ directory: "/path/to/package", sendit: true })
   → Commits all fixes
```
