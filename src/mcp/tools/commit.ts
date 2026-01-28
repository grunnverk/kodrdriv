/**
 * Commit Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsGit from '@grunnverk/commands-git';
import { executeCommand } from './shared.js';
/* eslint-enable import/extensions */

export const commitTool: McpTool = {
    name: 'kodrdriv_commit',
    description:
        'Generate an intelligent commit message from staged changes. ' +
        'Analyzes code diffs, git history, and optionally GitHub issues. ' +
        'Can auto-commit with --sendit flag or return message for review.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Repository directory path (defaults to current directory)',
            },
            sendit: {
                type: 'boolean',
                description: 'Automatically commit with generated message (default: false)',
            },
            issue: {
                type: 'string',
                description: 'GitHub issue number to reference in commit',
            },
            dry_run: {
                type: 'boolean',
                description: 'Generate message without committing (default: false)',
            },
            openaiReasoning: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'OpenAI reasoning level for commit message generation (default: low)',
            },
        },
    },
};

export async function executeCommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsGit.commit(config),
        (config, args) => {
            if (!config.commit) {
                config.commit = {};
            }
            config.commit.sendit = args.sendit || false;
            config.commit.interactive = !args.sendit;
            if (args.issue) {
                config.commit.context = `GitHub Issue #${args.issue}`;
            }
            // Set reasoning level for commit operations (default: low for faster commits)
            config.openaiReasoning = args.openaiReasoning || 'low';
            config.commit.openaiReasoning = args.openaiReasoning || 'low';
        },
        (result, args, originalCwd) => ({
            message: result,
            directory: args.directory || originalCwd,
            committed: args.sendit && !args.dry_run,
        })
    );
}
