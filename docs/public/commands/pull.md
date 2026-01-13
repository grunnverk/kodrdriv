# Pull Command

Smart pull from remote repositories with automatic conflict resolution:

```bash
kodrdriv pull
kodrdriv tree pull
```

The `pull` command provides an intelligent alternative to `git pull` that automatically handles common merge conflicts, stashes local changes, and uses smart strategies to keep your branches synchronized without the usual headaches.

## Why Use Smart Pull?

Standard `git pull` often fails with:
- Fast-forward failures requiring manual rebases
- `package-lock.json` merge conflicts
- Build artifact conflicts in `dist/` directories
- Version bump conflicts in `package.json`

**kodrdriv pull** handles these automatically, saving you from tedious conflict resolution.

## How It Works

1. **Pre-pull**: Automatically stashes any uncommitted local changes
2. **Fetch**: Fetches from the remote to see what's coming
3. **Fast-forward**: Tries the safest strategy first
4. **Rebase**: If fast-forward fails, attempts a rebase
5. **Auto-resolve**: For any conflicts, applies smart resolution strategies
6. **Merge fallback**: If rebase fails, falls back to regular merge
7. **Post-pull**: Regenerates lock files and restores stashed changes

## Tree Mode Execution

The pull command can be executed across multiple packages using the tree command:

```bash
# Pull all packages in dependency order
kodrdriv tree pull

# Pull with specific remote
kodrdriv tree pull --remote upstream

# Dry run to see what would happen
kodrdriv tree pull --dry-run
```

### Tree Mode Benefits

- **Configuration Isolation**: Each package uses its own git context
- **Dependency Awareness**: Packages are processed in dependency order
- **Consistent State**: All packages synchronized from the same remote

## Automatic Conflict Resolution

The pull command automatically resolves common conflicts that typically require manual intervention:

| File Pattern | Resolution Strategy | Description |
|-------------|---------------------|-------------|
| `package-lock.json` | Regenerate | Accept remote, then run `npm install` to regenerate |
| `yarn.lock` | Regenerate | Accept remote, regenerate with `yarn` |
| `pnpm-lock.yaml` | Regenerate | Accept remote, regenerate with `pnpm` |
| `package.json` (version only) | Higher version | Automatically takes the higher semver version |
| `dist/**` | Accept remote | Generated build artifacts, take remote and rebuild |
| `coverage/**` | Accept remote | Test coverage files, take remote |
| `*.js.map` | Accept remote | Source maps, take remote and rebuild |
| `*.d.ts` | Accept remote | TypeScript declarations, take remote and rebuild |

### Version Conflict Resolution

For `package.json` files with only version conflicts, the command intelligently compares versions:

```
Local:  "version": "1.2.3"
Remote: "version": "1.2.5"
Result: "version": "1.2.5"  (takes the higher version)
```

This handles the common scenario where both you and a colleague bumped versions.

## Command Options

- `--remote <remote>`: Remote to pull from (default: `origin`)
- `--branch <branch>`: Branch to pull (default: current branch)
- `--no-auto-stash`: Disable automatic stashing of local changes
- `--no-auto-resolve`: Disable automatic conflict resolution

## Usage Examples

### Basic Pull

```bash
# Pull from origin/current-branch (most common)
kodrdriv pull

# Pull with verbose logging
kodrdriv pull --verbose

# Dry run to preview what would happen
kodrdriv pull --dry-run
```

### Specifying Remote and Branch

```bash
# Pull from upstream instead of origin
kodrdriv pull --remote upstream

# Pull specific branch
kodrdriv pull --branch main

# Pull main branch from upstream
kodrdriv pull --remote upstream --branch main
```

### Tree Mode for Monorepos

```bash
# Pull all packages in a monorepo
kodrdriv tree pull

# Pull with specific remote across all packages
kodrdriv tree pull --remote upstream

# Resume from a specific package if one fails
kodrdriv tree pull --start-from my-package

# Exclude certain packages
kodrdriv tree pull --exclude "test-*" "internal-*"
```

### Disabling Automatic Features

```bash
# Pull without auto-stashing (will fail if uncommitted changes exist)
kodrdriv pull --no-auto-stash

# Pull without automatic conflict resolution (behaves like git pull)
kodrdriv pull --no-auto-resolve
```

## Output Example

Successful pull with auto-resolved conflicts:

