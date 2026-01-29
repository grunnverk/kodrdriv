/**
 * Tree Updates Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsTree from '@grunnverk/commands-tree';
import { executeCommand, discoverTreePackages } from './shared.js';
/* eslint-enable import/extensions */

export const treeUpdatesTool: McpTool = {
    name: 'kodrdriv_tree_updates',
    description:
        'Check for dependency updates across all packages in a monorepo/tree. ' +
        'Analyzes outdated dependencies and suggests updates. ' +
        'For single-package operations, use kodrdriv_updates instead.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Root directory of monorepo',
            },
            packages: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific packages to check',
            },
            start_from: {
                type: 'string',
                description: 'Package name or directory to start from',
            },
            scope: {
                type: 'string',
                description: 'Specific npm scope to update (e.g., "@grunnverk")',
            },
            scopes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Multiple npm scopes to update (e.g., @grunnverk, @riotprompt)',
            },
        },
    },
};

export async function executeTreeUpdates(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.updates(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            if (args.packages) {
                config.tree.packageArgument = args.packages.join(',');
            }
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
            // Configure updates for tree
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
            packages: args.packages,
        }),
        async (args, directory) => {
            // Discover packages upfront for better progress tracking
            const discovery = await discoverTreePackages(
                directory,
                args.packages,
                args.start_from
            );
            if (discovery) {
                return {
                    total: discovery.total,
                    message: discovery.message,
                };
            }
            return null;
        }
    );
}
