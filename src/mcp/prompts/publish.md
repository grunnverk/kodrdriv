# Publish Workflow

## Objective

Execute a complete publishing workflow for a single package. Handle errors gracefully, fix issues as they arise, and resume appropriately.

## Prerequisites

Before proceeding, fetch the workspace resource to confirm this is a single-package operation:

**Workspace Resource**: `kodrdriv://workspace[/path/to/directory]`
- Confirms this is a single-package operation (`packages.length === 1`)
- Provides package information (name, version, path)

## Pre-Publish Verification

Before running `kodrdriv_publish`, verify that `kodrdriv_precommit` works successfully.

**Exception**: If `fix_and_commit` was just executed successfully, you can skip the precommit check and proceed directly to publish. The `fix_and_commit` workflow already ensures all precommit checks pass.

## Publishing Workflow

1. **Run Publish**
   - Execute `kodrdriv_publish` with appropriate parameters
   - The command will start generating output

2. **Monitor for Errors**
   - Watch for errors:
     - **GitHub Actions/Workflows errors**: Build failures, test failures, or validation errors in Pull Requests
     - **Git conflicts**: Merge conflicts or branch state issues
     - **Precondition check failures**: Version conflicts, branch state issues, or dependency problems

3. **Handle Pull Request Errors**
   - If an error occurs during Pull Request validation:
     - The error message will typically include a link to the failing PR or workflow
     - Navigate to the provided link and investigate the build/test errors
     - Fix the issues in the codebase
       - **Tip**: If test failures are related to coverage thresholds and the project uses lcov format, consider using the `brennpunkt` MCP server tools (e.g., `brennpunkt_get_priorities`, `brennpunkt_coverage_summary`) to identify which files need test coverage improvements. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`
     - Commit and push the fixes
     - Simply restart `kodrdriv_publish` - the system will automatically check if a Pull Request exists and resume appropriately
     - **Note**: Single-package publish does not use the `continue` parameter

4. **Handle Release Workflow Errors**
   - If an error occurs while waiting for a Release Workflow:
     - This indicates a more serious problem
     - Ask the user how to proceed
     - The system may be in an inconsistent state that requires manual intervention

5. **Handle Precondition Check Failures**
   - If precondition checks fail (version conflicts, branch state, etc.):
     - Analyze the error message to understand what needs to be fixed
     - Fix the underlying issues
     - Re-run `kodrdriv_publish`

## Error Resolution Strategy

### When Errors Occur

1. **Read the Error Message Carefully**
   - Error messages typically indicate:
     - What type of error occurred
     - Where to look for more information (PR links, file paths, etc.)

2. **Investigate the Root Cause**
   - For GitHub workflow errors: Check the PR/workflow logs
   - For Git errors: Check branch state, conflicts, or merge issues
   - For precondition errors: Check version numbers, branch names, or dependency states

3. **Fix the Issues**
   - Make necessary code changes
   - Fix version conflicts
   - Resolve Git conflicts
   - Update dependencies if needed

4. **Commit and Push**
   - Commit fixes with appropriate messages
   - Push changes to trigger re-validation

5. **Resume Appropriately**
   - Simply restart `kodrdriv_publish` - the system will automatically detect existing PRs and resume appropriately

## Expected End State

After a successful publish workflow, the project should end up in a "working" branch with:
- An incremented version number
- A dev tag (e.g., `1.2.3-dev.0`)

**Note**: This is information for verification purposes. The publish workflow handles versioning automatically - you don't need to manually manage versions or tags.

## Important Notes

- **Don't Skip Precommit**: Unless `fix_and_commit` was just run, always verify precommit checks pass before publishing.
- **Error Links**: When GitHub errors occur, they often provide direct links to PRs or workflows - use these to understand what needs fixing.
- **Resume Strategy**: Simply restart `kodrdriv_publish` - the system will automatically detect existing PRs and resume appropriately.

## Example Flow

```
1. Fetch kodrdriv://workspace/path/to/package
   → Confirms this is a single package

2. Run kodrdriv_precommit (unless fix_and_commit was just run)

3. Run kodrdriv_publish
   → Error: PR validation failed
   → Link provided: https://github.com/org/repo/pull/456

4. Investigate PR #456 → Find linting error

5. Fix the linting error → Commit and push

6. Run kodrdriv_publish again
   → System detects existing PR and resumes appropriately

7. Monitor for completion
```
