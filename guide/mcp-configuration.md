# Configuring Kodrdriv via MCP

Kodrdriv supports first-class configuration through Model Context Protocol (MCP), powered by [CardiganTime](https://utilarium.github.io/cardigantime/). This allows AI assistants to configure Kodrdriv directly through MCP invocations without needing configuration files.

## Overview

When Kodrdriv is invoked via MCP, configuration can be provided in three ways (in priority order):

1. **MCP Configuration** - Provided in the MCP server configuration (highest priority)
2. **File-Based Configuration** - Discovered from the working directory
3. **Default Configuration** - Built-in defaults

## The Simplifying Assumption

**If MCP configuration is provided, it is the complete configuration.**

This means:
- MCP config takes exclusive precedence
- No merging with file-based config
- No fallback to file config
- Predictable and debuggable behavior

## Basic MCP Configuration

### Cursor MCP Configuration

Add Kodrdriv to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "kodrdriv": {
      "command": "node",
      "args": ["/Users/tobrien/gitw/grunnverk/kodrdriv/dist/mcp-server.js"]
    }
  }
}
```

This basic configuration uses file-based configuration discovery. Kodrdriv will look for `.kodrdriv.yaml`, `.kodrdriv.json`, or other configuration files in your project directory.

## Advanced MCP Configuration

To provide configuration directly through MCP (bypassing file-based configuration), add a `config` field:

```json
{
  "mcpServers": {
    "kodrdriv": {
      "command": "node",
      "args": ["/Users/tobrien/gitw/grunnverk/kodrdriv/dist/mcp-server.js"],
      "config": {
        "dryRun": false,
        "verbose": true,
        "model": "gpt-4o",
        "commit": {
          "messageLimit": 100,
          "maxAgenticIterations": 5,
          "selfReflection": true
        },
        "release": {
          "messageLimit": 150,
          "maxAgenticIterations": 3
        }
      }
    }
  }
}
```

## Configuration Schema

Kodrdriv's configuration schema is defined using Zod and includes the following sections:

### Global Options

```json
{
  "dryRun": false,
  "verbose": true,
  "debug": false,
  "model": "gpt-4o",
  "openaiReasoning": "medium",
  "openaiMaxOutputTokens": 16000,
  "contextDirectories": ["./docs", "./guide"],
  "outputDirectory": "./output",
  "preferencesDirectory": "~/.kodrdriv"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `dryRun` | boolean | Run commands without making changes |
| `verbose` | boolean | Enable verbose output |
| `debug` | boolean | Enable debug logging |
| `model` | string | Default AI model to use |
| `openaiReasoning` | `"low"` \| `"medium"` \| `"high"` | OpenAI reasoning effort level |
| `openaiMaxOutputTokens` | number | Maximum output tokens for OpenAI |
| `contextDirectories` | string[] | Directories to include in context |
| `outputDirectory` | string | Directory for output files |
| `preferencesDirectory` | string | Directory for user preferences |

### Commit Configuration

```json
{
  "commit": {
    "add": true,
    "cached": false,
    "sendit": false,
    "interactive": true,
    "amend": false,
    "push": false,
    "messageLimit": 100,
    "context": "Additional context for commit",
    "contextFiles": ["./CHANGELOG.md"],
    "maxDiffBytes": 500000,
    "model": "gpt-4o",
    "maxAgenticIterations": 5,
    "allowCommitSplitting": true,
    "autoSplit": true,
    "selfReflection": true
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `add` | boolean | Automatically stage changes |
| `cached` | boolean | Only commit staged changes |
| `sendit` | boolean | Skip confirmation prompts |
| `interactive` | boolean | Enable interactive mode |
| `amend` | boolean | Amend previous commit |
| `push` | boolean \| string | Push after commit (true or remote name) |
| `messageLimit` | number | Maximum commit message length |
| `context` | string | Additional context for AI |
| `contextFiles` | string[] | Files to include in context |
| `maxDiffBytes` | number | Maximum diff size to analyze |
| `model` | string | AI model for commit messages |
| `maxAgenticIterations` | number | Max agentic workflow iterations |
| `allowCommitSplitting` | boolean | Allow splitting large commits |
| `autoSplit` | boolean | Automatically split commits |
| `selfReflection` | boolean | Enable self-reflection mode |

### Release Configuration

```json
{
  "release": {
    "from": "v1.0.0",
    "to": "HEAD",
    "messageLimit": 150,
    "context": "Release context",
    "contextFiles": ["./RELEASE_NOTES.md"],
    "interactive": true,
    "focus": "bug fixes and features",
    "maxDiffBytes": 1000000,
    "model": "gpt-4o",
    "noMilestones": false,
    "fromMain": false,
    "maxAgenticIterations": 3,
    "selfReflection": true
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Starting commit/tag for release notes |
| `to` | string | Ending commit/tag for release notes |
| `messageLimit` | number | Maximum release note length |
| `context` | string | Additional context for AI |
| `contextFiles` | string[] | Files to include in context |
| `interactive` | boolean | Enable interactive mode |
| `focus` | string | Focus area for release notes |
| `maxDiffBytes` | number | Maximum diff size to analyze |
| `model` | string | AI model for release notes |
| `noMilestones` | boolean | Skip milestone detection |
| `fromMain` | boolean | Generate from main branch |
| `maxAgenticIterations` | number | Max agentic workflow iterations |
| `selfReflection` | boolean | Enable self-reflection mode |

### Review Configuration

```json
{
  "review": {
    "includeCommitHistory": true,
    "includeRecentDiffs": true,
    "includeReleaseNotes": false,
    "includeGithubIssues": false,
    "commitHistoryLimit": 50,
    "diffHistoryLimit": 10,
    "releaseNotesLimit": 5,
    "githubIssuesLimit": 20,
    "context": "Review context",
    "sendit": false,
    "note": "Review note text",
    "editorTimeout": 300000,
    "maxContextErrors": 3,
    "model": "gpt-4o",
    "file": "./review-notes.md",
    "directory": "./reviews"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `includeCommitHistory` | boolean | Include commit history in review |
| `includeRecentDiffs` | boolean | Include recent diffs |
| `includeReleaseNotes` | boolean | Include release notes |
| `includeGithubIssues` | boolean | Include GitHub issues |
| `commitHistoryLimit` | number | Max commits to include |
| `diffHistoryLimit` | number | Max diffs to include |
| `releaseNotesLimit` | number | Max release notes to include |
| `githubIssuesLimit` | number | Max GitHub issues to include |
| `context` | string | Additional context for review |
| `sendit` | boolean | Skip confirmation prompts |
| `note` | string | Review note text |
| `editorTimeout` | number | Editor timeout in milliseconds |
| `maxContextErrors` | number | Max context loading errors |
| `model` | string | AI model for reviews |
| `file` | string | File path to read review note from |
| `directory` | string | Directory to process review files |

### Publish Configuration

```json
{
  "publish": {
    "mergeMethod": "squash",
    "from": "working",
    "targetVersion": "1.0.0",
    "interactive": true,
    "skipAlreadyPublished": true,
    "forceRepublish": false,
    "linkWorkspacePackages": true,
    "unlinkWorkspacePackages": true,
    "checksTimeout": 300000,
    "skipUserConfirmation": false,
    "syncTarget": true,
    "sendit": false,
    "waitForReleaseWorkflows": true,
    "releaseWorkflowsTimeout": 600000,
    "releaseWorkflowNames": ["npm-publish", "release"],
    "targetBranch": "main",
    "noMilestones": false,
    "fromMain": false,
    "skipPrePublishMerge": false,
    "agenticPublish": true,
    "agenticPublishMaxIterations": 5,
    "skipLinkCleanup": false
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `mergeMethod` | `"merge"` \| `"squash"` \| `"rebase"` | Git merge method |
| `from` | string | Source branch for publish |
| `targetVersion` | string | Target version to publish |
| `interactive` | boolean | Enable interactive mode |
| `skipAlreadyPublished` | boolean | Skip already published packages |
| `forceRepublish` | boolean | Force republish packages |
| `linkWorkspacePackages` | boolean | Link workspace packages |
| `unlinkWorkspacePackages` | boolean | Unlink after publish |
| `checksTimeout` | number | Timeout for CI checks (ms) |
| `skipUserConfirmation` | boolean | Skip confirmation prompts |
| `syncTarget` | boolean | Sync with target branch |
| `sendit` | boolean | Skip all prompts |
| `waitForReleaseWorkflows` | boolean | Wait for release workflows |
| `releaseWorkflowsTimeout` | number | Workflow timeout (ms) |
| `releaseWorkflowNames` | string[] | Workflow names to wait for |
| `targetBranch` | string | Target branch for publish |
| `noMilestones` | boolean | Skip milestone detection |
| `fromMain` | boolean | Publish from main branch |
| `skipPrePublishMerge` | boolean | Skip pre-publish merge |
| `agenticPublish` | boolean | Use agentic publish workflow |
| `agenticPublishMaxIterations` | number | Max agentic iterations |
| `skipLinkCleanup` | boolean | Skip link cleanup |

### Branch Configuration

```json
{
  "branches": {
    "working": {
      "targetBranch": "main",
      "developmentBranch": true,
      "version": {
        "type": "prerelease",
        "increment": true,
        "incrementLevel": "patch",
        "tag": "dev"
      }
    },
    "main": {
      "targetBranch": "main",
      "developmentBranch": false,
      "version": {
        "type": "release",
        "increment": true,
        "incrementLevel": "minor"
      }
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `targetBranch` | string | Target branch for merges |
| `developmentBranch` | boolean | Is this a development branch? |
| `version.type` | `"release"` \| `"prerelease"` | Version type |
| `version.increment` | boolean | Auto-increment version |
| `version.incrementLevel` | `"patch"` \| `"minor"` \| `"major"` | Increment level |
| `version.tag` | string | Prerelease tag (e.g., "dev", "beta") |

### Link Configuration

```json
{
  "link": {
    "scopeRoots": {
      "@grunnverk": "../../grunnverk",
      "@riotprompt": "../../kjerneverk",
      "@theunwalked": "../../utilarium"
    },
    "dryRun": false,
    "packageArgument": "@grunnverk/core"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `scopeRoots` | Record<string, string> | Scope to directory mappings |
| `dryRun` | boolean | Run without making changes |
| `packageArgument` | string | Specific package to link |

### Tree Configuration

```json
{
  "tree": {
    "parallel": true,
    "maxConcurrency": 4,
    "continueOnError": false,
    "skipDependencyCheck": false,
    "includeRoot": false,
    "topological": true,
    "reverse": false,
    "filter": ["@grunnverk/*"],
    "exclude": ["@grunnverk/test-*"],
    "scope": "@grunnverk",
    "since": "v1.0.0",
    "uncommitted": false,
    "changed": false
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `parallel` | boolean | Execute commands in parallel |
| `maxConcurrency` | number | Max parallel executions |
| `continueOnError` | boolean | Continue if a package fails |
| `skipDependencyCheck` | boolean | Skip dependency validation |
| `includeRoot` | boolean | Include root package |
| `topological` | boolean | Use topological order |
| `reverse` | boolean | Reverse execution order |
| `filter` | string[] | Package name patterns to include |
| `exclude` | string[] | Package name patterns to exclude |
| `scope` | string | Scope to filter packages |
| `since` | string | Only packages changed since commit |
| `uncommitted` | boolean | Only packages with uncommitted changes |
| `changed` | boolean | Only packages with changes |

### Workspace Configuration

```json
{
  "workspace": {
    "excludeSubprojects": ["doc/", "docs/", "test-*/", "examples/"]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `excludeSubprojects` | string[] | Patterns for subprojects to exclude from workspace scanning. Useful for excluding documentation sites, test fixtures, and example projects that aren't actual packages. Default: `["doc/", "docs/", "test-*/"]` |

**Note**: The workspace configuration affects MCP resources like `kodrdriv://workspace`, `kodrdriv://tree-graph`, and `kodrdriv://package` by filtering out directories that match the exclusion patterns when scanning for packages. This is particularly useful in monorepos where documentation sites or test fixtures contain `package.json` files but shouldn't be treated as workspace packages.

## Complete Example

Here's a complete example of a Cursor MCP configuration for Kodrdriv:

```json
{
  "mcpServers": {
    "kodrdriv": {
      "command": "node",
      "args": ["/Users/tobrien/gitw/grunnverk/kodrdriv/dist/mcp-server.js"],
      "config": {
        "verbose": true,
        "model": "gpt-4o",
        "openaiReasoning": "medium",
        "contextDirectories": ["./docs", "./guide"],
        "commit": {
          "add": true,
          "messageLimit": 100,
          "maxAgenticIterations": 5,
          "allowCommitSplitting": true,
          "autoSplit": true,
          "selfReflection": true,
          "model": "gpt-4o"
        },
        "release": {
          "messageLimit": 150,
          "maxAgenticIterations": 3,
          "selfReflection": true,
          "interactive": true,
          "model": "gpt-4o"
        },
        "review": {
          "includeCommitHistory": true,
          "includeRecentDiffs": true,
          "commitHistoryLimit": 50,
          "diffHistoryLimit": 10,
          "model": "gpt-4o"
        },
        "publish": {
          "mergeMethod": "squash",
          "skipAlreadyPublished": true,
          "linkWorkspacePackages": true,
          "unlinkWorkspacePackages": true,
          "waitForReleaseWorkflows": true,
          "agenticPublish": true,
          "agenticPublishMaxIterations": 5
        },
        "branches": {
          "working": {
            "targetBranch": "main",
            "developmentBranch": true,
            "version": {
              "type": "prerelease",
              "increment": true,
              "incrementLevel": "patch",
              "tag": "dev"
            }
          },
          "main": {
            "targetBranch": "main",
            "developmentBranch": false,
            "version": {
              "type": "release",
              "increment": true,
              "incrementLevel": "minor"
            }
          }
        },
        "link": {
          "scopeRoots": {
            "@grunnverk": "../../grunnverk",
            "@riotprompt": "../../kjerneverk",
            "@theunwalked": "../../utilarium"
          }
        },
        "tree": {
          "parallel": true,
          "maxConcurrency": 4,
          "topological": true
        },
        "workspace": {
          "excludeSubprojects": ["doc/", "docs/", "test-*/", "examples/"]
        }
      }
    }
  }
}
```

## Configuration Priority Model

```
MCP Config Present?
  ├─ YES → Use MCP config exclusively
  └─ NO → Discover from files
      ├─ Working directory?
      │   ├─ YES → Start discovery from working directory
      │   └─ NO → Use current directory
      └─ Walk up directory tree looking for config files
```

## File-Based Fallback

When MCP config is not provided, Kodrdriv discovers configuration files in this order:

1. `.kodrdriv.yaml` or `.kodrdriv.yml`
2. `.kodrdriv.json`
3. `kodrdriv.yaml` or `kodrdriv.yml`
4. `kodrdriv.json`
5. User config at `~/.kodrdriv/`

## CheckConfig Tool

Every Kodrdriv MCP tool automatically includes the `check_config` tool for inspecting configuration.

### Usage

```json
{
  "tool": "check_config",
  "input": {
    "verbose": true,
    "includeConfig": true
  }
}
```

### Output

```json
{
  "source": "mcp",
  "hierarchical": false,
  "config": {
    "model": "gpt-4o",
    "commit": {
      "messageLimit": 100
    }
  },
  "summary": "Configuration loaded from MCP invocation"
}
```

### When to Use CheckConfig

- **Debugging**: When Kodrdriv isn't behaving as expected
- **Verification**: To confirm MCP config is being used
- **Discovery**: To see which config files were found
- **Documentation**: To understand the current configuration

## Best Practices

### For Users

1. **Start with MCP config** - Simpler than file-based for MCP tools
2. **Use CheckConfig** - To verify your configuration
3. **Keep it simple** - Only configure what you need to change
4. **Test incrementally** - Add config options one at a time
5. **Use defaults** - Kodrdriv has sensible defaults for most options

### For AI Assistants

1. **Use CheckConfig first** - When debugging configuration issues
2. **Check verbose output** - To understand hierarchical merging
3. **Verify MCP config** - Confirm it's being used when expected
4. **Guide users** - Help them understand configuration sources
5. **Respect dry-run** - Always check `dryRun` setting before making changes

## FAQ

### Can I use both MCP and file config?

No. If MCP config is provided, it's used exclusively. This is the "simplifying assumption" that makes configuration predictable.

### How do I know which config is being used?

Use the `check_config` tool. It shows the source (`mcp`, `file`, or `defaults`) and the actual configuration values.

### What happens if MCP config is invalid?

The tool throws a validation error with detailed information about what's wrong. Use CheckConfig to verify your configuration before running tools.

### Can I override just one field via MCP?

No. MCP config must be complete. If you provide MCP config, it replaces all file-based config. This prevents confusion about which values come from where.

### How do I migrate from file-based to MCP config?

1. Use CheckConfig to see your current file-based config
2. Copy the configuration values
3. Convert to JSON format
4. Add to your MCP server configuration in `~/.cursor/mcp.json`
5. Optionally remove file-based config files

### Where should I put my MCP configuration?

For Cursor, add it to `~/.cursor/mcp.json`. For other MCP clients, consult their documentation for the MCP server configuration file location.

## Related Documentation

- [CardiganTime MCP Configuration](https://utilarium.github.io/cardigantime/#mcp-integration)
- [Kodrdriv Configuration Guide](./configuration.md)
- [Kodrdriv Commands](./commands.md)
- [Kodrdriv Quickstart](./quickstart.md)

## Security Considerations

### Sensitive Values

CheckConfig automatically sanitizes sensitive configuration values:

- `password`, `secret`, `token`
- `apiKey`, `api_key`
- `auth`, `credential`
- `privateKey`, `private_key`
- `accessKey`, `access_key`

These are replaced with `"***"` in CheckConfig output.

### Validation

All MCP configuration is validated against the Zod schema before use. Invalid configuration will throw an error with detailed validation messages.

## Troubleshooting

### MCP Config Not Working

**Symptoms**: You added MCP config but Kodrdriv uses file config

**Solution**:
1. Run `check_config` to verify the source
2. Check that your `mcp.json` has the `config` field
3. Verify the JSON syntax is valid
4. Restart your MCP client (Cursor)

### Configuration Validation Errors

**Symptoms**: Kodrdriv throws validation errors

**Solution**:
1. Check the error message for specific field issues
2. Verify field types match the schema (boolean, string, number, etc.)
3. Check enum values (e.g., `openaiReasoning` must be "low", "medium", or "high")
4. Use CheckConfig to see the current configuration

### Wrong Configuration Being Used

**Symptoms**: Kodrdriv uses unexpected configuration values

**Solution**:
1. Run `check_config` with `verbose: true`
2. Check if MCP config is being used (`source: "mcp"`)
3. If file-based, check which files are being loaded
4. Remove or update conflicting configuration files
