# Check Development Readiness

## Objective

Verify that projects are ready for development work before starting coding. This ensures you're working with:
1. The correct branch (not `main` or `master`)
2. The latest code from remote
3. Proper development versions
4. Linked local dependencies

## Prerequisites

Before running checks, fetch these resources to understand the project:

1. **Workspace Resource**: `kodrdriv://workspace[/path/to/directory]`
   - Determines if this is a tree (monorepo) or single-package operation
   - If `packages.length > 1`, this is a tree operation
   - If `packages.length === 1`, this is a single-package operation

2. **Status Resource**: `kodrdriv://status[/path/to/directory]`
   - Provides current git status including branch, staged/modified files, and sync status
   - Use this to understand the current state before running checks

## Usage

Use the `kodrdriv_check_development` tool to perform comprehensive checks. The tool automatically detects whether you're working with a single package or a monorepo tree based on the workspace structure.

```
kodrdriv_check_development --directory <path>
```

## What Gets Checked

### 1. Branch Status
- Verifies packages are not on `main` or `master` branches
- Development should happen on `working` or feature branches
- **Why**: Prevents accidental commits to protected branches

### 2. Remote Sync Status
- Checks if local branches are up to date with remote
- Detects if you're behind the remote branch
- **Why**: Ensures you have the latest changes before starting work

### 3. Development Version Status
- Verifies packages have dev version tags (e.g., `1.2.3-dev.0`)
- Checks if base versions conflict with published npm packages
- **Why**: Distinguishes development versions from releases and prevents version conflicts

### 4. Link Status
- Checks if local scoped dependencies are properly linked
- Verifies symlinks for cross-package development
- **Why**: Ensures changes in one package are immediately reflected in dependent packages

## Interpreting Results

The tool returns a structured result with:
- `ready`: Boolean indicating if all checks passed
- `isTree`: Whether this is a monorepo or single package
- `packagesChecked`: Number of packages examined
- `checks`: Detailed results for each check category

Each check category includes:
- `passed`: Boolean indicating if the check passed
- `issues`: Array of specific problems found

## Fixing Issues

When issues are found, the tool output will indicate which checks failed. Here's how to address them:

### Branch Issues
If packages are on `main` or `master`:
- Switch to `working` branch: `git checkout working`
- Or create a feature branch: `git checkout -b feature/my-feature`

### Remote Sync Issues
If packages are behind remote:
- Fetch `kodrdriv://workspace[/path]` to determine operation type
- Single package: Use `kodrdriv_pull`
- Tree: Use `kodrdriv_tree_pull`

### Dev Version Issues
If packages lack dev versions or have conflicts:
- Run `kodrdriv_development` to transition to development mode
- This tags the current version and bumps to the next dev version

### Link Issues
If local dependencies aren't linked:
- Fetch `kodrdriv://workspace[/path]` to determine operation type
- Single package: Use `kodrdriv_link` (not yet implemented as MCP tool)
- Tree: Use `kodrdriv_tree_link`

## When to Use This

Run this check:
- **Before starting new development work** - ensures clean starting state
- **After switching branches** - verifies branch setup
- **After pulling changes** - confirms everything is in sync
- **When debugging dependency issues** - checks link status

## Example Output

### All Checks Passed
```json
{
  "ready": true,
  "isTree": true,
  "packagesChecked": 5,
  "checks": {
    "branch": { "passed": true, "issues": [] },
    "remoteSync": { "passed": true, "issues": [] },
    "devVersion": { "passed": true, "issues": [] },
    "linkStatus": { "passed": true, "issues": [] }
  }
}
```

### Issues Found
```json
{
  "ready": false,
  "isTree": true,
  "packagesChecked": 5,
  "checks": {
    "branch": {
      "passed": false,
      "issues": ["@grunnverk/core is on main branch"]
    },
    "remoteSync": {
      "passed": false,
      "issues": ["@grunnverk/git-tools is 3 commits behind remote"]
    },
    "devVersion": {
      "passed": false,
      "issues": [
        "@grunnverk/core has non-dev version: 1.2.3",
        "@grunnverk/audio-tools: Base version 1.0.4 already published (current: 1.0.4-dev.0)"
      ]
    },
    "linkStatus": {
      "passed": false,
      "issues": ["@grunnverk/commands-git: Scoped dependencies not linked: @grunnverk/core"]
    }
  }
}
```
