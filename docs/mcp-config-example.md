# Kodrdriv MCP Configuration Example

This document shows a real-world example of configuring Kodrdriv via MCP in Cursor.

## Basic Configuration (File-Based Discovery)

If your `~/.cursor/mcp.json` looks like this:

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

This configuration:
- Runs the Kodrdriv MCP server using Node.js
- Uses **file-based configuration discovery**
- Looks for `.kodrdriv.yaml`, `.kodrdriv.json`, etc. in your project directory
- Walks up the directory tree to find configuration files
- Merges configurations hierarchically

## Adding MCP Configuration

To provide configuration directly through MCP (bypassing file discovery), add a `config` field:

```json
{
  "mcpServers": {
    "kodrdriv": {
      "command": "node",
      "args": ["/Users/tobrien/gitw/grunnverk/kodrdriv/dist/mcp-server.js"],
      "config": {
        "verbose": true,
        "model": "gpt-4o",
        "commit": {
          "add": true,
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

## What Changes with MCP Config?

### Without `config` field (File-Based)
```
MCP Invocation
  └─ Kodrdriv discovers config files
      ├─ Checks working directory
      ├─ Walks up directory tree
      ├─ Finds: .kodrdriv.yaml, kodrdriv.json, etc.
      └─ Merges configurations hierarchically
```

### With `config` field (MCP Config)
```
MCP Invocation
  └─ Kodrdriv uses MCP config exclusively
      ├─ No file discovery
      ├─ No hierarchical merging
      └─ Predictable, single source of truth
```

## Verifying Your Configuration

Use the `check_config` tool to see which configuration is active:

```json
{
  "tool": "check_config",
  "input": {
    "verbose": true
  }
}
```

### Output with File-Based Config

```json
{
  "source": "file",
  "configPaths": [
    "/Users/tobrien/gitw/grunnverk/kodrdriv/.kodrdriv.yaml"
  ],
  "hierarchical": false,
  "config": {
    "model": "gpt-4o",
    "verbose": false
  },
  "summary": "Configuration loaded from /Users/tobrien/gitw/grunnverk/kodrdriv/.kodrdriv.yaml"
}
```

### Output with MCP Config

```json
{
  "source": "mcp",
  "hierarchical": false,
  "config": {
    "model": "gpt-4o",
    "verbose": true,
    "commit": {
      "add": true,
      "messageLimit": 100
    }
  },
  "summary": "Configuration loaded from MCP invocation"
}
```

## Common Configuration Patterns

### Minimal Configuration

Just set the AI model:

```json
{
  "config": {
    "model": "gpt-4o"
  }
}
```

### Development Configuration

Enable verbose output and self-reflection:

```json
{
  "config": {
    "verbose": true,
    "model": "gpt-4o",
    "commit": {
      "selfReflection": true,
      "maxAgenticIterations": 5
    },
    "release": {
      "selfReflection": true,
      "maxAgenticIterations": 3
    }
  }
}
```

### Production Configuration

Optimize for reliability and safety:

```json
{
  "config": {
    "model": "gpt-4o",
    "dryRun": false,
    "commit": {
      "add": true,
      "interactive": true,
      "maxAgenticIterations": 5
    },
    "publish": {
      "skipAlreadyPublished": true,
      "waitForReleaseWorkflows": true,
      "agenticPublish": true
    }
  }
}
```

### Monorepo Configuration

Configure for multi-package workflows:

```json
{
  "config": {
    "model": "gpt-4o",
    "tree": {
      "parallel": true,
      "maxConcurrency": 4,
      "topological": true
    },
    "link": {
      "scopeRoots": {
        "@grunnverk": "../../grunnverk",
        "@riotprompt": "../../kjerneverk"
      }
    },
    "publish": {
      "agenticPublish": true,
      "skipAlreadyPublished": true
    }
  }
}
```

## Troubleshooting

### Problem: MCP config not being used

**Check**: Run `check_config` and look at the `source` field

If it shows `"source": "file"` instead of `"source": "mcp"`:
1. Verify the `config` field exists in your `mcp.json`
2. Check JSON syntax is valid
3. Restart Cursor
4. Run `check_config` again

### Problem: Configuration validation errors

**Example Error**:
```
Configuration validation failed: openaiReasoning must be one of: low, medium, high
```

**Solution**: Check the field type and allowed values in the [MCP Configuration Guide](../guide/mcp-configuration.md)

### Problem: Want to switch back to file-based config

**Solution**: Simply remove the `config` field from your `mcp.json`:

```json
{
  "mcpServers": {
    "kodrdriv": {
      "command": "node",
      "args": ["/Users/tobrien/gitw/grunnverk/kodrdriv/dist/mcp-server.js"]
      // No "config" field = file-based discovery
    }
  }
}
```

## Next Steps

- Read the [Complete MCP Configuration Guide](../guide/mcp-configuration.md) for all available options
- Check the [Configuration Schema](../guide/configuration.md) for detailed field descriptions
- See [MCP Integration Guide](../MCP_INTEGRATION.md) for tool usage examples

## Related Documentation

- [MCP Configuration Guide](../guide/mcp-configuration.md) - Complete configuration reference
- [CardiganTime MCP Guide](https://utilarium.github.io/cardigantime/#mcp-integration) - Underlying configuration system
- [Kodrdriv Configuration](../guide/configuration.md) - File-based configuration guide
