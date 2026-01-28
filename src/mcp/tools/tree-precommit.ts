/**
 * Tree Precommit Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsTree from '@grunnverk/commands-tree';
import { executeCommand, setupPackageFocusCallback, discoverTreePackages } from './shared.js';
/* eslint-enable import/extensions */

export const treePrecommitTool: McpTool = {
    name: 'kodrdriv_tree_precommit',
    description:
        'Run precommit checks across all packages in monorepo. ' +
        'Executes linting, tests, and builds in dependency order. ' +
        'Use parallel=true for faster execution on large monorepos.',
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
            fix: {
                type: 'boolean',
                description: 'Auto-fix issues where possible',
            },
            start_from: {
                type: 'string',
                description: 'Package name or directory to start from',
            },
            parallel: {
                type: 'boolean',
                description: 'Execute packages in parallel (faster for large monorepos, default: false)',
            },
        },
    },
};

export async function executeTreePrecommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.tree(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            config.tree.builtInCommand = 'precommit';
            if (args.packages) {
                config.tree.packageArgument = args.packages.join(',');
            }
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
            if (args.fix) {
                config.tree.fix = true;
            }
            if (args.parallel) {
                config.tree.parallel = true;
            }
            // Set up progress callback for package focus
            setupPackageFocusCallback(config, context);
        },
        (result, args, originalCwd) => {
            const data: any = {
                result,
                directory: args.directory || originalCwd,
            };
            if (args.packages && args.packages.length > 0) {
                data.packages = args.packages;
            }
            return data;
        },
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
