/**
 * Publish Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import * as CommandsPublish from '@grunnverk/commands-publish';
import { executeCommand } from './shared.js';
/* eslint-enable import/extensions */

export const publishTool: McpTool = {
    name: 'kodrdriv_publish',
    description:
        'Automated package publishing workflow. ' +
        'Handles version bumping, git tagging, npm publishing, ' +
        'and GitHub release creation in a coordinated flow.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Package directory path',
            },
            version_type: {
                type: 'string',
                description: 'Version bump type: patch, minor, major, or explicit version',
            },
            dry_run: {
                type: 'boolean',
                description: 'Simulate publish without actual changes (default: false)',
            },
            skip_tests: {
                type: 'boolean',
                description: 'Skip running tests before publish (default: false)',
            },
        },
    },
};

export async function executePublish(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsPublish.publish(config),
        (config, args) => {
            if (!config.publish) {
                config.publish = {};
            }
            config.publish.targetVersion = args.version_type || 'patch';
            config.publish.sendit = !args.dry_run;
            config.publish.interactive = false;
            config.publish.skipUserConfirmation = args.skip_tests || false;
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            versionType: args.version_type,
        })
    );
}
