/**
 * Tree Link Status Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsTree from '@grunnverk/commands-tree';
import { executeCommand } from './shared.js';
/* eslint-enable import/extensions */

export const treeLinkStatusTool: McpTool = {
    name: 'kodrdriv_tree_link_status',
    description:
        'Check link status across all packages in monorepo. ' +
        'Shows which packages have linked dependencies and where they point.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Root directory of monorepo',
            },
        },
    },
};

export async function executeTreeLinkStatus(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.tree(config),
        (config, _args) => {
            if (!config.tree) {
                config.tree = {};
            }
            config.tree.builtInCommand = 'link';
            config.tree.packageArgument = 'status';
        },
        (result, args, originalCwd) => ({
            status: result,
            directory: args.directory || originalCwd,
        })
    );
}
