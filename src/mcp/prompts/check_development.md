# Check Development Readiness

## Objective

Verify that projects are ready for development work before starting coding. This ensures you're working with:
1. The correct branch (not `main` or `master`)
2. The latest code from remote
3. Proper development versions
4. Linked local dependencies

Optionally, validate release workflow readiness by checking:
5. Merge conflicts with target branch (main)
6. Open PRs that could block publish operations

## Execution Pattern (CRITICAL)

**When this prompt is invoked, you MUST:**

1. **Identify the scope** from the user's workspace structure
   - Look at all workspace paths provided in the user context
   - Identify ALL project directories that should be checked

2. **Execute checks in parallel** for ALL identified projects
   - Use a single batch of parallel tool calls
   - Call `kodrdriv_check_development` for each project simultaneously
   - DO NOT execute sequentially - this defeats the purpose

3. **Generate visual output** showing results for all projects
   - Create a table with columns: Project | Branch | Remote Sync | Merge Conflicts | Dev Version | Link Status | Overall
   - Use ✅ for passed checks, ❌ for failures, ⚠️ for warnings
   - List all issues found below the table
   - Include a summary showing X/Y projects ready

**Example execution for grunnverk workspace:**
```
// Step 1: Identify all projects
const projects = [
  '/Users/tobrien/gitw/grunnverk/kilde',
  '/Users/tobrien/gitw/grunnverk/kodrdriv',
  '/Users/tobrien/gitw/grunnverk/ai-service',
  // ... all other projects
];

// Step 2: Execute in parallel (single batch)
await Promise.all(
  projects.map(dir => kodrdriv_check_development({ directory: dir }))
);

// Step 3: Generate table with all results
```

This is NOT optional - always check all projects and present the visual table.

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

### Quick Check (Default)
For fast development readiness verification:
```
kodrdriv_check_development --directory <path>
```

### Full Release Validation
For comprehensive pre-release validation including merge conflicts and open PRs:
```
kodrdriv_check_development --directory <path> --validateRelease true
```

**When to use each mode:**
- **Quick check** (`validateRelease: false`): Before starting development work, after pulling changes, when debugging dependencies
- **Full validation** (`validateRelease: true`): Before publishing, before creating a release, when preparing for a merge to main

### Checking Multiple Projects (MANDATORY BEHAVIOR)

**This prompt REQUIRES checking ALL workspace projects in parallel. This is NOT optional.**

**Required steps:**

1. **Scan workspace paths** - Extract all project directories from the user's workspace context
   - Look for directories with `package.json` files
   - Exclude `node_modules`, `docs/`, `doc/`, `examples/`, `test-*/`, and other non-project directories

2. **Execute parallel checks** - Call `kodrdriv_check_development` for ALL projects in a single batch
   ```typescript
   // REQUIRED: Single batch of parallel calls
   CallMcpTool('kodrdriv_check_development', { directory: '/path/to/project1' })
   CallMcpTool('kodrdriv_check_development', { directory: '/path/to/project2' })
   CallMcpTool('kodrdriv_check_development', { directory: '/path/to/project3' })
   // ... all projects in same message
   ```

3. **Generate status table** - Present results in the specified visual format (see below)

**NEVER:**
- Check only a single project when multiple exist
- Execute checks sequentially (one at a time)
- Skip the visual table output

### Visual Output Format

After checking multiple projects, present results in a clear table format:

```
## 📊 Development Readiness Status

| Project | Branch | Remote | Conflicts | Dev Ver | Links | Overall |
|---------|--------|--------|-----------|---------|-------|---------|
| kilde   | ✅     | ✅     | ✅        | ✅      | ✅    | ✅ READY |
| kodrdriv| ✅     | ✅     | ✅        | ✅      | ✅    | ✅ READY |
| audio   | ✅     | ✅     | ✅        | ❌      | ⚠️    | ❌ ISSUES|

### 🔴 Issues Found
- **audio-tools**: Dev version missing, links not configured
```

This visual format makes it immediately clear which projects need attention.

### Error Resilience

**When checking multiple projects in parallel, handle failures gracefully:**

1. **Continue on individual failures** - If one project check fails or times out, continue processing others
2. **Report partial results** - Show successful checks even if some failed
3. **Indicate failures clearly** - Mark failed checks with ⚠️ or ❌ and explain the error
4. **Provide actionable guidance** - Suggest how to investigate or fix the failure

**Example handling:**
```
| audio-tools | ⚠️ CHECK FAILED | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ ERROR |

### ⚠️ Check Errors
- **audio-tools**: Check timed out or failed - investigate manually
```

Never let one project's failure prevent checking the others. Parallel execution should be resilient to individual failures.

## What Gets Checked

