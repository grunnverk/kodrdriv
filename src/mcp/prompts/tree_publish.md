# Tree Publish Workflow

## Objective

Execute a complete publishing workflow for a monorepo tree. Handle errors gracefully, fix issues as they arise, and resume from checkpoints when appropriate.

## Prerequisites

Before proceeding, fetch the workspace resource to understand the monorepo structure:

**Workspace Resource**: `kodrdriv://workspace[/path/to/directory]`
- Confirms this is a tree operation (`packages.length > 1`)
- Provides the list of all packages in the monorepo
- Shows the root directory and dependency relationships

## Pre-Publish Verification

**Important**: Before running `kodrdriv_tree_publish`, verify that `kodrdriv_tree_precommit` works successfully.

**DEFAULT: Use `parallel=true`** when running `kodrdriv_tree_precommit` - this is the default and recommended setting. It dramatically speeds up execution for large monorepos (reduces time from 20-30 minutes to 5-10 minutes).

**Exception**: If `tree_fix_and_commit` was just executed successfully, you can skip the precommit check and proceed directly to publish. The `tree_fix_and_commit` workflow already ensures all precommit checks pass.

## Publishing Workflow

**CRITICAL: Maintain Tree Publish Context**

Once you start a `kodrdriv_tree_publish` operation, you establish a context file that facilitates coordinated version updates across all projects in the monorepo. **DO NOT switch between tree and single-package operations** during a publish workflow.

- **If tree publish fails**: Fix the problem at the failing package, then return to the **top-level directory** and run `kodrdriv_tree_publish` with `continue: true`
- **NEVER switch to `kodrdriv_publish`** in a subproject when recovering from a tree publish failure
- The context file created by tree publish tracks version coordination across packages - switching to single-package publish breaks this coordination

1. **Run Tree Publish**
   - Execute `kodrdriv_tree_publish` with appropriate parameters
   - **DEFAULT: `parallel=true`** - Use parallel mode by default to speed up execution significantly
   - If specific packages are provided (${packages}), use the `packages` parameter to target only those packages
   - The command will start generating output as it processes packages in dependency order
   - This creates a context file that tracks version updates across the entire tree

2. **Monitor for Errors**
   - Watch the output carefully for errors
   - Common error sources:
     - **GitHub Actions/Workflows**: Build failures, test failures, or validation errors in Pull Requests
     - **Git Conflicts**: Merge conflicts or branch state issues
     - **Precondition Checks**: Version conflicts, branch state issues, or dependency problems

3. **Handle Pull Request Errors**
   - If an error occurs during Pull Request validation:
     - The error message will typically include a link to the failing PR or workflow
     - Navigate to the provided link and investigate the build/test errors
     - Fix the issues in the codebase
       - **Tip**: If test failures are related to coverage thresholds and the project uses lcov format, consider using the `brennpunkt` MCP server tools (e.g., `brennpunkt_get_priorities`, `brennpunkt_coverage_summary`) to identify which files need test coverage improvements. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`
     - Commit and push the fixes
     - Once the PR starts re-validating, use `kodrdriv_tree_publish` with `continue: true` to resume from the checkpoint
     - **Important**: The `continue` parameter only works during the Pull Request wait phase

4. **Handle Release Workflow Errors**
   - If an error occurs while waiting for a Release Workflow:
     - This indicates a more serious problem
     - **Do NOT attempt to use `continue`** - ask the user how to proceed
     - The system may be in an inconsistent state that requires manual intervention

5. **Handle Precondition Check Failures**
   - If precondition checks fail (version conflicts, branch state, etc.):
     - Analyze the error message to understand what needs to be fixed
     - Fix the underlying issues
     - Re-run `kodrdriv_tree_publish` (you may need to use `continue: true` if a checkpoint exists)

## Error Resolution Strategy

### When Errors Occur

1. **Read the Error Message Carefully**
   - Error messages typically indicate:
     - Which package failed
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
   - Return to the **top-level directory** and use `kodrdriv_tree_publish` with `continue: true` during PR wait phase
     - **CRITICAL**: Do NOT switch to `kodrdriv_publish` in a subproject - this breaks the tree publish context

## Expected End State

After a successful publish workflow, projects should end up in a "working" branch with:
- An incremented version number
- A dev tag (e.g., `1.2.3-dev.0`)

**Note**: This is information for verification purposes. The publish workflow handles versioning automatically - you don't need to manually manage versions or tags.

## Important Notes

- **Parallel Execution (DEFAULT)**: `parallel=true` is the default and recommended setting for both `kodrdriv_tree_precommit` and `kodrdriv_tree_publish` - it dramatically reduces execution time. Always use it unless you have a specific reason not to.
- **Maintain Tree Publish Context**: Once you start `kodrdriv_tree_publish`, you establish a context file that coordinates version updates across projects. If tree publish fails, fix the issue and return to the top-level directory to run `kodrdriv_tree_publish` with `continue: true`. **NEVER switch to `kodrdriv_publish` in a subproject** - this breaks version coordination.
- **Checkpoint Recovery**: The `continue` parameter only works during Pull Request validation waits. It does NOT work for Release Workflow errors.
- **Don't Skip Precommit**: Unless `fix_and_commit` was just run, always verify precommit checks pass before publishing.
- **Error Links**: When GitHub errors occur, they often provide direct links to PRs or workflows - use these to understand what needs fixing.
- **Resume Strategy**: Use `continue: true` to resume from checkpoints at the **top-level directory**.

## Example Flow

```
1. Fetch kodrdriv://workspace/path/to/monorepo
   → Confirms this is a tree with multiple packages

2. Run kodrdriv_tree_precommit({ parallel: true }) (unless fix_and_commit was just run)
   → DEFAULT: parallel=true speeds up execution significantly (20-30 min → 5-10 min)

3. Run kodrdriv_tree_publish({ parallel: true })
   → DEFAULT: Use parallel mode for faster execution
   → Error: PR validation failed for @org/package-a
   → Link provided: https://github.com/org/repo/pull/123

4. Investigate PR #123 → Find failing test

5. Fix the test → Commit and push

6. **Return to top-level directory** → Run kodrdriv_tree_publish({ continue: true, parallel: true })
   → Resumes from checkpoint with parallel mode, continues processing with maintained context

7. Monitor for additional errors or completion
```
