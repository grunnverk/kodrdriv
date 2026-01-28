Update dependencies to the latest published versions from npmjs for configured scopes and the package's own scope.

**CRITICAL RULES:**
- NEVER update to dev-tagged versions (e.g., `-dev.0`, `-dev.1`, `-alpha`, `-beta`, `-rc`)
- Projects should NEVER depend on dev versions - they should use `kodrdriv link` for local development
- Only update to stable, published versions available on npmjs

## Prerequisites

Before proceeding, fetch these resources to understand the project structure and configuration:

1. **Workspace Resource**: `kodrdriv://workspace[/path/to/directory]`
   - Determines if this is a tree (monorepo) or single-package operation
   - If `packages.length > 1`, use tree commands
   - If `packages.length === 1`, use single-package commands

2. **Config Resource**: `kodrdriv://config[/path/to/directory]`
   - Provides `updates.scopes` or `publish.scopedDependencyUpdates` configuration
   - Determines which scopes to update

## Workflow

### Step 1: Determine Operation Type and Scopes

Fetch the workspace and config resources:
- `kodrdriv://workspace[/path/to/directory]` → Check `packages.length`
- `kodrdriv://config[/path/to/directory]` → Check `config.updates.scopes` or `config.publish.scopedDependencyUpdates`

If the current package has a scope (e.g., `@grunnverk/my-package`), include that scope along with configured scopes.

### Step 2: Run Updates

**For Tree Operations** (packages.length > 1):
- Run `kodrdriv_tree_updates`:
  - Pass the scopes from config: `{"directory": "/path/to/monorepo", "scopes": [<scopes from config>]}`
  - Or single scope: `{"directory": "/path/to/monorepo", "scope": "<scope from config>"}`
  - Updates all packages in the tree using npm-check-updates
  - Updates only packages published on npmjs (not dev versions)

**For Single-Package Operations** (packages.length === 1):
- Run `kodrdriv_updates`:
  - Pass the scopes from config: `{"directory": "/path/to/package", "scopes": [<scopes from config>]}`
  - Or single scope: `{"directory": "/path/to/package", "scope": "<scope from config>"}`
  - Updates the single package using npm-check-updates
  - Updates only packages published on npmjs (not dev versions)

### Step 3: Post-Update Actions

**For Tree Operations:**
1. Run `npm install` in each updated package to update package-lock.json
2. Review changes to ensure no dev versions were introduced
3. Run `kodrdriv_tree_precommit` to verify everything still works across the tree
   - **Note**: If precommit fails due to coverage threshold issues and the project uses lcov format, consider using the `brennpunkt` MCP server tools to analyze coverage gaps and prioritize test improvements. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`
4. Commit the changes with `kodrdriv_tree_commit`

**For Single-Package Operations:**
1. Run `npm install` to update package-lock.json
2. Review changes to ensure no dev versions were introduced
3. Run `kodrdriv_precommit` to verify everything still works
   - **Note**: If precommit fails due to coverage threshold issues and the project uses lcov format, consider using the `brennpunkt` MCP server tools to analyze coverage gaps and prioritize test improvements. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`
4. Commit the changes with `kodrdriv_commit`

## Example

If package is `@myorg/my-package` and config has `scopedDependencyUpdates: ["@external-scope"]`:

1. Fetch `kodrdriv://workspace/path/to/package` → `{ packages: [{ name: "@myorg/my-package", ... }] }`
2. Fetch `kodrdriv://config/path/to/package` → `{ config: { publish: { scopedDependencyUpdates: ["@external-scope"] } } }`
3. Update scopes: `["@myorg", "@external-scope"]` (package's own scope + configured scopes)
4. Since `packages.length === 1`, run `kodrdriv_updates` with these scopes

## Verification

- Check that no dependencies were updated to versions containing `-dev`, `-alpha`, `-beta`, or `-rc`
- If any dev versions are found, they should be removed and replaced with `kodrdriv link` workflow instead
