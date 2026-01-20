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
 *
 * Uses McpServer high-level API for better progress notification support
 */

/* eslint-disable import/extensions */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { executeTool } from './tools.js';
import { getResources, readResource } from './resources.js';
import { getPrompts, getPrompt } from './prompts/index.js';
import { getLogger } from '../logging.js';
import winston from 'winston';
/* eslint-enable import/extensions */

/**
 * Recursively remove undefined values from an object to prevent JSON serialization issues
 * Preserves null values as they are valid in JSON
 * @internal - Exported for testing purposes
 */
export function removeUndefinedValues(obj: any): any {
    if (obj === undefined) {
        return undefined;
    }
    if (obj === null) {
        return null; // Preserve null as it's valid in JSON
    }
    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedValues).filter(item => item !== undefined);
    }
    if (typeof obj === 'object') {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = removeUndefinedValues(value);
            if (cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
            }
        }
        return cleaned;
    }
    return obj;
}

async function main() {
    // Mark that we're running as MCP server - this prevents child processes from using stdio: 'inherit'
    // Child processes should use stdio: 'pipe' and output should go through the logger
    process.env.KODRDRIV_MCP_SERVER = 'true';

    // Disable console logging in MCP server mode to prevent stdout/stderr pollution
    // Console output interferes with MCP protocol messages over stdio
    // The KODRDRIV_MCP_SERVER env var is already set above, which will prevent
    // createTransports from adding console transports. But we also remove any
    // existing console transports that might have been added before the env var was set.
    const logger = getLogger();

    // Remove all console transports - iterate over a copy of the array since we're modifying it
    const transports = [...((logger as any).transports || [])];
    for (const transport of transports) {
        if (transport instanceof winston.transports.Console) {
            logger.remove(transport);
        }
    }

    // Initialize MCP server with high-level API
    const server = new McpServer(
        {
            name: 'kodrdriv',
            version: '1.0.0',
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
     * Helper to register a tool with progress notification support
     */
    function registerTool(
        name: string,
        description: string,
        inputSchema: z.ZodRawShape
    ) {
        server.tool(
            name,
            description,
            inputSchema,
            async (args, { sendNotification, _meta }) => {
                const context = {
                    workingDirectory: process.cwd(),
                    config: undefined,
                    logger: undefined,
                    sendNotification: async (notification: {
                        method: string;
                        params: {
                            progressToken?: string | number;
                            progress: number;
                            total?: number;
                            message?: string;
                        };
                    }) => {
                        // Use sendNotification directly with proper typing
                        if (notification.method === 'notifications/progress' && _meta?.progressToken) {
                            // Build params object, removing undefined values to prevent JSON serialization issues
                            const params: Record<string, any> = {
                                progressToken: _meta.progressToken,
                                progress: notification.params.progress,
                            };
                            if (notification.params.total !== undefined) {
                                params.total = notification.params.total;
                            }
                            if (notification.params.message !== undefined) {
                                params.message = notification.params.message;
                            }
                            await sendNotification({
                                method: 'notifications/progress',
                                params: removeUndefinedValues(params) as any,
                            });
                        }
                    },
                    progressToken: _meta?.progressToken,
                };

                const result = await executeTool(name, args, context);

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
                    // Remove undefined values to prevent JSON serialization issues
                    const cleanData = removeUndefinedValues(result.data);
                    content.push({
                        type: 'text' as const,
                        text: JSON.stringify(cleanData, null, 2),
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
            }
        );
    }

    // Register all tools
    // Core tools
    registerTool(
        'kodrdriv_get_version',
        'Get version information for kodrdriv including build metadata. Returns version, git branch, commit hash, build hostname, and build timestamp.',
        {},
    );

    registerTool(
        'kodrdriv_commit',
        'Generate an intelligent commit message from staged changes. Analyzes code diffs, git history, and optionally GitHub issues. Can auto-commit with --sendit flag or return message for review.',
        {
            directory: z.string().optional(),
            sendit: z.boolean().optional(),
            issue: z.string().optional(),
            dry_run: z.boolean().optional(),
            openaiReasoning: z.enum(['low', 'medium', 'high']).optional(),
        }
    );

    registerTool(
        'kodrdriv_release',
        'Generate comprehensive release notes from git history. Analyzes commits since last release, categorizes changes, formats markdown output, and can create GitHub releases.',
        {
            directory: z.string().optional(),
            version: z.string().optional(),
            from_tag: z.string().optional(),
            to_tag: z.string().optional(),
            output: z.string().optional(),
        }
    );

    registerTool(
        'kodrdriv_publish',
        'Automated package publishing workflow. Handles version bumping, git tagging, npm publishing, and GitHub release creation in a coordinated flow.',
        {
            directory: z.string().optional(),
            version_type: z.string().optional(),
            dry_run: z.boolean().optional(),
            skip_tests: z.boolean().optional(),
        }
    );

    registerTool(
        'kodrdriv_development',
        'Manage transition to working branch for active development. Switches to working branch, syncs with remote and target branch, tags the current release version, and bumps to next development version.',
        {
            directory: z.string().optional(),
            target_version: z.string().optional(),
            tag_working_branch: z.boolean().optional(),
            dry_run: z.boolean().optional(),
        }
    );

    registerTool(
        'kodrdriv_precommit',
        'Run comprehensive precommit checks. Executes linting, type checking, tests, and build verification. Returns detailed results of all checks.',
        {
            directory: z.string().optional(),
            fix: z.boolean().optional(),
            skip_tests: z.boolean().optional(),
        }
    );

    registerTool(
        'kodrdriv_review',
        'Analyze review notes and create GitHub issues. Processes structured review comments, extracts action items, and automatically creates issues with proper labels and formatting.',
        {
            directory: z.string().optional(),
            review_file: z.string().optional(),
            dry_run: z.boolean().optional(),
        }
    );

    registerTool(
        'kodrdriv_pull',
        'Smart git pull with conflict resolution assistance. Pulls latest changes, detects conflicts, and provides intelligent conflict resolution suggestions.',
        {
            directory: z.string().optional(),
            rebase: z.boolean().optional(),
            auto_resolve: z.boolean().optional(),
        }
    );

    // Tree tools
    registerTool(
        'kodrdriv_tree_commit',
        'Generate commit messages and commit changes across multiple packages. Analyzes changes in all packages and creates appropriate commit messages.',
        {
            directory: z.string().optional(),
            packages: z.array(z.string()).optional(),
            sendit: z.boolean().optional(),
            start_from: z.string().optional(),
            openaiReasoning: z.enum(['low', 'medium', 'high']).optional(),
        }
    );

    registerTool(
        'kodrdriv_tree_publish',
        'Publish multiple packages in correct dependency order. Handles version bumping, tagging, and npm publishing for monorepos. Supports resuming from checkpoint after fixing issues.',
        {
            directory: z.string().optional(),
            packages: z.array(z.string()).optional(),
            version_type: z.string().optional(),
            dry_run: z.boolean().optional(),
            continue: z.boolean().optional(),
            cleanup: z.boolean().optional(),
            start_from: z.string().optional(),
        }
    );

    registerTool(
        'kodrdriv_tree_precommit',
        'Run precommit checks across all packages in monorepo. Executes linting, tests, and builds in dependency order.',
        {
            directory: z.string().optional(),
            packages: z.array(z.string()).optional(),
            fix: z.boolean().optional(),
            start_from: z.string().optional(),
        }
    );

    registerTool(
        'kodrdriv_tree_link',
        'Link local packages for development. Sets up workspace links between packages for local testing.',
        {
            directory: z.string().optional(),
            packages: z.array(z.string()).optional(),
            start_from: z.string().optional(),
        }
    );

    registerTool(
        'kodrdriv_tree_unlink',
        'Remove workspace links and restore npm registry versions. Unlinks local packages and reinstalls from registry.',
        {
            directory: z.string().optional(),
            packages: z.array(z.string()).optional(),
            start_from: z.string().optional(),
        }
    );

    registerTool(
        'kodrdriv_tree_updates',
        'Check for dependency updates across all packages. Analyzes outdated dependencies and suggests updates.',
        {
            directory: z.string().optional(),
            packages: z.array(z.string()).optional(),
            start_from: z.string().optional(),
        }
    );

    registerTool(
        'kodrdriv_tree_pull',
        'Pull latest changes across all packages in tree. Coordinates git pull across multiple repositories.',
        {
            directory: z.string().optional(),
            rebase: z.boolean().optional(),
            start_from: z.string().optional(),
        }
    );

    // ========================================================================
    // Resources Handlers
    // ========================================================================

    const resources = getResources();
    for (const resource of resources) {
        server.resource(
            resource.name,
            resource.uri,
            {
                description: resource.description || '',
            },
            async () => {
                const data = await readResource(resource.uri);
                return {
                    contents: [{
                        uri: resource.uri,
                        mimeType: resource.mimeType || 'application/json',
                        text: JSON.stringify(data, null, 2),
                    }],
                };
            }
        );
    }

    // ========================================================================
    // Prompts Handlers
    // ========================================================================

    const prompts = getPrompts();
    for (const prompt of prompts) {
        // Convert prompt arguments to zod schema
        const promptArgs: Record<string, z.ZodTypeAny> = {};
        if (prompt.arguments) {
            for (const arg of prompt.arguments) {
                promptArgs[arg.name] = arg.required ? z.string() : z.string().optional();
            }
        }
        server.prompt(
            prompt.name,
            prompt.description,
            promptArgs,
            async (args, _extra) => {
                // Convert args to Record<string, string> for getPrompt
                const argsRecord: Record<string, string> = {};
                for (const [key, value] of Object.entries(args)) {
                    if (typeof value === 'string') {
                        argsRecord[key] = value;
                    }
                }
                const messages = await getPrompt(prompt.name, argsRecord);
                // Convert McpPromptMessage[] to the format expected by the SDK
                return {
                    messages: messages.map(msg => {
                        if (msg.content.type === 'text') {
                            return {
                                role: msg.role,
                                content: {
                                    type: 'text' as const,
                                    text: msg.content.text || '',
                                },
                            };
                        }
                        // For other content types, return as-is (may need adjustment)
                        return msg as any;
                    }),
                };
            }
        );
    }

    // ========================================================================
    // Start Server
    // ========================================================================

    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Do NOT write to console in MCP server mode - it interferes with the protocol
    // All output should go through the logger and be captured via logCapture
    // The server is ready when connect() resolves
}

// Handle errors silently in MCP mode - errors should be sent via MCP protocol, not stderr
main().catch((_error) => {
    // In MCP mode, we can't write to stderr, so we just exit with error code
    // The error will be visible in the MCP client logs if the server fails to start
    process.exit(1);
});
