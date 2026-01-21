# Updates Command

Update dependencies across your project or monorepo with scoped updates, dependency reports, and AI-powered analysis:

```bash
kodrdriv updates @eldrforge
kodrdriv tree updates --report
kodrdriv updates --analyze
```

The `updates` command provides powerful dependency management capabilities:
- **Scoped Updates**: Update packages matching specific npm scopes
- **Inter-project Updates**: Synchronize versions across monorepo packages
- **Dependency Reports**: Generate comprehensive dependency analysis reports
- **AI Analysis**: Get AI-powered upgrade recommendations

## Quick Start

```bash
# Update all @eldrforge packages to latest
kodrdriv updates @eldrforge

# Update across entire monorepo
kodrdriv tree updates @eldrforge

# Generate dependency report
kodrdriv tree updates --report

# Get AI-powered upgrade recommendations
kodrdriv updates --analyze
```

## Scoped Updates

Update packages matching a specific npm scope using [npm-check-updates](https://www.npmjs.com/package/npm-check-updates):

```bash
# Update @eldrforge packages in current project
kodrdriv updates @eldrforge

# Update @riotprompt packages
kodrdriv updates @riotprompt

# Update across all packages in monorepo
kodrdriv tree updates @eldrforge
```

### How It Works

1. Scans `package.json` for dependencies, devDependencies, and peerDependencies
2. Filters to packages matching the scope (e.g., `@eldrforge/*`)
3. Runs `ncu` (npm-check-updates) to find latest versions
4. Updates `package.json` with new versions
5. Optionally runs `npm install` to update lock file

### Configuration: Default Scopes

Configure default scopes in `.kodrdriv/config.yaml` to run updates without specifying a scope:

```yaml
updates:
  scopes:
    - "@eldrforge"
    - "@riotprompt"
    - "@theunwalked"
```

Then simply run:
```bash
kodrdriv updates        # Updates all configured scopes
kodrdriv tree updates   # Updates all scopes across monorepo
```

Alternatively, use the publish configuration for consistency:
```yaml
publish:
  scopedDependencyUpdates:
    - "@eldrforge"
    - "@riotprompt"
```

## Inter-Project Updates

Synchronize dependency versions across packages in a monorepo:

```bash
kodrdriv updates --inter-project @eldrforge
kodrdriv tree updates --inter-project @eldrforge
```

### How It Works

1. Scans all packages in the workspace
2. Finds the current versions of each package
3. Updates dependencies in other packages to match
4. Ensures all packages reference the same versions

This is useful when you've published new versions and need to update internal dependencies.

## Dependency Reports

Generate comprehensive reports showing dependency overlaps, conflicts, and analysis:

```bash
kodrdriv tree updates --report
```

### Report Contents

The report includes:

#### Summary Statistics
- Total packages in monorepo
- Total dependencies across all packages
- Unique dependencies
- Version conflicts detected

#### Version Conflicts
Lists packages with inconsistent versions across your monorepo:

```
┌─ 🔴 VERSION CONFLICTS (3 packages)
│
│  ├─ openai
│  │     ^4.87.3 (used by: @eldrforge/core, @eldrforge/commands-git)
│  │     ^6.15.0 (used by: @eldrforge/ai-service)
│  │
│  ├─ zod
│  │     ^3.24.2 (used by: @eldrforge/core)
│  │     ^4.0.2 (used by: @riotprompt/riotprompt)
```

#### Shared Dependencies
Shows which dependencies are used by multiple packages:

```
┌─ 📦 SHARED DEPENDENCIES (top 20)
│
│  ├─ typescript: ^5.9.2 (12 packages)
│  ├─ vitest: ^4.0.13 (12 packages)
│  ├─ eslint: ^9.33.0 (11 packages)
```

#### Package Summaries
Breakdown of dependency counts per package:

```
┌─ 📋 PACKAGE SUMMARIES
│
│  ├─ @eldrforge/kodrdriv
│  │     Dependencies: 15
│  │     DevDependencies: 22
│  │     PeerDependencies: 0
│  │     Total: 37
```

### Report Output Example

```
╔═══════════════════════════════════════════════════════════════════╗
║           📊 DEPENDENCY ANALYSIS REPORT                           ║
╚═══════════════════════════════════════════════════════════════════╝

📈 Summary
   Packages: 12
   Total Dependencies: 245
   Unique Dependencies: 89
   Version Conflicts: 3

┌─ 🔴 VERSION CONFLICTS (3 packages)
│
│  ├─ openai
│  │     ^4.87.3 (used by: core, commands-git)
│  │     ^6.15.0 (used by: ai-service)
...
```

## AI-Powered Dependency Analysis

Get intelligent upgrade recommendations using AI analysis:

```bash
kodrdriv updates --analyze
kodrdriv updates --analyze --strategy conservative
kodrdriv tree updates --analyze
```

### How It Works

1. **Generates dependency report** - Same as `--report`
2. **AI agent analyzes** - Uses tools to research packages
3. **Checks compatibility** - Verifies peer dependencies
4. **Creates recommendations** - Prioritized upgrade plan

### Available Tools

The AI agent has access to specialized tools:

| Tool | Purpose |
|------|---------|
| `get_npm_package_info` | Look up latest versions, peer deps, descriptions |
| `check_peer_dependencies` | Verify version compatibility |
| `get_latest_versions` | Batch check latest versions |
| `analyze_version_compatibility` | Full compatibility analysis |
| `get_package_changelog` | Get release notes and changelog info |
| `suggest_version_alignment` | Create coherent upgrade plans |

### Strategies

Choose an upgrade strategy with `--strategy`:

| Strategy | Description |
|----------|-------------|
| `latest` (default) | Prioritize newest versions for latest features and security |
| `conservative` | Prefer most commonly used version, minimize disruption |
| `compatible` | Find versions that work for all packages |

```bash
# Aggressive: get everything to latest
kodrdriv updates --analyze --strategy latest

# Safe: prefer stability
kodrdriv updates --analyze --strategy conservative

# Compatible: minimum viable upgrade
kodrdriv updates --analyze --strategy compatible
```

### AI Analysis Output

```
╔═══════════════════════════════════════════════════════════════════╗
║           🤖 AI DEPENDENCY ANALYSIS REPORT                        ║
╚═══════════════════════════════════════════════════════════════════╝

📊 Analysis completed in 8 iterations with 15 tool calls

┌─ 📝 SUMMARY
│
│  Analyzed 12 packages with 3 version conflicts. The primary
│  conflict is openai where v4 and v6 are both in use. Upgrading
│  to v6 is recommended as it's required by @riotprompt/riotprompt.

┌─ 💡 RECOMMENDATIONS
│
│  ├─ 🔴 openai
│  │     Current: ^4.87.3, ^6.15.0
│  │     Recommended: ^6.15.0
│  │     Reason: Required by @riotprompt/riotprompt peer dependency
│  │     Affects: @eldrforge/core, @eldrforge/commands-git
│  │
│  ├─ 🟡 zod
│  │     Current: ^3.24.2
│  │     Recommended: ^3.25.0
│  │     Reason: Security fixes and compatibility improvements

┌─ 📋 UPGRADE ORDER
│
│  1. openai
│  2. zod
│  3. typescript

┌─ ⚠️  WARNINGS
│
│  - openai v4 → v6 has breaking API changes
│  - Review OpenAI migration guide before upgrading
```

## Command Options

### Basic Options
- `[scope]`: npm scope to update (e.g., `@eldrforge`)
- `--directories [dirs...]`: Directories to scan (tree mode)

### Update Modes
- `--inter-project`: Update inter-project dependencies based on tree state
- `--report`: Generate dependency analysis report (no updates)
- `--analyze`: Run AI-powered analysis with recommendations

### Analysis Options
- `--strategy <strategy>`: Strategy for `--analyze` mode:
  - `latest` - Prefer newest versions (default)
  - `conservative` - Prefer most common versions
  - `compatible` - Prefer maximum compatibility

## Usage Examples

### Basic Scoped Updates

```bash
# Update @eldrforge packages
kodrdriv updates @eldrforge

# Update multiple scopes (run multiple times or configure defaults)
kodrdriv updates @eldrforge
kodrdriv updates @riotprompt
```

### Tree Mode Updates

```bash
# Update across all packages in monorepo
kodrdriv tree updates @eldrforge

# Use configured default scopes
kodrdriv tree updates

# Dry run to see what would change
kodrdriv tree updates @eldrforge --dry-run
```

### Dependency Analysis

```bash
# Generate dependency report
kodrdriv tree updates --report

# Report with verbose output
kodrdriv tree updates --report --verbose
```

### AI Analysis

```bash
# AI analysis with default (latest) strategy
kodrdriv updates --analyze

# Conservative strategy for stability
kodrdriv updates --analyze --strategy conservative

# Tree-wide analysis
kodrdriv tree updates --analyze

# Combined with verbose for full details
kodrdriv updates --analyze --verbose --debug
```

### Inter-Project Synchronization

```bash
# Sync @eldrforge versions across packages
kodrdriv updates --inter-project @eldrforge

# Tree-wide sync
kodrdriv tree updates --inter-project @eldrforge
```

## Configuration

### Default Scopes

```yaml
# .kodrdriv/config.yaml
updates:
  scopes:
    - "@eldrforge"
    - "@riotprompt"
    - "@theunwalked"
```

### Analysis Defaults

```yaml
updates:
  scopes:
    - "@eldrforge"
  # These are also available via CLI flags
  # report: false
  # analyze: false
  # strategy: "latest"
```

### Using Publish Config

```yaml
publish:
  scopedDependencyUpdates:
    - "@eldrforge"
    - "@riotprompt"
```

The updates command will use `publish.scopedDependencyUpdates` as a fallback when `updates.scopes` is not configured.

## Best Practices

### Regular Updates
```bash
# Weekly dependency check
kodrdriv tree updates --report

# If conflicts found, run AI analysis
kodrdriv updates --analyze
```

### Before Publishing
```bash
# Ensure all dependencies are current
kodrdriv tree updates @eldrforge
kodrdriv tree updates @riotprompt

# Sync inter-project versions
kodrdriv tree updates --inter-project @eldrforge
```

### Reviewing AI Recommendations
1. Run `--analyze` to get recommendations
2. Review the upgrade order
3. Check breaking change warnings
4. Apply updates incrementally
5. Test after each major upgrade

### Handling Version Conflicts
1. Generate report: `kodrdriv tree updates --report`
2. Identify conflicts
3. Run AI analysis for recommendations
4. Update packages in recommended order
5. Run `npm install` in each package
6. Test thoroughly

## Integration with Publish Workflow

The updates command integrates with the publish workflow:

```bash
# 1. Check for dependency updates
kodrdriv tree updates --report

# 2. Update external dependencies
kodrdriv tree updates @riotprompt

# 3. Sync internal dependencies
kodrdriv tree updates --inter-project @eldrforge

# 4. Commit dependency updates
kodrdriv tree commit

# 5. Publish
kodrdriv tree publish
```

## Troubleshooting

### "No scope specified" Error
Either provide a scope or configure defaults:
```bash
kodrdriv updates @eldrforge  # Provide scope

# Or configure defaults in .kodrdriv/config.yaml
```

### npm-check-updates Not Found
Install globally:
```bash
npm install -g npm-check-updates
```

### AI Analysis Timeout
The AI analysis may take time for large monorepos:
```bash
# Increase timeout (if supported)
kodrdriv updates --analyze --verbose  # Shows progress
```

### Lock File Out of Sync
After updates:
```bash
npm install  # Regenerate lock file
```

## Related Commands

- [tree](tree.md) - Execute commands across multiple packages
- [publish](publish.md) - Publish with automatic dependency updates
- [link](link.md) - Link packages for local development


