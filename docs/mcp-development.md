# MCP Development Workflow

## Overview

KodrDriv now includes MCP (Model Context Protocol) integration, allowing AI assistants like Cursor to directly invoke kodrdriv commands without shell execution. This document describes the development workflow for working with the MCP server.

## Setup

### Prerequisites

- Node.js >= 24.0.0
- npm or equivalent package manager
- All dependencies installed (`npm install`)

### Installation

Dependencies are automatically installed with the project:
- `@modelcontextprotocol/sdk` - Core MCP SDK (production dependency)
- `@modelcontextprotocol/inspector` - Development/testing tool (dev dependency)

```bash
npm install
```

## Project Structure

```
kodrdriv/
├── src/
│   ├── mcp/
│   │   ├── server.ts      # MCP server entry point
│   │   └── index.ts       # MCP module exports
│   └── main.ts            # CLI entry point (unchanged)
├── scripts/
│   ├── build-mcp.js       # MCP server build script
│   └── test-mcp-compliance.js  # MCP compliance tests
├── dist/
│   ├── mcp-server.js      # Built MCP server (after build)
│   └── main.js            # Built CLI (after build)
└── package.json
```

## Development Commands

### Building

Build the entire project including MCP server:
```bash
npm run build
```

This runs:
1. Lint check
2. TypeScript type checking
3. Vite build (main CLI)
4. MCP server build (esbuild)
5. Copy markdown files
6. Set file permissions

Build only the MCP server:
```bash
node scripts/build-mcp.js
```

### Watch Mode

Watch for changes and rebuild automatically:
```bash
npm run watch      # Watch main CLI
npm run mcp:dev    # Watch MCP server (placeholder - to be implemented)
```

### Testing

Run all tests:
```bash
npm test
```

Run MCP compliance tests:
```bash
npm run mcp:test
```

Note: Compliance tests are initially stubbed and will be implemented incrementally in Phases 01-05.

### Linting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Precommit

Run the full precommit check (lint + build + test):
```bash
npm run precommit
```

### MCP Inspector

Launch the MCP Inspector for interactive testing:
```bash
npm run mcp:inspect
```

This will:
1. Start the MCP server
2. Launch a browser with the Inspector UI
3. Allow you to interactively test tools, resources, and prompts

Note: The inspector command may need adjustment based on your specific setup.

## Development Workflow

### Making Changes

1. **Make changes** to MCP-related code in `src/mcp/`
2. **Build** the project: `npm run build`
3. **Test** with compliance tests: `npm run mcp:test`
4. **Inspect** with MCP Inspector: `npm run mcp:inspect`
5. **Verify** all tests pass: `npm test`
6. **Run precommit**: `npm run precommit`

### Adding New MCP Tools

1. Add tool definition in appropriate phase (see EXECUTION_PLAN.md)
2. Implement tool handler in `src/mcp/tools.ts` (to be created in Phase 02)
3. Register tool in `src/mcp/server.ts`
4. Add tests in `tests/mcp/tools.test.ts`
5. Update compliance tests in `scripts/test-mcp-compliance.js`

### Adding New Resources

1. Add resource type definition (Phase 04)
2. Implement resource handler in `src/mcp/resources.ts` (to be created)
3. Register resource in `src/mcp/server.ts`
4. Add tests
5. Update compliance tests

### Adding New Prompts

1. Add prompt definition (Phase 05)
2. Implement prompt handler in `src/mcp/prompts.ts` (to be created)
3. Register prompt in `src/mcp/server.ts`
4. Add tests
5. Update compliance tests

## Testing

### Unit Tests

Standard unit tests using Vitest:
```bash
npm test
```

### MCP Compliance Tests

Validates that the MCP server follows the MCP specification:
```bash
npm run mcp:test
```

These tests check:
- Server initialization
- Capabilities advertisement
- Tools endpoint responses
- Resources endpoint responses (when implemented)
- Prompts endpoint responses (when implemented)

