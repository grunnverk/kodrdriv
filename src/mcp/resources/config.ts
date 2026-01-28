/**
 * Config Resource Handler
 *
 * Provides access to kodrdriv configuration via MCP resources
 */

/* eslint-disable import/extensions */
import type { KodrdrivUri, ConfigResource } from '../types.js';
import { getLogger as getCoreLogger } from '@grunnverk/core';
import { DEFAULT_CONFIG_DIR } from '../../constants.js';
import { ConfigSchema } from '../../types.js';
import * as Cardigantime from '@theunwalked/cardigantime';
/* eslint-enable import/extensions */

/**
 * Read configuration resource
 */
export async function readConfigResource(uri: KodrdrivUri): Promise<ConfigResource> {
    const directory = uri.path || process.cwd();

    try {
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
        const config = await cardigantime.read({ configDirectory: directory });

        // CardiganTime provides the hierarchy of resolved config directories
        const hierarchy = config.resolvedConfigDirs || [];

        return {
            path: directory,
            exists: true,
            config,
            hierarchy,
        };
    } catch {
        return {
            path: directory,
            exists: false,
            config: undefined,
            hierarchy: [],
        };
    }
}