```
════════════════════════════════════════════════════════════
✅ PULL COMPLETE
════════════════════════════════════════════════════════════

Strategy: rebase
Message: Rebase successful with 2 auto-resolved conflicts

Conflicts detected: 2
✓ Auto-resolved: 2
   - package-lock.json
   - dist/index.js.map

ℹ️  Local changes have been restored from stash

════════════════════════════════════════════════════════════
```

Pull requiring manual intervention:

```
════════════════════════════════════════════════════════════
⚠️  PULL NEEDS ATTENTION
════════════════════════════════════════════════════════════

Strategy: rebase
Message: Rebase paused: 1 files need manual conflict resolution

Conflicts detected: 3
✓ Auto-resolved: 2
   - package-lock.json
   - dist/index.js.map
✗ Manual resolution needed: 1
   - src/config.ts

════════════════════════════════════════════════════════════
```

## Execution Strategies

The command tries strategies in order of safety:

### 1. Fast-Forward (Safest)
```bash
git merge --ff-only origin/main
```
Used when your branch has no local commits ahead of remote.

### 2. Rebase
```bash
git rebase origin/main
```
Used when fast-forward fails but changes can be rebased cleanly.

### 3. Merge
```bash
git merge origin/main
```
Used as a fallback when rebase fails.

## Conflict Resolution Strategies

### Regenerate Lock Files
For lock files (`package-lock.json`, `yarn.lock`, etc.), the command:
1. Accepts the remote version
2. Marks the conflict as resolved
3. After pull completes, runs `npm install` to regenerate with correct dependencies

### Take Remote (Build Artifacts)
For generated files like `dist/` contents:
1. Accepts the remote version entirely
2. You can rebuild later with `npm run build`

### Version Resolution (package.json)
For version-only conflicts:
1. Parses both versions using semver
2. Selects the higher version
3. Updates the file and marks resolved

## Stash Management

When you have uncommitted changes:

1. **Auto-stash**: Changes are stashed with a timestamped message
2. **Pull executes**: Full pull process runs
3. **Stash pop**: Changes are automatically restored

If stash restoration has conflicts:
- Your changes remain in the stash
- A warning is displayed
- Run `git stash show` and `git stash pop` manually

## Error Handling

### Fetch Failures
If the remote is unreachable:
- Error message with details
- Stashed changes are restored
- No changes to your repository

### Unresolvable Conflicts
If conflicts can't be auto-resolved:
- List of files needing manual resolution
- Rebase/merge left in progress
- Clear instructions on how to proceed

### Recovery Commands
After manual conflict resolution:
```bash
# For rebase
git rebase --continue

# For merge
git commit
```

## Configuration

Configure default pull behavior in `.kodrdriv/config.yaml`:

```yaml
pull:
  remote: origin        # Default remote
  branch: main         # Default branch (or null for current)
  autoStash: true      # Auto-stash local changes
  autoResolve: true    # Auto-resolve common conflicts
```

## Best Practices

### For Teams
1. **Pull frequently**: Small, frequent pulls have fewer conflicts
2. **Use tree pull**: Keep entire monorepo synchronized
3. **Review auto-resolutions**: Check `package-lock.json` changes make sense

### For CI/CD
```bash
# In CI, you might want more control
kodrdriv pull --no-auto-resolve
```

### Before Releases
```bash
# Ensure all packages are synchronized
kodrdriv tree pull --verbose
```

## Comparison with Git Pull

| Feature | `git pull` | `kodrdriv pull` |
|---------|-----------|-----------------|
| Auto-stash changes | ❌ Manual | ✅ Automatic |
| Resolve lock files | ❌ Manual | ✅ Automatic |
| Handle version bumps | ❌ Manual | ✅ Automatic |
| Resolve build artifacts | ❌ Manual | ✅ Automatic |
| Multi-package support | ❌ No | ✅ Yes (tree mode) |
| Strategy fallback | ❌ No | ✅ FF → Rebase → Merge |
| Clear conflict reporting | ❌ Basic | ✅ Detailed |

## Troubleshooting

### "Stash preserved" Warning
Your local changes are still in the stash. Run:
```bash
git stash list    # See stashed changes
git stash pop     # Restore them
```

### Conflicts After Pull
If you see unresolved conflicts:
```bash
git status              # See conflicted files
# Edit files to resolve
git add <resolved-files>
git rebase --continue   # or git commit for merge
```

### Lock File Regeneration Failed
If `npm install` fails after pull:
```bash
rm -rf node_modules
npm install
```

## Related Commands

- [tree](tree.md) - Execute commands across multiple packages
- [commit](commit.md) - Commit after pulling latest changes
- [publish](publish.md) - Publish after synchronizing with remote


