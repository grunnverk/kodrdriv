#!/usr/bin/env node
/**
 * KodrDriv MCP Server
 *
 * Exposes kodrdriv commands, resources, and prompts via MCP.
 *
 * This server provides:
 * - Tools: Git workflow automation commands (commit, release, publish, etc.)
 * - Resources: Configuration, status, workspace info, GitHub data
 * - Prompts: Workflow templates for common Git operations
 */

/* eslint-disable import/extensions */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools, executeTool } from './tools.js';
import { getResources, readResource } from './resources.js';
import { getPrompts, getPrompt } from './prompts/index.js';
import { getLogger } from '../logging.js';
import winston from 'winston';
/* eslint-enable import/extensions */

/**
 * Error handler wrapper for MCP handlers
 * Logs errors and returns proper MCP error responses
 */
function withErrorLogging<T>(
    handler: () => Promise<T>,
    context: string
): Promise<T> {
    return handler().catch((error) => {
        // eslint-disable-next-line no-console
        console.error(`[MCP Error in ${context}]:`, error);
        throw error;
    });
}

async function main() {
    // Disable console logging in MCP server mode to prevent stdout/stderr pollution
    // Console output interferes with MCP protocol messages over stdio
    const logger = getLogger();
    const transports = (logger as any).transports || [];
    for (const transport of transports) {
        if (transport instanceof winston.transports.Console) {
            logger.remove(transport);
        }
    }

    // Initialize MCP server with full capabilities
    const server = new Server(
        {
            name: 'kodrdriv',
            version: '1.0.0',
            description:
                'AI-powered Git workflow automation. ' +
                'Automates commits, releases, publishing, and monorepo operations. ' +
                'Provides resources for configs, status, and GitHub data.',
        },
        {
            capabilities: {
                tools: {},
                resources: {
                    subscribe: false,
                    listChanged: false,
                },
                prompts: {
                    listChanged: false,
                },
            },
        }
    );

    // ========================================================================
    // Tools Handlers
    // ========================================================================

    /**
     * List available tools
     */
    server.setRequestHandler(ListToolsRequestSchema, async () =>
        withErrorLogging(async () => ({
            tools: tools,
        }), 'ListTools')
    );

    /**
     * Call a tool
     */
    server.setRequestHandler(CallToolRequestSchema, async (request) =>
        withErrorLogging(async () => {
            const context = {
                workingDirectory: process.cwd(),
                config: undefined,
                logger: undefined,
            };

            const result = await executeTool(
                request.params.name,
                request.params.arguments || {},
                context
            );

            if (result.success) {
                // Build response with logs if available
                const content: Array<{ type: 'text'; text: string }> = [];

                // Add logs first if they exist
                if (result.logs && result.logs.length > 0) {
                    content.push({
                        type: 'text' as const,
                        text: '=== Command Output ===\n' + result.logs.join('\n') + '\n\n=== Result ===',
                    });
                }

                // Add the result data
                content.push({
                    type: 'text' as const,
                    text: JSON.stringify(result.data, null, 2),
                });

                return { content };
            } else {
                // Build error response with logs if available
                const errorParts: string[] = [];

                if (result.logs && result.logs.length > 0) {
                    errorParts.push('=== Command Output ===');
                    errorParts.push(result.logs.join('\n'));
                    errorParts.push('\n=== Error ===');
                }

                errorParts.push(result.error || 'Unknown error');

                if (result.recovery && result.recovery.length > 0) {
                    errorParts.push('\n=== Recovery Steps ===');
                    errorParts.push(...result.recovery.map((step, i) => `${i + 1}. ${step}`));
                }

                return {
                    content: [{
                        type: 'text' as const,
                        text: errorParts.join('\n'),
                    }],
                    isError: true,
                };
            }
        }, `CallTool:${request.params.name}`)
    );

    // ========================================================================
    // Resources Handlers
    // ========================================================================

    /**
     * List available resources
     */
    server.setRequestHandler(ListResourcesRequestSchema, async () =>
        withErrorLogging(async () => ({
            resources: getResources(),
        }), 'ListResources')
    );

    /**
     * Read a resource
     */
    server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
        withErrorLogging(async () => {
            const data = await readResource(request.params.uri);
            return {
                contents: [{
                    uri: request.params.uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(data, null, 2),
                }],
            };
        }, `ReadResource:${request.params.uri}`)
    );

    // ========================================================================
    // Prompts Handlers
    // ========================================================================

    /**
     * List available prompts
     */
    server.setRequestHandler(ListPromptsRequestSchema, async () =>
        withErrorLogging(async () => ({
            prompts: getPrompts(),
        }), 'ListPrompts')
    );

    /**
     * Get a prompt
     */
    server.setRequestHandler(GetPromptRequestSchema, async (request) =>
        withErrorLogging(async () => {
            const messages = await getPrompt(
                request.params.name,
                request.params.arguments || {}
            );
            return {
                messages: messages,
            };
        }, `GetPrompt:${request.params.name}`)
    );

    // ========================================================================
    // Start Server
    // ========================================================================

    const transport = new StdioServerTransport();
    await server.connect(transport);

    // eslint-disable-next-line no-console
    console.error('KodrDriv MCP server started');
}

// eslint-disable-next-line no-console
main().catch(console.error);
