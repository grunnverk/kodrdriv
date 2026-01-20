# KodrDriv MCP Integration

KodrDriv is now fully integrated with the Model Context Protocol (MCP), enabling AI assistants like Cursor to directly invoke kodrdriv commands without shell execution.

## 🎯 Features

### Tools (13 Total)

**Core Git Operations (6)**
- `kodrdriv_commit` - Generate intelligent commit messages
- `kodrdriv_release` - Generate comprehensive release notes
- `kodrdriv_publish` - Automated package publishing workflow
- `kodrdriv_precommit` - Run comprehensive precommit checks
- `kodrdriv_review` - Analyze review notes and create GitHub issues
- `kodrdriv_pull` - Smart git pull with conflict resolution

**Monorepo Operations (7)**
- `kodrdriv_tree_commit` - Commit across multiple packages
- `kodrdriv_tree_publish` - Publish multiple packages in dependency order
- `kodrdriv_tree_precommit` - Run precommit checks across all packages
- `kodrdriv_tree_link` - Link local packages for development
- `kodrdriv_tree_unlink` - Remove workspace links
- `kodrdriv_tree_updates` - Check dependency updates across tree
- `kodrdriv_tree_pull` - Pull updates across entire tree

### Resources (8 Types)

Access read-only data via `kodrdriv://` URIs:
- `kodrdriv://config/{path}` - Repository configuration
- `kodrdriv://status/{path}` - Git repository status
- `kodrdriv://workspace` - Workspace/monorepo structure
- `kodrdriv://tree-graph/{path}` - Dependency graph
- `kodrdriv://package/{name}` - Package information
- `kodrdriv://recent-commits/{path}?count={n}` - Recent commit history
- `kodrdriv://issues/{owner}/{repo}` - GitHub issues
- `kodrdriv://release-notes/{owner}/{repo}/{version}` - Release notes

### Prompts (6 Workflows)

Guided workflow templates:
- `fix_and_commit` - Run precommit, fix errors, commit
- `prepare_release` - Complete release workflow
- `monorepo_publish` - Guided monorepo publishing
- `dependency_update` - Update dependencies with analysis
- `smart_merge` - Handle merge conflicts intelligently
- `issue_from_review` - Create GitHub issues from review notes

## 🚀 Quick Start

### Installation

```bash
npm install @eldrforge/kodrdriv
```

### Using with Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "kodrdriv": {
      "command": "npx",
      "args": ["@eldrforge/kodrdriv-mcp"]
    }
  }
}
```

### Using with MCP Inspector

```bash
npm run mcp:inspect
```

## 📖 Usage Examples

### Commit with AI-Generated Message

In Cursor, simply ask:
> "Use kodrdriv to commit my staged changes"

The AI will invoke `kodrdriv_commit` and generate an intelligent commit message.

### Prepare a Release

> "Prepare a minor release using kodrdriv"

Uses the `prepare_release` prompt to guide through version bumping, release notes, and publishing.

### Monorepo Publishing

> "Publish all changed packages in the monorepo"

Uses `kodrdriv_tree_publish` to handle multi-package publishing in correct dependency order.

### Access Configuration

> "Show me the kodrdriv configuration for this repo"

Reads `kodrdriv://config//Users/path/to/repo` resource.

## 🔧 Development

### Build MCP Server

```bash
npm run mcp:build
```

### Test Compliance

```bash
npm run mcp:test
```

### Watch Mode

```bash
npm run mcp:dev
```

## 📚 Documentation

- [MCP Development Guide](docs/mcp-development.md) - Development workflow
- [Tool Reference](docs/tools.md) - Detailed tool documentation
- [Resource Reference](docs/resources.md) - Resource types and URIs
- [Prompt Reference](docs/prompts.md) - Workflow templates

## 🏗️ Architecture

```
kodrdriv/
├── src/mcp/
│   ├── server.ts      # MCP server entry point
│   ├── types.ts       # Type definitions
│   ├── uri.ts         # URI parser for kodrdriv:// scheme
│   ├── tools.ts       # Tool definitions and executors
│   ├── resources.ts   # Resource handlers
│   └── prompts.ts     # Prompt templates
├── dist/
│   ├── main.js        # CLI entry point
│   └── mcp-server.js  # MCP server (built)
└── scripts/
    └── build-mcp.js   # MCP build script
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## 📄 License

Apache-2.0

## 🔗 Links

- [MCP Specification](https://modelcontextprotocol.io/docs)
- [KodrDriv GitHub](https://github.com/grunnverk/kodrdriv)
- [Report Issues](https://github.com/grunnverk/kodrdriv/issues)
