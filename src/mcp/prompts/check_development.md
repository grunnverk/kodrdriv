# Check Development Readiness

## Objective

Verify that projects are ready for development work. This prompt provides a comprehensive check to ensure:
1. No projects are on the main branch
2. All repositories have pulled the latest changes from remote
3. Packages are on dev tag versions locally
4. Local packages are linked via `kodrdriv link` or `kodrdriv tree link`

This is a quick verification step before starting development work to ensure you're working with the latest code and proper local dependencies.

## Determining Tree vs Single-Package Operation

**Important**: Before proceeding, determine if this is a tree operation or a single-package operation:

- **Tree Operation**: If the directory (${directory}) contains subdirectories with `package.json` files, this is a monorepo/tree operation. Check all packages in the tree.
- **Single-Package Operation**: If the directory is a leaf project (single package without subdirectories containing `package.json`), check only this single package.

## Workflow Steps

### For Tree Operations (Monorepo)

1. **Check Branch Status**
   - For each package in the tree, check the current git branch
   - Use `git branch --show-current` or `getGitStatusSummary()` from `@grunnverk/git-tools` to get the current branch
   - **Fail if any package is on `main` or `master` branch** - these should be on `working` or a feature branch
   - Report which packages are on the wrong branch

2. **Check Remote Sync Status**
   - For each package, check if the local branch is up to date with remote
   - Use `git fetch` first to update remote refs
   - Compare local branch with `origin/{branch}` using `git rev-parse` or `git status`
   - **Fail if any package is behind remote** - run `kodrdriv_tree_pull` to sync
   - Report which packages need to pull changes

3. **Check Dev Version Status**
   - For each package, read `package.json` and check the version field
   - Verify that versions contain a dev tag (e.g., `1.2.3-dev.0`, `0.5.1-dev.2`)
   - Use `isDevelopmentVersion()` from `@grunnverk/core` if available, or check for patterns like `-dev.`, `-alpha`, `-beta`, `-rc`
   - **Fail if any package has a non-dev version** (e.g., `1.2.3` without `-dev.0`) - this suggests the package needs `kodrdriv development` run
   - Report which packages have incorrect version formats

4. **Check Link Status**
   - For each package, check if local dependencies are properly linked
   - Use `getGloballyLinkedPackages()` and `getLinkedDependencies()` from `@grunnverk/git-tools` to check link status
   - Alternatively, check `node_modules` for symlinks pointing to local packages
   - Check `package.json` dependencies - if they reference scoped packages (e.g., `@grunnverk/*`), verify they're linked, not using registry versions
   - **Fail if local dependencies are not linked** - run `kodrdriv_tree_link` to set up local links
   - Report which packages need linking

5. **Summary Report**
   - Provide a clear summary of all checks
   - List any failures with specific packages and what needs to be fixed
   - If all checks pass, confirm that the project is ready for development

### For Single-Package Operations (Leaf Project)

1. **Check Branch Status**
   - Check the current git branch using `git branch --show-current` or `getGitStatusSummary()`
   - **Fail if on `main` or `master` branch** - should be on `working` or a feature branch
   - Report the current branch

2. **Check Remote Sync Status**
   - Run `git fetch` to update remote refs
   - Compare local branch with `origin/{branch}` using `git rev-parse` or `git status`
   - **Fail if behind remote** - run `kodrdriv_pull` to sync
   - Report sync status

3. **Check Dev Version Status**
   - Read `package.json` and check the version field
   - Verify that version contains a dev tag (e.g., `1.2.3-dev.0`)
   - **Fail if version is not a dev version** - run `kodrdriv development` to update
   - Report the current version

4. **Check Link Status**
   - Check if local dependencies are properly linked
   - Use `getLinkedDependencies()` from `@grunnverk/git-tools` to check link status
   - Check `node_modules` for symlinks pointing to local packages
   - Check `package.json` dependencies - if they reference scoped packages, verify they're linked
   - **Fail if local dependencies are not linked** - run `kodrdriv link` to set up local links
   - Report link status

5. **Summary Report**
   - Provide a clear summary of all checks
   - List any failures and what needs to be fixed
   - If all checks pass, confirm that the project is ready for development

## Common Issues and Fixes

### Issue: Package on main branch
**Fix**: Switch to working branch or create a feature branch
```bash
git checkout working
# or
git checkout -b feature/my-feature
```

### Issue: Behind remote
**Fix**: Pull latest changes
```bash
# For tree operations
kodrdriv tree pull

# For single package
kodrdriv pull
```

### Issue: Not on dev version
**Fix**: Run development command to bump to dev version
```bash
# For tree operations (if supported)
kodrdriv development

# For single package
kodrdriv development
```

### Issue: Local dependencies not linked
**Fix**: Run link command
```bash
# For tree operations
kodrdriv tree link

# For single package
kodrdriv link
```

## Expected End State

After all checks pass, you should have:
- All packages on `working` or feature branches (not `main`)
- All repositories synced with remote
- All packages with dev versions (e.g., `1.2.3-dev.0`)
- All local dependencies properly linked via `kodrdriv link`

## Important Notes

- **Branch Check**: The main branch check is critical - you should never develop directly on `main`
- **Remote Sync**: Always ensure you have the latest changes before starting work
- **Dev Versions**: Working branches should always have dev versions to distinguish from release versions
- **Link Status**: Local development requires linking to test changes across packages
- **Efficiency**: For large monorepos, checks can be done in parallel where possible

## Example Output

```
✅ Branch Check: All packages on working branch
✅ Remote Sync: All packages up to date with remote
✅ Dev Versions: All packages have dev versions (e.g., 1.2.3-dev.0)
✅ Link Status: All local dependencies properly linked

Project is ready for development!
```

Or if issues are found:

```
❌ Branch Check: @grunnverk/core is on main branch
⚠️  Remote Sync: @grunnverk/git-tools is 3 commits behind origin/working
❌ Dev Versions: @grunnverk/core has version 1.2.3 (should be 1.2.3-dev.0)
⚠️  Link Status: @grunnverk/commands-git is not linked locally

Actions needed:
1. Switch @grunnverk/core to working branch
2. Run kodrdriv tree pull to sync @grunnverk/git-tools
3. Run kodrdriv development in @grunnverk/core
4. Run kodrdriv tree link to link local dependencies
```
