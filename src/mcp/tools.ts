/**
 * MCP Tool Definitions and Wrappers
 *
 * Provides MCP tool interfaces for kodrdriv commands
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from './types.js';
import * as CommandsGit from '@eldrforge/commands-git';
import * as CommandsTree from '@eldrforge/commands-tree';
import * as CommandsPublish from '@eldrforge/commands-publish';
import { formatErrorForMCP, extractCommandErrorDetails } from '@eldrforge/core';
import { VERSION, BUILD_HOSTNAME, BUILD_TIMESTAMP } from '../constants.js';
import { installLogCapture } from './logCapture.js';
/* eslint-enable import/extensions */

/**
 * Base tool executor - wraps command logic
 */
export async function executeTool(
    toolName: string,
    args: Record<string, any>,
    context: ToolExecutionContext
): Promise<ToolResult> {
    try {
        // Route to specific tool handler
        switch (toolName) {
            // Core tools
            case 'kodrdriv_get_version':
                return await executeGetVersion(args, context);
            case 'kodrdriv_commit':
                return await executeCommit(args, context);
            case 'kodrdriv_release':
                return await executeRelease(args, context);
            case 'kodrdriv_publish':
                return await executePublish(args, context);
            case 'kodrdriv_development':
                return await executeDevelopment(args, context);
            case 'kodrdriv_precommit':
                return await executePrecommit(args, context);
            case 'kodrdriv_review':
                return await executeReview(args, context);
            case 'kodrdriv_pull':
                return await executePull(args, context);
            // Tree tools
            case 'kodrdriv_tree_commit':
                return await executeTreeCommit(args, context);
            case 'kodrdriv_tree_publish':
                return await executeTreePublish(args, context);
            case 'kodrdriv_tree_precommit':
                return await executeTreePrecommit(args, context);
            case 'kodrdriv_tree_link':
                return await executeTreeLink(args, context);
            case 'kodrdriv_tree_unlink':
                return await executeTreeUnlink(args, context);
            case 'kodrdriv_tree_updates':
                return await executeTreeUpdates(args, context);
            case 'kodrdriv_tree_pull':
                return await executeTreePull(args, context);
            default:
                return {
                    success: false,
                    error: `Unknown tool: ${toolName}`,
                };
        }
    } catch (error: any) {
        const formatted = formatErrorForMCP(error);
        const commandDetails = extractCommandErrorDetails(error);

        return {
            success: false,
            error: formatted.message,
            context: formatted.context,
            recovery: formatted.recovery,
            details: {
                stdout: commandDetails.stdout,
                stderr: commandDetails.stderr,
                exitCode: commandDetails.exitCode,
                phase: commandDetails.phase,
            },
        };
    }
}

/**
 * Tool definitions array
 */
