/**
 * Development Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsPublish from '@grunnverk/commands-publish';
import { executeCommand } from './shared.js';
/* eslint-enable import/extensions */

export const developmentTool: McpTool = {
    name: 'kodrdriv_development',
    description:
        'Manage transition to working branch for active development. ' +
        'Switches to working branch, syncs with remote and target branch, ' +
        'tags the current release version, and bumps to next development version.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Repository directory path',
            },
            target_version: {
                type: 'string',
                description: 'Version bump type: patch, minor, major, or explicit version (e.g., 2.1.0)',
            },
            tag_working_branch: {
                type: 'boolean',
                description: 'Tag working branch with current release version before bumping (default: true)',
            },
            dry_run: {
                type: 'boolean',
                description: 'Simulate without making actual changes (default: false)',
            },
        },
    },
};

export async function executeDevelopment(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsPublish.development(config),
        (config, args) => {
            if (!config.development) {
                config.development = {};
            }
            if (args.target_version) {
                config.development.targetVersion = args.target_version;
            }
            if (typeof args.tag_working_branch === 'boolean') {
                config.development.tagWorkingBranch = args.tag_working_branch;
            }
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            targetVersion: args.target_version,
        })
    );
}
