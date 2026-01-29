# Tree Fix and Commit Workflow

## Objective

Ensure that precommit checks pass successfully across the entire monorepo tree. When failures occur, understand the root cause, fix the issues, and continue checking remaining packages rather than restarting from the beginning.

## Prerequisites

Before proceeding, fetch the workspace resource to understand the monorepo structure:

**Workspace Resource**: `kodrdriv://workspace[/path/to/directory]`
- Confirms this is a tree operation (`packages.length > 1`)
- Provides the list of all packages in the monorepo
- Shows the root directory of the monorepo
- Shows the dependency order of packages

**IMPORTANT**: The monorepo root directory is `/Users/tobrien/gitw/grunnverk`, NOT `/Users/tobrien/gitw/grunnverk/kodrdriv`.
- `kodrdriv` is a subdirectory within the `grunnverk` monorepo
- All tree commands MUST be run from the grunnverk root: `/Users/tobrien/gitw/grunnverk`
- Never run tree commands from within the kodrdriv subdirectory
- The `directory` parameter for all MCP tree commands should be `/Users/tobrien/gitw/grunnverk`

## Workflow Steps

1. **Get Package List and Order**
   - Fetch `kodrdriv://workspace/Users/tobrien/gitw/grunnverk` to get the list of packages in dependency order
   - This tells you which packages to check and in what order

2. **Run Individual Precommit Checks with Concurrency**
   - **DO NOT** use `kodrdriv_tree_precommit` - it takes too long and provides little benefit
   - **INSTEAD**: Run `kodrdriv_precommit` on individual packages in dependency order
   - **Use concurrency control**: Run 3-4 packages at a time in parallel
   - **Process in batches**: Group independent packages (those at the same dependency level) and run them concurrently
   - Example: If packages A, B, C have no dependencies on each other, run their precommits in parallel (3-4 at a time)
   - Example: If package D depends on A, B, C, wait for A, B, C to complete before running D's precommit

3. **Handle Failures**
   - If a package's precommit fails, analyze the error output to understand:
     - What type of error occurred (lint error, type error, test failure, build failure)
     - The specific files and lines involved
   - Fix the issues in the failing package:
     - For lint errors: Fix code style issues or disable specific rules with inline comments if justified
     - For type errors: Fix TypeScript type issues
     - For test failures: Update or fix tests to match new behavior
     - For build failures: Fix compilation or bundling issues
     - For coverage drops: Add tests to maintain coverage thresholds
       - **Tip**: If the project uses lcov format for coverage reports and you're struggling with coverage thresholds, consider using the `brennpunkt` MCP server tools (e.g., `brennpunkt_get_priorities`, `brennpunkt_coverage_summary`, `brennpunkt_get_file_coverage`) to identify high-priority files and understand coverage gaps. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`
   - After fixing, re-run `kodrdriv_precommit` for that specific package with `fix=true`

4. **Continue with Remaining Packages**
   - After fixing a failed package, continue checking the remaining packages
   - Keep track of which packages have passed and which still need to be checked
   - Continue running 3-4 packages at a time in parallel, respecting dependency order

5. **Iterate Until All Pass**
   - Repeat steps 2-4 until all packages pass precommit checks
   - Track progress: note which packages have passed and which are remaining

6. **Commit Changes**
   - Once all precommit checks pass, commit the fixes using `kodrdriv_tree_commit` with `sendit=true`
   - The commit message will be automatically generated from the changes

## Important Notes

- **Individual Package Precommits**: Always use `kodrdriv_precommit` on individual packages, NOT `kodrdriv_tree_precommit`
- **Concurrency Control**: Run 3-4 packages at a time in parallel to balance speed and resource usage
- **Dependency Order**: Respect package dependencies - don't run a package's precommit until its dependencies have passed
- **Monorepo Root**: Always use `directory="/Users/tobrien/gitw/grunnverk"` - kodrdriv is a subdirectory, not the root
- **Fix Flag**: Use `fix=true` to enable auto-fixing where possible, but manual fixes may still be required
- **Track Progress**: Keep track of which packages have passed, failed, or are pending to avoid redundant work

## Example Flow

```
1. Fetch kodrdriv://workspace/Users/tobrien/gitw/grunnverk
   → Returns packages in dependency order:
     - Level 0: shared-utils, core, git-tools (no dependencies)
     - Level 1: commands-git, tree-core (depend on Level 0)
     - Level 2: commands-tree, tree-execution (depend on Level 1)
     - etc.

2. Run Level 0 packages in parallel (3 at a time):
   kodrdriv_precommit({ directory: "/Users/tobrien/gitw/grunnverk/shared-utils", fix: true })
   kodrdriv_precommit({ directory: "/Users/tobrien/gitw/grunnverk/core", fix: true })
   kodrdriv_precommit({ directory: "/Users/tobrien/gitw/grunnverk/git-tools", fix: true })
   → All pass

3. Run Level 1 packages in parallel (2 at a time):
   kodrdriv_precommit({ directory: "/Users/tobrien/gitw/grunnverk/commands-git", fix: true })
   kodrdriv_precommit({ directory: "/Users/tobrien/gitw/grunnverk/tree-core", fix: true })
   → commands-git fails with TypeScript error

4. Fix the error in commands-git, then re-run:
   kodrdriv_precommit({ directory: "/Users/tobrien/gitw/grunnverk/commands-git", fix: true })
   → Passes

5. Continue with Level 2 packages in parallel:
   kodrdriv_precommit({ directory: "/Users/tobrien/gitw/grunnverk/commands-tree", fix: true })
   kodrdriv_precommit({ directory: "/Users/tobrien/gitw/grunnverk/tree-execution", fix: true })
   → All pass

6. Continue until all packages pass

7. kodrdriv_tree_commit({
     directory: "/Users/tobrien/gitw/grunnverk",
     sendit: true
   })
   → Commits all fixes
```

## What NOT to Do

- ❌ **DO NOT** use `kodrdriv_tree_precommit` - it takes too long and provides little benefit
- ❌ **DO NOT** run all packages sequentially - use concurrency (3-4 at a time)
- ❌ **DO NOT** run `npx kodrdriv tree precommit` manually from the command line
- ❌ **DO NOT** use `/Users/tobrien/gitw/grunnverk/kodrdriv` as the directory - that's a subdirectory, not the root
- ❌ **DO NOT** run commands from within the kodrdriv directory - always use the grunnverk root
- ❌ **DO NOT** ignore dependency order - packages must be checked after their dependencies pass
