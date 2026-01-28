/**
 * Review Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsGit from '@grunnverk/commands-git';
import { executeCommand } from './shared.js';
/* eslint-enable import/extensions */

export const reviewTool: McpTool = {
    name: 'kodrdriv_review',
    description:
        'Analyze review notes and create GitHub issues. ' +
        'Processes structured review comments, extracts action items, ' +
        'and automatically creates issues with proper labels and formatting.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Repository directory path',
            },
            review_file: {
                type: 'string',
                description: 'Path to review notes file',
            },
            dry_run: {
                type: 'boolean',
                description: 'Preview issues without creating them (default: false)',
            },
        },
    },
};

export async function executeReview(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsGit.review(config),
        (config, args) => {
            if (!config.review) {
                config.review = {};
            }
            config.review.file = args.review_file;
            config.review.sendit = !args.dry_run;
        },
        (result, args, originalCwd) => ({
            reviewResult: result,
            directory: args.directory || originalCwd,
            reviewFile: args.review_file,
        })
    );
}
