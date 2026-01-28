/**
 * Release Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsPublish from '@grunnverk/commands-publish';
import { executeCommand } from './shared.js';
/* eslint-enable import/extensions */

export const releaseTool: McpTool = {
    name: 'kodrdriv_release',
    description:
        'Generate comprehensive release notes from git history. ' +
        'Analyzes commits since last release, categorizes changes, ' +
        'formats markdown output, and can create GitHub releases.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Repository directory path',
            },
            version: {
                type: 'string',
                description: 'Release version (e.g., 1.0.0)',
            },
            from_tag: {
                type: 'string',
                description: 'Start tag for release notes (defaults to previous tag)',
            },
            to_tag: {
                type: 'string',
                description: 'End tag for release notes (defaults to HEAD)',
            },
            output: {
                type: 'string',
                description: 'Output file path for release notes',
            },
        },
    },
};

export async function executeRelease(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsPublish.release(config),
        (config, args) => {
            if (!config.release) {
                config.release = {};
            }
            config.release.from = args.from_tag;
            config.release.to = args.to_tag;
            config.release.interactive = false;
        },
        (result, args, originalCwd) => ({
            releaseNotes: result,
            directory: args.directory || originalCwd,
            version: args.version,
        })
    );
}
