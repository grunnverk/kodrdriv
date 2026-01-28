/**
 * Precommit Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsGit from '@grunnverk/commands-git';
import { executeCommand } from './shared.js';
/* eslint-enable import/extensions */

export const precommitTool: McpTool = {
    name: 'kodrdriv_precommit',
    description:
        'Run comprehensive precommit checks. ' +
        'Executes linting, type checking, tests, and build verification. ' +
        'Returns detailed results of all checks.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Repository directory path',
            },
            fix: {
                type: 'boolean',
                description: 'Attempt to auto-fix issues (default: false)',
            },
            skip_tests: {
                type: 'boolean',
                description: 'Skip test execution (default: false)',
            },
        },
    },
};

export async function executePrecommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsGit.precommit(config),
        (_config, _args) => {
            // No command-specific config needed
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            fix: args.fix || false,
        })
    );
}
