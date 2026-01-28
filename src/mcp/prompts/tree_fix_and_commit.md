# Tree Fix and Commit Workflow

## Objective

Ensure that precommit checks pass successfully across the entire monorepo tree. When failures occur, understand the root cause, fix the issues, and resume from the point of failure rather than restarting from the beginning.

## Prerequisites

Before proceeding, fetch the workspace resource to understand the monorepo structure:

**Workspace Resource**: `kodrdriv://workspace[/path/to/directory]`
- Confirms this is a tree operation (`packages.length > 1`)
- Provides the list of all packages in the monorepo
- Shows the root directory of the monorepo

**IMPORTANT**: The monorepo root directory is `/Users/tobrien/gitw/grunnverk`, NOT `/Users/tobrien/gitw/grunnverk/kodrdriv`.
- `kodrdriv` is a subdirectory within the `grunnverk` monorepo
- All tree commands MUST be run from the grunnverk root: `/Users/tobrien/gitw/grunnverk`
- Never run tree commands from within the kodrdriv subdirectory
- The `directory` parameter for all MCP tree commands should be `/Users/tobrien/gitw/grunnverk`

## Workflow Steps

1. **Initial Precommit Check**
   - **ALWAYS use the MCP tool**: Run `kodrdriv_tree_precommit` with `fix=true`, `parallel=true`, and `directory="/Users/tobrien/gitw/grunnverk"`
   - **CRITICAL: Use `parallel=true`** - This dramatically speeds up execution for large monorepos by running independent packages concurrently
   - **DO NOT** fall back to manual command-line execution (`npx kodrdriv tree precommit`) unless the MCP tool is completely broken
   - If the MCP tool fails, investigate the error message carefully - it will tell you which package failed and why
   - This will execute precommit checks (linting, type checking, tests, build) across all packages, respecting dependency order even in parallel mode

2. **Handle Failures**
   - **If the MCP tool fails**: The error message will indicate which package failed (e.g., "Command failed in package @grunnverk/tree-execution")
   - **DO NOT** switch to manual command-line execution - continue using the MCP tool with `start_from` parameter
   - Carefully analyze the error output to understand:
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
   - **ALWAYS include `parallel=true`** when resuming - it significantly reduces wait time
   - This avoids re-running checks on packages that already passed, saving significant time in large projects
   - Example: If package `@grunnverk/core` failed, run `kodrdriv_tree_precommit` with `start_from="@grunnverk/core"`, `parallel=true`, and `fix=true`
   - The `start_from` parameter accepts either package name (e.g., `@grunnverk/core`) or directory name (e.g., `core`)

4. **Iterate Until Success**
   - Repeat steps 2-3 until all packages pass precommit checks
   - Each iteration should resume from the last failing package

5. **Commit Changes**
   - Once all precommit checks pass, commit the fixes using `kodrdriv_tree_commit` with `sendit=true`
   - The commit message will be automatically generated from the changes

## Important Notes

- **ALWAYS use MCP tools**: Use `kodrdriv_tree_precommit`, `kodrdriv_tree_commit`, etc. - do NOT fall back to manual command-line execution
- **Monorepo Root**: Always use `directory="/Users/tobrien/gitw/grunnverk"` - kodrdriv is a subdirectory, not the root
- **Parallel Execution**: **ALWAYS use `parallel=true`** - This is critical for large monorepos as it can reduce execution time from 20-30 minutes to 5-10 minutes by running independent packages concurrently
- **Efficiency**: For large monorepos, always use `start_from` to resume from failures rather than restarting the entire process
- **Dependency Order**: The tree commands process packages in dependency order, even in parallel mode - independent packages run concurrently while respecting dependencies
- **Fix Flag**: Use `fix=true` to enable auto-fixing where possible, but manual fixes may still be required
- **All Tree Commands Support `start_from`**: The `start_from` parameter works with all tree MCP commands (`kodrdriv_tree_precommit`, `kodrdriv_tree_publish`, `kodrdriv_tree_commit`, etc.)
- **MCP Tool Failures**: If the MCP tool reports an error, investigate the error message - it contains the package name and failure reason. Continue using the MCP tool with `start_from` and `parallel=true` to resume from the failure point.

## Example Flow

```
1. Fetch kodrdriv://workspace/Users/tobrien/gitw/grunnverk
   → Confirms this is a tree with multiple packages

2. kodrdriv_tree_precommit({
     directory: "/Users/tobrien/gitw/grunnverk",
     fix: true,
     parallel: true  // CRITICAL: Speeds up execution significantly
   })
   → Fails at package "@grunnverk/commands-git"
   → Error: "Command failed in package @grunnverk/commands-git"

3. Analyze error: TypeScript type error in src/git.ts:42
   → Fix the type error in the commands-git package

4. kodrdriv_tree_precommit({
     directory: "/Users/tobrien/gitw/grunnverk",
     fix: true,
     parallel: true,  // ALWAYS include parallel=true
     start_from: "commands-git"  // or "@grunnverk/commands-git"
   })
   → Continues from commands-git, may fail at next package

5. Repeat until all pass (always using MCP tools with parallel=true, never manual commands)

6. kodrdriv_tree_commit({
     directory: "/Users/tobrien/gitw/grunnverk",
     sendit: true
   })
   → Commits all fixes
```

## What NOT to Do

- ❌ **DO NOT** run `npx kodrdriv tree precommit` manually from the command line
- ❌ **DO NOT** use `/Users/tobrien/gitw/grunnverk/kodrdriv` as the directory - that's a subdirectory, not the root
- ❌ **DO NOT** switch to manual execution if the MCP tool fails - investigate the error and use `start_from` to resume
- ❌ **DO NOT** run commands from within the kodrdriv directory - always use the grunnverk root
