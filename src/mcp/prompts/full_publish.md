# Full Publish Workflow

## Objective

Execute a complete publishing workflow for either a monorepo tree or a single package. Handle errors gracefully, fix issues as they arise, and resume from checkpoints when appropriate.

## Determining Tree vs Single-Package Operation

**Critical First Step**: Before proceeding, determine if this is a tree operation or a single-package operation:

- **Tree Operation**: If the directory contains subdirectories with `package.json` files, this is a monorepo/tree operation. Use `kodrdriv_tree_publish` command.
- **Single-Package Operation**: If the directory is a leaf project (single package without subdirectories containing `package.json`), this is NOT a tree operation. Use `kodrdriv_publish` command instead.

## Pre-Publish Verification

### For Tree Operations

**Important**: Before running `kodrdriv_tree_publish`, verify that `kodrdriv_tree_precommit` works successfully.

**Exception**: If `fix_and_commit` was just executed successfully, you can skip the precommit check and proceed directly to publish. The `fix_and_commit` workflow already ensures all precommit checks pass.

### For Single-Package Operations

Before running `kodrdriv_publish`, verify that `kodrdriv_precommit` works successfully.

**Exception**: If `fix_and_commit` was just executed successfully, you can skip the precommit check and proceed directly to publish.

## Publishing Workflow

### For Tree Operations (Monorepo)

**CRITICAL: Maintain Tree Publish Context**

Once you start a `kodrdriv_tree_publish` operation, you establish a context file that facilitates coordinated version updates across all projects in the monorepo. **DO NOT switch between tree and single-package operations** during a publish workflow.

- **If tree publish fails**: Fix the problem at the failing package, then return to the **top-level directory** and run `kodrdriv_tree_publish` with `continue: true`
- **NEVER switch to `kodrdriv_publish`** in a subproject when recovering from a tree publish failure
- The context file created by tree publish tracks version coordination across packages - switching to single-package publish breaks this coordination

1. **Run Tree Publish**
   - Execute `kodrdriv_tree_publish` with appropriate parameters
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

### For Single-Package Operations

1. **Run Publish**
   - Execute `kodrdriv_publish` with appropriate parameters
   - The command will start generating output

2. **Monitor for Errors**
   - Watch for the same types of errors as tree operations:
     - GitHub Actions/Workflows errors
     - Git conflicts
     - Precondition check failures

3. **Handle Pull Request Errors**
   - If an error occurs during Pull Request validation:
     - Fix the issues in the codebase
       - **Tip**: If test failures are related to coverage thresholds and the project uses lcov format, consider using the `brennpunkt` MCP server tools (e.g., `brennpunkt_get_priorities`, `brennpunkt_coverage_summary`) to identify which files need test coverage improvements. Install brennpunkt as an MCP server with: `npx -y -p @redaksjon/brennpunkt brennpunkt-mcp`
     - Commit and push the fixes
     - Simply restart `kodrdriv_publish` - the system will automatically check if a Pull Request exists and resume appropriately
     - **Note**: Single-package publish does not use the `continue` parameter

4. **Handle Other Errors**
   - For Release Workflow errors or precondition check failures, follow the same approach as tree operations

## Error Resolution Strategy

### When Errors Occur

1. **Read the Error Message Carefully**
   - Error messages typically indicate:
     - Which package failed (for tree operations)
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
   - **Tree operations**: Return to the **top-level directory** and use `kodrdriv_tree_publish` with `continue: true` during PR wait phase
     - **CRITICAL**: Do NOT switch to `kodrdriv_publish` in a subproject - this breaks the tree publish context
   - **Single-package operations**: Simply restart `kodrdriv_publish`

## Expected End State

After a successful publish workflow, projects should end up in a "working" branch with:
- An incremented version number
- A dev tag (e.g., `1.2.3-dev.0`)

**Note**: This is information for verification purposes. The publish workflow handles versioning automatically - you don't need to manually manage versions or tags.

## Important Notes

- **Maintain Tree Publish Context**: Once you start `kodrdriv_tree_publish`, you establish a context file that coordinates version updates across projects. If tree publish fails, fix the issue and return to the top-level directory to run `kodrdriv_tree_publish` with `continue: true`. **NEVER switch to `kodrdriv_publish` in a subproject** - this breaks version coordination.
- **Checkpoint Recovery**: The `continue` parameter for tree operations only works during Pull Request validation waits. It does NOT work for Release Workflow errors.
- **Don't Skip Precommit**: Unless `fix_and_commit` was just run, always verify precommit checks pass before publishing.
- **Error Links**: When GitHub errors occur, they often provide direct links to PRs or workflows - use these to understand what needs fixing.
- **Single vs Tree**: The key difference is detection of subdirectories with `package.json` files - this determines which command to use. Once you choose tree publish, stay in that context.
- **Resume Strategy**: Tree operations use `continue: true` to resume from checkpoints at the **top-level directory**; single-package operations simply restart the publish command.

## Example Flow (Tree Operation)

```
1. Check for subdirectories with package.json → Tree operation detected
2. Run kodrdriv_tree_precommit (unless fix_and_commit was just run)
3. Run kodrdriv_tree_publish
   → Error: PR validation failed for @org/package-a
   → Link provided: https://github.com/org/repo/pull/123
4. Investigate PR #123 → Find failing test
5. Fix the test → Commit and push
6. **Return to top-level directory** → Run kodrdriv_tree_publish({ continue: true })
   → Resumes from checkpoint, continues processing with maintained context
7. Monitor for additional errors or completion
```

## Example Flow (Single-Package Operation)

```
1. Check for subdirectories with package.json → None found, single package
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