### Always Checked (Quick & Full)

#### 1. Branch Status
- Verifies packages are not on `main` or `master` branches
- Development should happen on `working` or feature branches
- **Why**: Prevents accidental commits to protected branches

#### 2. Remote Sync Status
- Checks if local branches are up to date with remote
- Detects if you're behind the remote branch
- **Why**: Ensures you have the latest changes before starting work

#### 3. Development Version Status
- Verifies packages have dev version tags (e.g., `1.2.3-dev.0`)
- Checks if base versions conflict with published npm packages
- **Why**: Distinguishes development versions from releases and prevents version conflicts

#### 4. Link Status (Warning Only)
- Checks if local scoped dependencies are properly linked
- Verifies symlinks for cross-package development
- **Why**: Ensures changes in one package are immediately reflected in dependent packages
- **Note**: This is a recommendation, not a requirement

### Only Checked with `validateRelease: true`

#### 5. Merge Conflicts
- Tests if working branch can merge cleanly into `main`
- Detects conflicts that would block publish operations
- **Why**: Identifies merge issues before attempting to publish
- **Note**: This check modifies git state temporarily but always cleans up

#### 6. Open Pull Requests
- Checks for open PRs from the current branch
- Warns about PRs that could cause conflicts during publish
- **Why**: Prevents publishing when there are unmerged changes
- **Note**: Requires GitHub API access via GITHUB_TOKEN

## Interpreting Results

The tool returns a structured result with:
- `ready`: Boolean indicating if all checks passed
- `isTree`: Whether this is a monorepo or single package
- `packagesChecked`: Number of packages examined
- `releaseValidation`: Boolean indicating if full release validation was performed
- `checks`: Detailed results for each check category

Each check category includes:
- `passed`: Boolean indicating if the check passed
- `issues`: Array of specific problems found
- `warnings`: Array of non-blocking warnings (when applicable)

**Note**: When `validateRelease: false`, the `mergeConflicts` and `openPRs` checks are not included in the results.

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

### Quick Check (Default)
Run without `validateRelease`:
- **Before starting new development work** - ensures clean starting state
- **After switching branches** - verifies branch setup
- **After pulling changes** - confirms everything is in sync
- **When debugging dependency issues** - checks link status

### Full Validation
Run with `validateRelease: true`:
- **Before publishing packages** - ensures release readiness
- **Before creating a release** - validates merge and PR status
- **When preparing to merge to main** - detects conflicts early
- **During CI/CD pre-publish checks** - comprehensive validation

## Example Output

### Quick Check - All Passed
```json
{
  "ready": true,
  "isTree": false,
  "packagesChecked": 1,
  "releaseValidation": false,
  "checks": {
    "branch": { "passed": true, "issues": [] },
    "remoteSync": { "passed": true, "issues": [] },
    "devVersion": { "passed": true, "issues": [] },
    "linkStatus": {
      "passed": true,
      "issues": [],
      "warnings": []
    }
  }
}
```

### Full Validation - All Passed
```json
{
  "ready": true,
  "isTree": true,
  "packagesChecked": 5,
  "releaseValidation": true,
  "checks": {
    "branch": { "passed": true, "issues": [] },
    "remoteSync": { "passed": true, "issues": [] },
    "mergeConflicts": {
      "passed": true,
      "issues": [],
      "warnings": []
    },
    "devVersion": { "passed": true, "issues": [] },
    "linkStatus": {
      "passed": true,
      "issues": [],
      "warnings": []
    },
    "openPRs": {
      "passed": true,
      "issues": [],
      "warnings": []
    }
  }
}
```

### Issues Found (Quick Check)
```json
{
  "ready": false,
  "isTree": true,
  "packagesChecked": 5,
  "releaseValidation": false,
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
      "passed": true,
      "issues": [],
      "warnings": ["@grunnverk/commands-git: Local dependencies not linked (recommended): @grunnverk/core"]
    }
  }
}
```

### Issues Found (Full Validation)
```json
{
  "ready": false,
  "isTree": true,
  "packagesChecked": 5,
  "releaseValidation": true,
  "checks": {
    "branch": { "passed": true, "issues": [] },
    "remoteSync": { "passed": true, "issues": [] },
    "mergeConflicts": {
      "passed": false,
      "issues": ["@grunnverk/core: Merge conflicts detected with main branch"],
      "warnings": []
    },
    "devVersion": { "passed": true, "issues": [] },
    "linkStatus": {
      "passed": true,
      "issues": [],
      "warnings": []
    },
    "openPRs": {
      "passed": false,
      "issues": ["@grunnverk/core: PR #123: Fix bug (https://github.com/owner/repo/pull/123)"],
      "warnings": []
    }
  }
}
```
