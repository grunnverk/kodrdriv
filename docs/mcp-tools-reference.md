# KodrDriv MCP Tools Reference

Complete reference for all 13 MCP tools available in KodrDriv.

## Core Tools (6)

### kodrdriv_commit

Generate intelligent commit messages from staged changes.

**Parameters:**
- `directory` (string, optional) - Repository directory path
- `sendit` (boolean, optional) - Automatically commit with generated message (default: false)
- `issue` (string, optional) - GitHub issue number to reference
- `dry_run` (boolean, optional) - Generate message without committing (default: false)

**Example:**
```json
{
  "directory": "/path/to/repo",
  "sendit": true,
  "issue": "123"
}
```

### kodrdriv_release

Generate comprehensive release notes from git history.

**Parameters:**
- `directory` (string, optional) - Repository directory path
- `version` (string, optional) - Release version (e.g., 1.0.0)
- `from_tag` (string, optional) - Start tag for release notes
- `to_tag` (string, optional) - End tag for release notes (defaults to HEAD)
- `output` (string, optional) - Output file path for release notes

**Example:**
```json
{
  "directory": "/path/to/repo",
  "version": "1.2.0",
  "from_tag": "v1.1.0"
}
```

### kodrdriv_publish

Automated package publishing workflow.

**Parameters:**
- `directory` (string, optional) - Package directory path
- `version_type` (string, optional) - Version bump type: patch, minor, major
- `dry_run` (boolean, optional) - Simulate without publishing (default: false)
- `skip_tests` (boolean, optional) - Skip running tests (default: false)

**Example:**
```json
{
  "directory": "/path/to/package",
  "version_type": "minor",
  "dry_run": false
}
```

### kodrdriv_precommit

Run comprehensive precommit checks.

**Parameters:**
- `directory` (string, optional) - Repository directory path
- `fix` (boolean, optional) - Attempt to auto-fix issues (default: false)
- `skip_tests` (boolean, optional) - Skip test execution (default: false)

**Example:**
```json
{
  "directory": "/path/to/repo",
  "fix": true
}
```

### kodrdriv_review

Analyze review notes and create GitHub issues.

**Parameters:**
- `directory` (string, optional) - Repository directory path
- `review_file` (string, optional) - Path to review notes file
- `dry_run` (boolean, optional) - Preview issues without creating (default: false)

**Example:**
```json
{
  "directory": "/path/to/repo",
  "review_file": "REVIEW.md",
  "dry_run": true
}
```

### kodrdriv_pull

Smart git pull with conflict resolution assistance.

**Parameters:**
- `directory` (string, optional) - Repository directory path
- `rebase` (boolean, optional) - Use rebase instead of merge (default: false)
- `auto_resolve` (boolean, optional) - Attempt automatic conflict resolution (default: false)

**Example:**
```json
{
  "directory": "/path/to/repo",
  "rebase": true
}
```

## Tree Tools (7)

### kodrdriv_tree_commit

Generate commit messages and commit changes across multiple packages.

**Parameters:**
- `directory` (string, optional) - Root directory of monorepo
- `packages` (array of strings, optional) - Specific packages to commit
- `sendit` (boolean, optional) - Auto-commit without confirmation

**Example:**
```json
{
  "directory": "/path/to/monorepo",
  "packages": ["package-a", "package-b"],
  "sendit": true
}
```

### kodrdriv_tree_publish

Publish multiple packages in correct dependency order.

**Parameters:**
- `directory` (string, optional) - Root directory of monorepo
- `packages` (array of strings, optional) - Specific packages to publish
- `version_type` (string, optional) - Version bump type: patch, minor, major
- `dry_run` (boolean, optional) - Simulate without publishing

**Example:**
```json
{
  "directory": "/path/to/monorepo",
  "version_type": "patch"
}
```

### kodrdriv_tree_precommit

Run precommit checks across all packages in monorepo.

**Parameters:**
- `directory` (string, optional) - Root directory of monorepo
- `packages` (array of strings, optional) - Specific packages to check
- `fix` (boolean, optional) - Auto-fix issues where possible

**Example:**
```json
{
  "directory": "/path/to/monorepo",
  "fix": true
}
```

### kodrdriv_tree_link

Link local packages for development.

**Parameters:**
- `directory` (string, optional) - Root directory of monorepo
- `packages` (array of strings, optional) - Specific packages to link

**Example:**
```json
{
  "directory": "/path/to/monorepo"
}
```

### kodrdriv_tree_unlink

Remove workspace links and restore npm registry versions.

**Parameters:**
- `directory` (string, optional) - Root directory of monorepo
- `packages` (array of strings, optional) - Specific packages to unlink

**Example:**
```json
{
  "directory": "/path/to/monorepo"
}
```

### kodrdriv_tree_updates

Check for dependency updates across all packages.

**Parameters:**
- `directory` (string, optional) - Root directory of monorepo
- `packages` (array of strings, optional) - Specific packages to check

**Example:**
```json
{
  "directory": "/path/to/monorepo"
}
```

### kodrdriv_tree_pull

Pull latest changes across all packages in tree.

**Parameters:**
- `directory` (string, optional) - Root directory of monorepo
- `rebase` (boolean, optional) - Use rebase instead of merge

**Example:**
```json
{
  "directory": "/path/to/monorepo",
  "rebase": false
}
```

## Return Format

All tools return a standardized result format:

```typescript
{
  success: boolean;      // Whether the operation succeeded
  data?: any;            // Result data (varies by tool)
  error?: string;        // Error message if failed
  message?: string;      // Human-readable status message
}
```

## Error Handling

All tools implement comprehensive error handling:
- Invalid parameters are caught and reported
- File system errors are handled gracefully
- Git operations failures are reported with context
- Network errors (for GitHub operations) are handled

## Integration with Cursor

Use these tools directly in Cursor by asking natural language questions:
- "Use kodrdriv to commit my changes"
- "Run precommit checks with kodrdriv"
- "Publish this package using kodrdriv"
- "Generate release notes for version 1.2.0"