export const tools: McpTool[] = [
    // ========================================================================
    // Core Tools
    // ========================================================================
    {
        name: 'kodrdriv_get_version',
        description:
            'Get version information for kodrdriv including build metadata. ' +
            'Returns version, git branch, commit hash, build hostname, and build timestamp.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'kodrdriv_commit',
        description:
            'Generate an intelligent commit message from staged changes. ' +
            'Analyzes code diffs, git history, and optionally GitHub issues. ' +
            'Can auto-commit with --sendit flag or return message for review.',
        inputSchema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Repository directory path (defaults to current directory)',
                },
                sendit: {
                    type: 'boolean',
                    description: 'Automatically commit with generated message (default: false)',
                },
                issue: {
                    type: 'string',
                    description: 'GitHub issue number to reference in commit',
                },
                dry_run: {
                    type: 'boolean',
                    description: 'Generate message without committing (default: false)',
                },
                openaiReasoning: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    description: 'OpenAI reasoning level for commit message generation (default: low)',
                },
            },
        },
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
        name: 'kodrdriv_precommit',
        description:
            'Run comprehensive precommit checks. ' +
            'Executes linting, type checking, tests, and build verification. ' +
            'Returns detailed results of all checks.',
        inputSchema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Repository directory path',
                },
                fix: {
                    type: 'boolean',
                    description: 'Attempt to auto-fix issues (default: false)',
                },
                skip_tests: {
                    type: 'boolean',
                    description: 'Skip test execution (default: false)',
                },
            },
        },
    },
    {
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
    },
    {
        name: 'kodrdriv_pull',
        description:
            'Smart git pull with conflict resolution assistance. ' +
            'Pulls latest changes, detects conflicts, and provides ' +
            'intelligent conflict resolution suggestions.',
        inputSchema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Repository directory path',
                },
                rebase: {
                    type: 'boolean',
                    description: 'Use rebase instead of merge (default: false)',
                },
                auto_resolve: {
                    type: 'boolean',
                    description: 'Attempt automatic conflict resolution (default: false)',
                },
            },
        },
    },

    // ========================================================================
    // Tree Tools (Monorepo Operations)
    // ========================================================================
    {
        name: 'kodrdriv_tree_commit',
        description:
            'Generate commit messages and commit changes across multiple packages. ' +
            'Analyzes changes in all packages and creates appropriate commit messages.',
        inputSchema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Root directory of monorepo',
                },
                packages: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific packages to commit (default: all with changes)',
                },
                sendit: {
                    type: 'boolean',
                    description: 'Auto-commit without confirmation',
                },
                start_from: {
                    type: 'string',
                    description: 'Package name or directory to start from',
                },
                openaiReasoning: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    description: 'OpenAI reasoning level for commit message generation (default: low)',
                },
            },
        },
    },
    {
        name: 'kodrdriv_tree_publish',
        description:
            'Publish multiple packages in correct dependency order. ' +
            'Handles version bumping, tagging, and npm publishing for monorepos. ' +
            'Supports resuming from checkpoint after fixing issues.',
        inputSchema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Root directory of monorepo',
                },
                packages: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific packages to publish',
                },
                version_type: {
                    type: 'string',
                    description: 'Version bump type: patch, minor, major',
                },
                dry_run: {
                    type: 'boolean',
                    description: 'Simulate without publishing',
                },
                continue: {
                    type: 'boolean',
                    description: 'Resume from previous failed execution using checkpoint',
                },
                cleanup: {
                    type: 'boolean',
                    description: 'Clean up failed state and reset checkpoint',
                },
                start_from: {
                    type: 'string',
                    description: 'Package name or directory to start from',
                },
            },
        },
    },
    {
        name: 'kodrdriv_tree_precommit',
        description:
            'Run precommit checks across all packages in monorepo. ' +
            'Executes linting, tests, and builds in dependency order.',
        inputSchema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Root directory of monorepo',
                },
                packages: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific packages to check',
                },
                fix: {
                    type: 'boolean',
                    description: 'Auto-fix issues where possible',
                },
                start_from: {
                    type: 'string',
                    description: 'Package name or directory to start from',
                },
            },
        },
    },
    {
        name: 'kodrdriv_tree_link',
        description:
            'Link local packages for development. ' +
            'Sets up workspace links between packages for local testing.',
        inputSchema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Root directory of monorepo',
                },
                packages: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific packages to link',
                },
                start_from: {
                    type: 'string',
                    description: 'Package name or directory to start from',
                },
            },
        },
    },
    {
        name: 'kodrdriv_tree_unlink',
        description:
            'Remove workspace links and restore npm registry versions. ' +
            'Unlinks local packages and reinstalls from registry.',
        inputSchema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Root directory of monorepo',
                },
                packages: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific packages to unlink',
                },
                start_from: {
                    type: 'string',
                    description: 'Package name or directory to start from',
                },
            },
        },
    },
    {
        name: 'kodrdriv_tree_updates',
        description:
            'Check for dependency updates across all packages. ' +
            'Analyzes outdated dependencies and suggests updates.',
        inputSchema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Root directory of monorepo',
                },
                packages: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Specific packages to check',
                },
                start_from: {
                    type: 'string',
                    description: 'Package name or directory to start from',
                },
            },
        },
    },
    {
        name: 'kodrdriv_tree_pull',
        description:
            'Pull latest changes across all packages in tree. ' +
            'Coordinates git pull across multiple repositories.',
        inputSchema: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'Root directory of monorepo',
                },
                rebase: {
                    type: 'boolean',
                    description: 'Use rebase instead of merge',
                },
                start_from: {
                    type: 'string',
                    description: 'Package name or directory to start from',
                },
            },
        },
    },
];

// ============================================================================
// Tool Executors
// ============================================================================

/**
 * Get version information
 */
