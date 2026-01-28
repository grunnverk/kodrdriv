/**
 * Tree Publish Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsTree from '@grunnverk/commands-tree';
import { executeCommand, setupPackageFocusCallback, discoverTreePackages } from './shared.js';
/* eslint-enable import/extensions */

export const treePublishTool: McpTool = {
    name: 'kodrdriv_tree_publish',
    description:
        'Publish multiple packages in correct dependency order. ' +
        'Handles version bumping, tagging, and npm publishing for monorepos. ' +
        'Supports resuming from checkpoint after fixing issues.',
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
                description: 'Specific packages to publish',
            },
            version_type: {
                type: 'string',
                description: 'Version bump type: patch, minor, major',
            },
            dry_run: {
                type: 'boolean',
                description: 'Simulate without publishing',
            },
            continue: {
                type: 'boolean',
                description: 'Resume from previous failed execution using checkpoint',
            },
            cleanup: {
                type: 'boolean',
                description: 'Clean up failed state and reset checkpoint',
            },
            start_from: {
                type: 'string',
                description: 'Package name or directory to start from',
            },
        },
    },
};

export async function executeTreePublish(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.tree(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            config.tree.builtInCommand = 'publish';
            if (args.packages) {
                config.tree.packageArgument = args.packages.join(',');
            }
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
            if (args.continue) {
                config.tree.continue = true;
            }
            if (args.cleanup) {
                config.tree.cleanup = true;
            }
            if (!config.publish) {
                config.publish = {};
            }
            config.publish.targetVersion = args.version_type || 'patch';
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
