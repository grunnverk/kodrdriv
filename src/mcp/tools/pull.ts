/**
 * Pull Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsGit from '@grunnverk/commands-git';
import { executeCommand } from './shared.js';
/* eslint-enable import/extensions */

export const pullTool: McpTool = {
    name: 'kodrdriv_pull',
    description:
        'Smart git pull with conflict resolution assistance. ' +
        'Pulls latest changes, detects conflicts, and provides ' +
        'intelligent conflict resolution suggestions.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Repository directory path',
            },
            rebase: {
                type: 'boolean',
                description: 'Use rebase instead of merge (default: false)',
            },
            auto_resolve: {
                type: 'boolean',
                description: 'Attempt automatic conflict resolution (default: false)',
            },
        },
    },
};

export async function executePull(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsGit.pull(config),
        (_config, _args) => {
            // No command-specific config needed
        },
        (result, args, originalCwd) => ({
            pullResult: result,
            directory: args.directory || originalCwd,
            rebase: args.rebase || false,
        })
    );
}
