/**
 * Updates Tool (single package)
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsTree from '@grunnverk/commands-tree';
import { executeCommand } from './shared.js';
/* eslint-enable import/extensions */

export const updatesTool: McpTool = {
    name: 'kodrdriv_updates',
    description:
        'Check for and update dependencies for a single package (leaf project). ' +
        'Uses npm-check-updates to find latest versions matching configured scopes. ' +
        'Updates dependencies, devDependencies, and peerDependencies sections. ' +
        'For monorepo/tree operations, use kodrdriv_tree_updates instead.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Package directory (defaults to current directory)',
            },
            scope: {
                type: 'string',
                description: 'Specific npm scope to update (e.g., "@grunnverk")',
            },
            scopes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Multiple npm scopes to update (e.g., ["@grunnverk", "@riotprompt"])',
            },
        },
    },
};

export async function executeUpdates(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.updates(config),
        (config, args) => {
            // Configure updates for single package
            if (!config.updates) {
                config.updates = {};
            }
            // Handle scope or scopes parameter
            if (args.scope) {
                config.updates.scope = args.scope;
            }
            if (args.scopes) {
                config.updates.scopes = args.scopes;
            }
        },
        (result, args, originalCwd) => ({
            updates: result,
            directory: args.directory || originalCwd,
            scope: args.scope,
            scopes: args.scopes,
        })
    );
}
