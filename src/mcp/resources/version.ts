/**
 * Version Resource Handler
 *
 * Provides kodrdriv version information via MCP resources
 */

/* eslint-disable import/extensions */
import type { KodrdrivUri, VersionResource } from '../types.js';
import { VERSION, PROGRAM_NAME } from '../../constants.js';
/* eslint-enable import/extensions */

/**
 * Read version resource
 */
export async function readVersionResource(_uri: KodrdrivUri): Promise<VersionResource> {
    return {
        version: VERSION,
        programName: PROGRAM_NAME,
        fullVersion: `${PROGRAM_NAME} ${VERSION}`,
    };
}
