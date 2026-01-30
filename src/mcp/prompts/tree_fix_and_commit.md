# Tree Fix and Commit Workflow

## Objective

Ensure that precommit checks pass successfully across the entire monorepo tree. When failures occur, understand the root cause, fix the issues, and continue checking remaining packages rather than restarting from the beginning.

## CRITICAL: What to Do When This Prompt is Invoked

**IMMEDIATELY execute these steps when this prompt is invoked:**

### Step 1: Fetch Workspace Structure (DO THIS FIRST)

Fetch `kodrdriv://workspace{{directory}}` to get:
- The list of all packages in the monorepo
- The dependency order of packages (which packages depend on which)
- Confirmation this is a tree operation (`packages.length > 1`)

**IMPORTANT**: The `{{directory}}` parameter points to the monorepo root, not a subdirectory.

### Step 2: Run Precommit Checks on All Packages (DO THIS IMMEDIATELY AFTER STEP 1)

**DO NOT** use `kodrdriv_tree_precommit` - it takes too long and provides little benefit.

**INSTEAD**: Run `kodrdriv_precommit` on individual packages in parallel:
- **Use concurrency control**: Run 3-4 packages at a time in parallel
- **Process by dependency level**: Group packages at the same dependency level and run them concurrently
- **Respect dependency order**: Don't run a package until its dependencies have passed
- **Use `fix=true`**: Enable auto-fixing where possible

**Example of what to do immediately:**
```
// After fetching workspace, if you get packages in dependency order:
// Level 0: shared-utils, core, git-tools (no dependencies)
// Level 1: commands-git, tree-core (depend on Level 0)
// etc.

// IMMEDIATELY run Level 0 packages in parallel (3-4 at a time):
kodrdriv_precommit({ directory: "{{directory}}/shared-utils", fix: true })
kodrdriv_precommit({ directory: "{{directory}}/core", fix: true })
kodrdriv_precommit({ directory: "{{directory}}/git-tools", fix: true })

// Then continue with next levels...
```

### Step 3: Handle Failures and Continue

When a package's precommit fails:

1. **Analyze the error output** to understand:
   - What type of error occurred (lint error, type error, test failure, build failure)
   - The specific files and lines involved

2. **Fix the issues** in the failing package:
   - For lint errors: Fix code style issues or disable specific rules with inline comments if justified
   - For type errors: Fix TypeScript type issues
   - For test failures: Update or fix tests to match new behavior
   - For build failures: Fix compilation or bundling issues
   - For coverage drops: Add tests to maintain coverage thresholds
     - **Tip**: If the project uses lcov format for coverage reports and you're struggling with coverage thresholds, consider using the `brennpunkt` MCP server tools (e.g., `brennpunkt_get_priorities`, `brennpunkt_coverage_summary`, `brennpunkt_get_file_coverage`) to identify high-priority files and understand coverage gaps. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`

3. **Re-run precommit** for that specific package:
   ```
   kodrdriv_precommit({ directory: "{{directory}}/failing-package", fix: true })
   ```

4. **Continue with remaining packages** - don't restart from the beginning:
   - Keep track of which packages have passed and which still need to be checked
   - Continue running 3-4 packages at a time in parallel, respecting dependency order

### Step 4: Commit When All Pass

Once all precommit checks pass, commit the fixes:
```
kodrdriv_tree_commit({ directory: "{{directory}}", sendit: true })
```

The commit message will be automatically generated from the changes.

## Important Notes

- **Individual Package Precommits**: Always use `kodrdriv_precommit` on individual packages, NOT `kodrdriv_tree_precommit`
- **Concurrency Control**: Run 3-4 packages at a time in parallel to balance speed and resource usage
- **Dependency Order**: Respect package dependencies - don't run a package's precommit until its dependencies have passed
- **Monorepo Root**: Always use `directory="{{directory}}"` for tree commands
- **Fix Flag**: Use `fix=true` to enable auto-fixing where possible, but manual fixes may still be required
- **Track Progress**: Keep track of which packages have passed, failed, or are pending to avoid redundant work

## Example Flow

```
1. Fetch kodrdriv://workspace{{directory}}
   → Returns packages in dependency order:
     - Level 0: shared-utils, core, git-tools (no dependencies)
     - Level 1: commands-git, tree-core (depend on Level 0)
     - Level 2: commands-tree, tree-execution (depend on Level 1)
     - etc.

2. Run Level 0 packages in parallel (3 at a time):
   kodrdriv_precommit({ directory: "{{directory}}/shared-utils", fix: true })
   kodrdriv_precommit({ directory: "{{directory}}/core", fix: true })
   kodrdriv_precommit({ directory: "{{directory}}/git-tools", fix: true })
   → All pass

3. Run Level 1 packages in parallel (2 at a time):
   kodrdriv_precommit({ directory: "{{directory}}/commands-git", fix: true })
   kodrdriv_precommit({ directory: "{{directory}}/tree-core", fix: true })
   → commands-git fails with TypeScript error

4. Fix the error in commands-git, then re-run:
   kodrdriv_precommit({ directory: "{{directory}}/commands-git", fix: true })
   → Passes

5. Continue with Level 2 packages in parallel:
   kodrdriv_precommit({ directory: "{{directory}}/commands-tree", fix: true })
   kodrdriv_precommit({ directory: "{{directory}}/tree-execution", fix: true })
   → All pass

6. Continue until all packages pass

7. kodrdriv_tree_commit({
     directory: "{{directory}}",
     sendit: true
   })
   → Commits all fixes
```

## What NOT to Do

- ❌ **DO NOT** use `kodrdriv_tree_precommit` - it takes too long and provides little benefit
- ❌ **DO NOT** run all packages sequentially - use concurrency (3-4 at a time)
- ❌ **DO NOT** run `npx kodrdriv tree precommit` manually from the command line
- ❌ **DO NOT** use a package subdirectory as the directory - use the monorepo root from `{{directory}}`
- ❌ **DO NOT** run commands from within a package directory - always use the monorepo root
- ❌ **DO NOT** ignore dependency order - packages must be checked after their dependencies pass
