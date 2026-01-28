/**
 * Get Version Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import { VERSION, PROGRAM_NAME } from '../../constants.js';
/* eslint-enable import/extensions */

export const getVersionTool: McpTool = {
    name: 'kodrdriv_get_version',
    description:
        'Get the current version of kodrdriv including git information and system details. ' +
        'Useful for diagnosing if you are using the latest version.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};

export async function executeGetVersion(_args: any, _context: ToolExecutionContext): Promise<ToolResult> {
    try {
        return {
            success: true,
            data: {
                version: VERSION,
                programName: PROGRAM_NAME,
                fullVersion: `${PROGRAM_NAME} ${VERSION}`,
            },
            message: `${PROGRAM_NAME} ${VERSION}`,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}
