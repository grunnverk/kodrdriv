# Fix and Commit Workflow

## Objective

Ensure that precommit checks pass successfully across the entire monorepo tree. When failures occur, understand the root cause, fix the issues, and resume from the point of failure rather than restarting from the beginning.

## Determining Tree vs Single-Package Operation

**Important**: Before proceeding, determine if this is a tree operation or a single-package operation:

- **Tree Operation**: If the directory (${directory}) contains subdirectories with `package.json` files, this is a monorepo/tree operation. Use `kodrdriv_tree_precommit` and `kodrdriv_tree_commit` commands.
- **Single-Package Operation**: If the directory is a leaf project (single package without subdirectories containing `package.json`), this is NOT a tree operation. Use `kodrdriv_precommit` and `kodrdriv_commit` commands instead, and focus on running precommit and fixing anything that breaks.

## Workflow Steps

### For Tree Operations (Monorepo)

1. **Initial Precommit Check**
   - Run `kodrdriv_tree_precommit` with `fix=true` on the monorepo root directory (${directory})
   - This will execute precommit checks (linting, type checking, tests, build) across all packages in dependency order

2. **Handle Failures**
   - If precommit fails, carefully analyze the error output to understand:
     - Which package failed
     - What type of error occurred (lint error, type error, test failure, build failure)
     - The specific files and lines involved
   - Fix the issues in the failing package:
     - For lint errors: Fix code style issues or disable specific rules with inline comments if justified
     - For type errors: Fix TypeScript type issues
     - For test failures: Update or fix tests to match new behavior
     - For build failures: Fix compilation or bundling issues
     - For coverage drops: Add tests to maintain coverage thresholds
       - **Tip**: If the project uses lcov format for coverage reports and you're struggling with coverage thresholds, consider using the `brennpunkt` MCP server tools (e.g., `brennpunkt_get_priorities`, `brennpunkt_coverage_summary`, `brennpunkt_get_file_coverage`) to identify high-priority files and understand coverage gaps. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`

3. **Resume from Failure Point**
   - After fixing issues, use `start_from` parameter to resume from the package that failed
   - This avoids re-running checks on packages that already passed, saving significant time in large projects
   - Example: If package `@eldrforge/core` failed, run `kodrdriv_tree_precommit` with `start_from="@eldrforge/core"` or `start_from="core"`
   - The `start_from` parameter accepts either package name (e.g., `@eldrforge/core`) or directory name (e.g., `core`)

4. **Iterate Until Success**
   - Repeat steps 2-3 until all packages pass precommit checks
   - Each iteration should resume from the last failing package

5. **Commit Changes**
   - Once all precommit checks pass, commit the fixes using `kodrdriv_tree_commit` with `sendit=true`
   - The commit message will be automatically generated from the changes

### For Single-Package Operations (Leaf Project)

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

- **Efficiency**: For large monorepos, always use `start_from` to resume from failures rather than restarting the entire process
- **Dependency Order**: The tree commands process packages in dependency order, so fixing a dependency may require re-checking dependent packages
- **Fix Flag**: Use `fix=true` to enable auto-fixing where possible, but manual fixes may still be required
- **All Tree Commands Support `start_from`**: The `start_from` parameter works with all tree MCP commands (`kodrdriv_tree_precommit`, `kodrdriv_tree_publish`, `kodrdriv_tree_commit`, etc.)

## Example Flow

```
1. kodrdriv_tree_precommit({ directory: "/path/to/monorepo", fix: true })
   → Fails at package "commands-git"

2. Analyze error: TypeScript type error in src/git.ts:42
   → Fix the type error

3. kodrdriv_tree_precommit({
     directory: "/path/to/monorepo",
     fix: true,
     start_from: "commands-git"
   })
   → Continues from commands-git, may fail at next package

4. Repeat until all pass

5. kodrdriv_tree_commit({ directory: "/path/to/monorepo", sendit: true })
   → Commits all fixes
```
