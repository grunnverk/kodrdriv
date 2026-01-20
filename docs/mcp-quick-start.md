# KodrDriv MCP Quick Start Guide

Get started with KodrDriv's MCP integration in under 5 minutes.

## Installation

```bash
npm install -g @eldrforge/kodrdriv
```

## Using with Cursor

### Step 1: Configure Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "kodrdriv": {
      "command": "kodrdriv-mcp"
    }
  }
}
```

### Step 2: Restart Cursor

Restart Cursor to load the MCP server.

### Step 3: Use KodrDriv Commands

Simply ask in natural language:

- **Commit changes**: "Use kodrdriv to commit my staged changes"
- **Generate release**: "Generate release notes for version 1.2.0 with kodrdriv"
- **Run checks**: "Run precommit checks with kodrdriv"
- **Publish package**: "Publish this package using kodrdriv"

## Quick Examples

### Generate a Commit Message

```
You: "Use kodrdriv to analyze my changes and create a commit message"

AI: [Uses kodrdriv_commit tool]
    Generated commit message: "feat: add user authentication"
```

### Prepare a Release

```
You: "Prepare a minor release with kodrdriv"

AI: [Uses prepare_release prompt]
    1. Generating release notes...
    2. Version will be bumped to 1.2.0
    3. Ready to publish?
```

### Monorepo Publishing

```
You: "Publish all changed packages in the monorepo"

AI: [Uses kodrdriv_tree_publish tool]
    Publishing packages in dependency order:
    1. @eldrforge/core
    2. @eldrforge/git-tools
    3. @eldrforge/kodrdriv
```

## Available Features

### 13 Tools
Run `kodrdriv --help` to see all commands, or ask the AI:
> "What kodrdriv tools are available?"

### 8 Resources
Access repository data:
- Configuration
- Git status
- Workspace structure
- Recent commits
- GitHub issues
- And more...

### 6 Workflow Prompts
Guided multi-step operations:
- Fix and commit
- Prepare release
- Monorepo publish
- Dependency updates
- Smart merge
- Issue creation

## Testing Your Setup

### Method 1: MCP Inspector

```bash
cd /path/to/your/project
npm run mcp:inspect
```

This opens a browser-based inspector where you can:
- See all available tools
- Test tool invocations
- Browse resources
- Try workflow prompts

### Method 2: Direct Test

Ask Cursor:
> "List all kodrdriv MCP tools"

If configured correctly, Cursor will show all 13 tools.

## Troubleshooting

### Cursor Can't Find kodrdriv

**Problem**: "kodrdriv-mcp command not found"

**Solution**: Ensure kodrdriv is installed globally:
```bash
npm install -g @eldrforge/kodrdriv
which kodrdriv-mcp  # Should show path
```

### MCP Server Won't Start

**Problem**: Server fails to start

**Solution**:
1. Check Node.js version: `node --version` (need 24.0.0+)
2. Rebuild: `cd /path/to/kodrdriv && npm run build`
3. Test directly: `node dist/mcp-server.js`

### Tools Return Errors

**Problem**: Tools execute but return errors

**Solution**: Most tools need to run in a git repository:
1. Navigate to a git repo
2. Ensure you have staged changes (for commit)
3. Check that required files exist (for review, etc.)

## Next Steps

1. **Read the Tool Reference**: [mcp-tools-reference.md](mcp-tools-reference.md)
2. **Explore Resources**: [mcp-resources-reference.md](mcp-resources-reference.md)
3. **Try Workflow Prompts**: [mcp-prompts-reference.md](mcp-prompts-reference.md)
4. **Development Guide**: [mcp-development.md](mcp-development.md)

## Getting Help

- **Documentation**: Check the `/docs` folder
- **Issues**: https://github.com/grunnverk/kodrdriv/issues
- **MCP Spec**: https://modelcontextprotocol.io/docs

## What's Different from CLI?

| Feature | CLI | MCP |
|---------|-----|-----|
| **Interface** | Command line | AI assistant |
| **Invocation** | `kodrdriv commit` | "Use kodrdriv to commit" |
| **Parameters** | Flags `--sendit` | Natural language or JSON |
| **Results** | Terminal output | Structured JSON |
| **Workflows** | Manual steps | Guided prompts |
| **Context** | You provide | AI discovers |

## Pro Tips

1. **Use natural language**: The AI understands intent
2. **Let AI choose parameters**: It can infer from context
3. **Try workflow prompts**: They handle complex operations
4. **Access resources**: AI can read config/status before acting
5. **Trust but verify**: Review generated commits/releases before accepting

---

**You're all set!** Start using kodrdriv with your AI assistant.
