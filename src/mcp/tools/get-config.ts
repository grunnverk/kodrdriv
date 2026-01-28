/**
 * Get Config Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import { getLogger as getCoreLogger } from '@grunnverk/core';
import { DEFAULT_CONFIG_DIR } from '../../constants.js';
import { ConfigSchema } from '../../types.js';
import * as Cardigantime from '@theunwalked/cardigantime';
/* eslint-enable import/extensions */

export const getConfigTool: McpTool = {
    name: 'kodrdriv_get_config',
    description:
        'Get the kodrdriv configuration for a specified directory. ' +
        'Uses CardiganTime to resolve configuration from multiple possible locations ' +
        '(project config files, user config, defaults). Returns the merged configuration ' +
        'including fields like updates.scopes, publish.scopedDependencyUpdates, branches, etc.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Directory to load configuration for (defaults to current directory)',
            },
        },
    },
};

export async function executeGetConfig(args: any, _context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const directory = args.directory || process.cwd();

        // Create a CardiganTime instance to load configuration
        const cardigantimeModule = Cardigantime as any;
        const createCardigantime = cardigantimeModule.create as (params: any) => any;

        const cardigantime = createCardigantime({
            defaults: {
                configDirectory: DEFAULT_CONFIG_DIR,
            },
            configShape: ConfigSchema.shape,
            features: ['config', 'hierarchical'],
            logger: getCoreLogger(),
        });

        // Load configuration for the specified directory
        // CardiganTime will resolve configuration from multiple locations:
        // - Project config files (in the directory)
        // - User config (~/.config/kodrdriv/)
        // - Defaults
        const config = await cardigantime.read({ configDirectory: directory });

        return {
            success: true,
            data: {
                config,
                directory,
                configSources: 'Merged from project config, user config, and defaults',
            },
            message: `Configuration loaded for ${directory}`,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}
