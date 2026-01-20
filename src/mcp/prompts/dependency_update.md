Update dependencies to the latest published versions from npmjs for configured scopes and the package's own scope.

**CRITICAL RULES:**
- NEVER update to dev-tagged versions (e.g., `-dev.0`, `-dev.1`, `-alpha`, `-beta`, `-rc`)
- Projects should NEVER depend on dev versions - they should use `kodrdriv link` for local development
- Only update to stable, published versions available on npmjs

## Determining Tree vs Single-Package Operation

**Important**: Before proceeding, determine if this is a tree operation or a single-package operation:

- **Tree Operation**: If the current directory contains subdirectories with `package.json` files, this is a monorepo/tree operation. Use `kodrdriv_tree_updates` command.
- **Single-Package Operation**: If the directory is a leaf project (single package without subdirectories containing `package.json`), this is NOT a tree operation. Use `kodrdriv_updates` command instead.

**Workflow:**

### For Tree Operations (Monorepo)

1. Determine which scopes to update:
   - Check configuration for `updates.scopes` or `publish.scopedDependencyUpdates`
   - If the current package has a scope (e.g., `@eldrforge/my-package`), include that scope
   - Use all configured scopes plus the package's own scope

2. Run `kodrdriv_tree_updates`:
   - This uses npm-check-updates to find latest versions matching the scope pattern across all packages in the tree
   - Updates only packages published on npmjs (not dev versions)
   - Updates dependencies, devDependencies, and peerDependencies sections

3. After updates:
   - Run `npm install` in each updated package to update package-lock.json
   - Review changes to ensure no dev versions were introduced
   - Run `kodrdriv_tree_precommit` to verify everything still works across the tree
     - **Note**: If precommit fails due to coverage threshold issues and the project uses lcov format, consider using the `brennpunkt` MCP server tools to analyze coverage gaps and prioritize test improvements. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`
   - Commit the changes with `kodrdriv_tree_commit`

### For Single-Package Operations (Leaf Project)

1. Determine which scopes to update:
   - Check configuration for `updates.scopes` or `publish.scopedDependencyUpdates`
   - If the current package has a scope (e.g., `@eldrforge/my-package`), include that scope
   - Use all configured scopes plus the package's own scope

2. Run `kodrdriv_updates`:
   - This uses npm-check-updates to find latest versions matching the scope pattern for the single package
   - Updates only packages published on npmjs (not dev versions)
   - Updates dependencies, devDependencies, and peerDependencies sections

3. After updates:
   - Run `npm install` to update package-lock.json
   - Review changes to ensure no dev versions were introduced
   - Run `kodrdriv_precommit` to verify everything still works
     - **Note**: If precommit fails due to coverage threshold issues and the project uses lcov format, consider using the `brennpunkt` MCP server tools to analyze coverage gaps and prioritize test improvements. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`
   - Commit the changes with `kodrdriv_commit`

**Example:**
If package is `@eldrforge/my-package` and config has `scopedDependencyUpdates: ["@riotprompt"]`, update:
- `@eldrforge/*` dependencies (package's own scope)
- `@riotprompt/*` dependencies (configured scope)

**Verification:**
- Check that no dependencies were updated to versions containing `-dev`, `-alpha`, `-beta`, or `-rc`
- If any dev versions are found, they should be removed and replaced with `kodrdriv link` workflow instead