### Manual Testing with Inspector

The MCP Inspector provides a browser-based UI for testing:
```bash
npm run mcp:inspect
```

Use the Inspector to:
- Verify all capabilities are advertised
- Test tool invocations
- Browse available resources
- Execute prompts
- Debug protocol messages

### Integration Testing with Cursor

1. Build the project: `npm run build`
2. Configure Cursor to use the MCP server
3. Test actual workflows in Cursor

## Debugging

### Enable Verbose Logging

Add logging to the MCP server as needed:
```typescript
console.error('[DEBUG]', message); // Use console.error for MCP servers
```

### Check MCP Inspector Console

The Inspector's browser console shows all protocol messages.

### Use TypeScript Source Maps

Source maps are enabled by default for debugging:
```bash
npm run build  # Builds with sourcemap: true
```

### Review MCP SDK Documentation

- [MCP Specification](https://modelcontextprotocol.io/docs)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)

## Build Configuration

### Main CLI Build

The main CLI is built with Vite (configured in `vite.config.ts`):
- Uses VitePluginNode for Node.js compatibility
- Preserves module structure
- External dependencies are not bundled
- Entry point: `src/main.ts`
- Output: `dist/main.js`

### MCP Server Build

The MCP server is built with esbuild (via `scripts/build-mcp.js`):
- Bundles the server code
- External dependencies: MCP SDK, eldrforge packages, etc.
- Entry point: `src/mcp/server.ts`
- Output: `dist/mcp-server.js`
- Includes shebang for executable permissions

This separate build process was necessary because Vite's lib mode with preserveModules doesn't handle multiple independent entry points well.

## Common Issues

### Build Failures

**Issue**: MCP server not built
- **Solution**: Run `npm run build` which includes MCP server build
- **Alternative**: Manually run `node scripts/build-mcp.js`

**Issue**: Linting errors in MCP files
- **Solution**: MCP SDK imports require `.js` extensions (ESM). Use `/* eslint-disable import/extensions */` comments.

### Test Failures

**Issue**: Sandbox restrictions preventing .git directory creation
- **Note**: This is expected in sandboxed environments and doesn't indicate a problem with MCP code.

### Runtime Errors

**Issue**: Module not found errors
- **Solution**: Ensure all external dependencies are listed in `scripts/build-mcp.js` external array

**Issue**: MCP server doesn't respond
- **Solution**: Check that server is using stdio transport correctly. MCP servers communicate via stdin/stdout.

## Phase-Specific Notes

### Phase 00 (Current): Preparation
- MCP server structure created
- Build process established
- Inspector configured
- Compliance test framework in place
- Server is a placeholder with no actual functionality yet

### Phase 01: Infrastructure
- Will implement full server initialization
- Add MCP type definitions
- Create URI parser
- Implement basic server capabilities

### Phase 02: Core Tools
- Will implement first 6 essential MCP tools
- Wrap core kodrdriv commands
- Add tool tests

### Phase 03-05: Additional Features
- Tree operations, resources, and prompts
- See EXECUTION_PLAN.md for details

## Contributing

When adding MCP features:
1. Follow the phase structure in EXECUTION_PLAN.md
2. Update STATUS.md after completing tasks
3. Add comprehensive tests
4. Update this documentation as needed
5. Ensure `npm run precommit` passes

## Resources

- **Execution Plan**: `plans/kodrdriv-mcp/EXECUTION_PLAN.md`
- **Status**: `plans/kodrdriv-mcp/STATUS.md`
- **Phase Plans**: `plans/kodrdriv-mcp/plans/00-*.md`
- **MCP Specification**: https://modelcontextprotocol.io/docs
- **MCP SDK**: https://github.com/modelcontextprotocol/sdk

## Support

For issues or questions:
1. Check this documentation
2. Review EXECUTION_PLAN.md
3. Consult STATUS.md for current progress
4. Check MCP SDK documentation