async function executeGetVersion(_args: any, _context: ToolExecutionContext): Promise<ToolResult> {
    try {
        return {
            success: true,
            data: {
                version: VERSION,
                buildHostname: BUILD_HOSTNAME,
                buildTimestamp: BUILD_TIMESTAMP,
            },
            message: `kodrdriv ${VERSION}\nBuilt on: ${BUILD_HOSTNAME}\nBuild time: ${BUILD_TIMESTAMP}`,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Helper to create Config object from MCP args
 * Returns a config object that's compatible with command functions
 */
function createConfig(args: any, _context: ToolExecutionContext): any {
    return {
        dryRun: args.dry_run || false,
        verbose: false,
        debug: false,
        // Required Cardigantime.Config fields (minimal)
        configDirectory: process.cwd(),
        discoveredConfigDirs: [],
        resolvedConfigDirs: [],
    };
}

/**
 * Generic command executor - wraps command execution with common patterns
 * Handles directory changes, config creation, log capturing, and error formatting
 */
async function executeCommand<T>(
    args: any,
    context: ToolExecutionContext,
    commandFn: (config: any) => Promise<T>,
    configBuilder?: (config: any, args: any) => void,
    resultBuilder?: (result: T, args: any, originalCwd: string) => any
): Promise<ToolResult> {
    const originalCwd = process.cwd();

    // Install log capturing transport on the global logger
    const { getLogs, remove } = installLogCapture();

    // Set up progress polling if callback is provided
    let progressInterval: NodeJS.Timeout | null = null;
    let lastLogCount = 0;
    let progressCounter = 0;

    if (context.progressCallback) {
        // Send initial progress
        context.progressCallback(0, null, 'Starting command...', []);

        // Poll logs every 2 seconds to send progress updates
        progressInterval = setInterval(() => {
            const logs = getLogs();
            const newLogs = logs.slice(lastLogCount);
            lastLogCount = logs.length;

            if (newLogs.length > 0 || logs.length > 0) {
                progressCounter += newLogs.length;
                const latestMessage = newLogs.length > 0
                    ? newLogs[newLogs.length - 1]
                    : logs.length > 0
                        ? logs[logs.length - 1]
                        : 'Processing...';

                // Extract a clean message (remove emoji prefixes)
                const cleanMessage = latestMessage.replace(/^[^\s]+\s/, '').trim() || 'Processing...';

                context.progressCallback!(
                    progressCounter,
                    null,
                    cleanMessage,
                    newLogs.length > 0 ? newLogs : undefined
                );
            }
        }, 2000); // Poll every 2 seconds
    }

    try {
        // Change to target directory if specified
        if (args.directory) {
            process.chdir(args.directory);
        }

        // Create base config
        const config = createConfig(args, context);

        // Allow command-specific config customization
        if (configBuilder) {
            configBuilder(config, args);
        }

        // Execute the command
        const result = await commandFn(config);

        // Stop progress polling
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }

        // Restore original directory
        if (args.directory) {
            process.chdir(originalCwd);
        }

        // Get captured logs and remove transport
        const logs = getLogs();
        remove();

        // Send final progress update
        if (context.progressCallback) {
            const finalMessage = logs.length > 0
                ? logs[logs.length - 1].replace(/^[^\s]+\s/, '').trim()
                : 'Command completed successfully';
            context.progressCallback(logs.length, logs.length, finalMessage, logs);
        }

        // Build the result
        const data = resultBuilder ? resultBuilder(result, args, originalCwd) : { result, directory: args.directory || originalCwd };

        return {
            success: true,
            data,
            message: args.dry_run ? 'Dry run completed' : 'Command completed successfully',
            logs: logs.length > 0 ? logs : ['ℹ️ Command executed successfully (no logs captured)'],
        };
    } catch (error: any) {
        // Stop progress polling on error
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }

        // Restore directory on error
        if (args.directory && process.cwd() !== originalCwd) {
            try {
                process.chdir(originalCwd);
            } catch {
                // Ignore errors restoring directory
            }
        }

        // Get captured logs and remove transport
        const logs = getLogs();
        remove();

        // Send error progress update
        if (context.progressCallback) {
            context.progressCallback(
                logs.length,
                null,
                `Error: ${error.message || 'Command failed'}`,
                logs.length > 0 ? logs : undefined
            );
        }

        const formatted = formatErrorForMCP(error);
        const commandDetails = extractCommandErrorDetails(error);

        // Always include logs, even if empty, so user can see what happened
        const allLogs = logs.length > 0
            ? logs
            : ['ℹ️ Command started but no logs were captured before failure'];

        return {
            success: false,
            error: formatted.message,
            context: formatted.context,
            recovery: formatted.recovery,
            details: {
                stdout: commandDetails.stdout,
                stderr: commandDetails.stderr,
                exitCode: commandDetails.exitCode,
                phase: commandDetails.phase,
                files: commandDetails.files,
            },
            logs: allLogs,
        };
    }
}

async function executeCommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsGit.commit(config),
        (config, args) => {
            if (!config.commit) {
                config.commit = {};
            }
            config.commit.sendit = args.sendit || false;
            config.commit.interactive = !args.sendit;
            if (args.issue) {
                config.commit.context = `GitHub Issue #${args.issue}`;
            }
            // Set reasoning level for commit operations (default: low for faster commits)
            config.openaiReasoning = args.openaiReasoning || 'low';
            config.commit.openaiReasoning = args.openaiReasoning || 'low';
        },
        (result, args, originalCwd) => ({
            message: result,
            directory: args.directory || originalCwd,
            committed: args.sendit && !args.dry_run,
        })
    );
}

