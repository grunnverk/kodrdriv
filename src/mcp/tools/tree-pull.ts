/**
 * Tree Pull Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsTree from '@grunnverk/commands-tree';
import { executeCommand, setupPackageFocusCallback, discoverTreePackages } from './shared.js';
/* eslint-enable import/extensions */

export const treePullTool: McpTool = {
    name: 'kodrdriv_tree_pull',
    description:
        'Pull latest changes across all packages in tree. ' +
        'Coordinates git pull across multiple repositories.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Root directory of monorepo',
            },
            rebase: {
                type: 'boolean',
                description: 'Use rebase instead of merge',
            },
            start_from: {
                type: 'string',
                description: 'Package name or directory to start from',
            },
        },
    },
};

export async function executeTreePull(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.tree(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            config.tree.builtInCommand = 'pull';
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
            // Note: The tree command doesn't directly support rebase flag,
            // but the individual git pull commands called might
            // Set up progress callback for package focus
            setupPackageFocusCallback(config, context);
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            rebase: args.rebase || false,
        }),
        async (args, directory) => {
            // Discover packages upfront for better progress tracking
            const discovery = await discoverTreePackages(
                directory,
                undefined,
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