async function executeRelease(args: any, context: ToolExecutionContext): Promise<ToolResult> {
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

async function executePublish(args: any, context: ToolExecutionContext): Promise<ToolResult> {
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

async function executeDevelopment(args: any, context: ToolExecutionContext): Promise<ToolResult> {
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

async function executePrecommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsGit.precommit(config),
        (_config, _args) => {
            // No command-specific config needed
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            fix: args.fix || false,
        })
    );
}

async function executeReview(args: any, context: ToolExecutionContext): Promise<ToolResult> {
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

async function executePull(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsGit.pull(config),
        (_config, _args) => {
            // No command-specific config needed
        },
        (result, args, originalCwd) => ({
            pullResult: result,
            directory: args.directory || originalCwd,
            rebase: args.rebase || false,
        })
    );
}

// ============================================================================
// Tree Tool Executors
// ============================================================================

async function executeTreeCommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.tree(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            config.tree.builtInCommand = 'commit';
            if (args.packages) {
                config.tree.packageArgument = args.packages.join(',');
            }
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
            if (!config.commit) {
                config.commit = {};
            }
            config.commit.sendit = args.sendit || false;
            // Set reasoning level for commit operations (default: low for faster commits)
            config.openaiReasoning = args.openaiReasoning || 'low';
            config.commit.openaiReasoning = args.openaiReasoning || 'low';
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            packages: args.packages,
        })
    );
}

async function executeTreePublish(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.tree(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            config.tree.builtInCommand = 'publish';
            if (args.packages) {
                config.tree.packageArgument = args.packages.join(',');
            }
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
            if (args.continue) {
                config.tree.continue = true;
            }
            if (args.cleanup) {
                config.tree.cleanup = true;
            }
            if (!config.publish) {
                config.publish = {};
            }
            config.publish.targetVersion = args.version_type || 'patch';
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            packages: args.packages,
        })
    );
}

async function executeTreePrecommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.tree(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            config.tree.builtInCommand = 'precommit';
            if (args.packages) {
                config.tree.packageArgument = args.packages.join(',');
            }
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
            if (args.fix) {
                config.tree.fix = true;
            }
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            packages: args.packages,
        })
    );
}

async function executeTreeLink(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.tree(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            config.tree.builtInCommand = 'link';
            if (args.packages) {
                config.tree.packageArgument = args.packages.join(',');
            }
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            packages: args.packages,
        })
    );
}

async function executeTreeUnlink(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.tree(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            config.tree.builtInCommand = 'unlink';
            if (args.packages) {
                config.tree.packageArgument = args.packages.join(',');
            }
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            packages: args.packages,
        })
    );
}

async function executeTreeUpdates(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.updates(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            if (args.packages) {
                config.tree.packageArgument = args.packages.join(',');
            }
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
        },
        (result, args, originalCwd) => ({
            updates: result,
            directory: args.directory || originalCwd,
            packages: args.packages,
        })
    );
}

async function executeTreePull(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    return executeCommand(
        args,
        context,
        (config) => CommandsTree.tree(config),
        (config, args) => {
            if (!config.tree) {
                config.tree = {};
            }
            config.tree.builtInCommand = 'pull';
            if (args.start_from) {
                config.tree.startFrom = args.start_from;
            }
            // Note: The tree command doesn't directly support rebase flag,
            // but the individual git pull commands called might
        },
        (result, args, originalCwd) => ({
            result,
            directory: args.directory || originalCwd,
            rebase: args.rebase || false,
        })
    );
}
