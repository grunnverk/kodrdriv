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
            'and GitHub release creation in a coordinated flow. ' +
            'Automatically runs development workflow after publish if run_development flag is set.',
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
                run_development: {
                    type: 'boolean',
                    description: 'Automatically run development workflow after publish to bump working branch (default: true)',
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
            },
        },
    },
];

// ============================================================================
// Tool Executors
// ============================================================================

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

async function executeCommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        // Change to target directory if specified
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.commit) {
            config.commit = {};
        }
        config.commit.sendit = args.sendit || false;
        config.commit.interactive = !args.sendit; // Non-interactive if sendit
        config.dryRun = args.dry_run || false;

        if (args.issue) {
            config.commit.context = `GitHub Issue #${args.issue}`;
        }

        const result = await CommandsGit.commit(config);

        // Restore original directory
        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                message: result,
                directory: args.directory || originalCwd,
                committed: args.sendit && !args.dry_run,
            },
            message: args.dry_run ? 'Dry run completed' : 'Commit completed successfully',
        };
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
            },
        };
    }
}

async function executeRelease(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.release) {
            config.release = {};
        }
        config.release.from = args.from_tag;
        config.release.to = args.to_tag;
        config.release.interactive = false; // Non-interactive for MCP

        const result = await CommandsPublish.release(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                releaseNotes: result,
                directory: args.directory || originalCwd,
                version: args.version,
            },
            message: 'Release notes generated successfully',
        };
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
            },
        };
    }
}

async function executePublish(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.publish) {
            config.publish = {};
        }
        config.publish.targetVersion = args.version_type || 'patch';
        config.publish.sendit = !args.dry_run;
        config.publish.interactive = false;
        config.publish.skipUserConfirmation = args.skip_tests || false;
        config.dryRun = args.dry_run || false;

        const result = await CommandsPublish.publish(config);

        // Automatically run development workflow after publish (default: true)
        const runDevelopment = args.run_development !== false;
        let developmentResult: string | undefined;

        if (runDevelopment && !args.dry_run) {
            try {
                // Create config for development command
                const devConfig = createConfig(args, context);
                if (!devConfig.development) {
                    devConfig.development = {};
                }
                devConfig.development.targetVersion = args.version_type || 'patch';
                devConfig.development.tagWorkingBranch = true;
                devConfig.dryRun = args.dry_run || false;

                developmentResult = await CommandsPublish.development(devConfig);
            } catch (devError: any) {
                // Store development error but don't fail publish
                developmentResult = `Development workflow failed: ${devError.message}`;
            }
        }

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                publishResult: result,
                developmentResult: developmentResult,
                directory: args.directory || originalCwd,
                versionType: args.version_type,
            },
            message: args.dry_run ? 'Dry run completed' : (
                developmentResult
                    ? 'Package published successfully and working branch updated'
                    : 'Package published successfully'
            ),
        };
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

async function executeDevelopment(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.development) {
            config.development = {};
        }
        if (args.target_version) {
            config.development.targetVersion = args.target_version;
        }
        if (typeof args.tag_working_branch === 'boolean') {
            config.development.tagWorkingBranch = args.tag_working_branch;
        }
        config.dryRun = args.dry_run || false;

        const result = await CommandsPublish.development(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                result: result,
                directory: args.directory || originalCwd,
                targetVersion: args.target_version,
            },
            message: args.dry_run ? 'Dry run completed' : result,
        };
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
            },
        };
    }
}

async function executePrecommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        config.dryRun = args.dry_run || false;

        const result = await CommandsGit.precommit(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                result: result,
                directory: args.directory || originalCwd,
                fix: args.fix || false,
            },
            message: 'Precommit checks completed successfully',
        };
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
            },
        };
    }
}

async function executeReview(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.review) {
            config.review = {};
        }
        config.review.file = args.review_file;
        config.review.sendit = !args.dry_run;
        config.dryRun = args.dry_run || false;

        const result = await CommandsGit.review(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                reviewResult: result,
                directory: args.directory || originalCwd,
                reviewFile: args.review_file,
            },
            message: args.dry_run ? 'Dry run completed' : 'Review processed successfully',
        };
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
            },
        };
    }
}

async function executePull(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        const result = await CommandsGit.pull(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                pullResult: result,
                directory: args.directory || originalCwd,
                rebase: args.rebase || false,
            },
            message: 'Pull completed successfully',
        };
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
            },
        };
    }
}

// ============================================================================
// Tree Tool Executors
// ============================================================================

async function executeTreeCommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.tree) {
            config.tree = {};
        }
        config.tree.builtInCommand = 'commit';
        if (args.packages) {
            config.tree.packageArgument = args.packages.join(',');
        }
        if (!config.commit) {
            config.commit = {};
        }
        config.commit.sendit = args.sendit || false;

        const result = await CommandsTree.tree(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                result: result,
                directory: args.directory || originalCwd,
                packages: args.packages,
            },
            message: 'Tree commit completed successfully',
        };
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
            },
        };
    }
}

async function executeTreePublish(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.tree) {
            config.tree = {};
        }
        config.tree.builtInCommand = 'publish';
        if (args.packages) {
            config.tree.packageArgument = args.packages.join(',');
        }
        if (!config.publish) {
            config.publish = {};
        }
        config.publish.targetVersion = args.version_type || 'patch';
        config.dryRun = args.dry_run || false;

        const result = await CommandsTree.tree(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                result: result,
                directory: args.directory || originalCwd,
                packages: args.packages,
            },
            message: args.dry_run ? 'Dry run completed' : 'Tree publish completed successfully',
        };
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
                files: commandDetails.files,
            },
        };
    }
}

async function executeTreePrecommit(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.tree) {
            config.tree = {};
        }
        config.tree.builtInCommand = 'precommit';
        if (args.packages) {
            config.tree.packageArgument = args.packages.join(',');
        }

        const result = await CommandsTree.tree(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                result: result,
                directory: args.directory || originalCwd,
                packages: args.packages,
            },
            message: 'Tree precommit checks completed successfully',
        };
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
            },
        };
    }
}

async function executeTreeLink(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.tree) {
            config.tree = {};
        }
        config.tree.builtInCommand = 'link';
        if (args.packages) {
            config.tree.packageArgument = args.packages.join(',');
        }

        const result = await CommandsTree.tree(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                result: result,
                directory: args.directory || originalCwd,
                packages: args.packages,
            },
            message: 'Tree link completed successfully',
        };
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
            },
        };
    }
}

async function executeTreeUnlink(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.tree) {
            config.tree = {};
        }
        config.tree.builtInCommand = 'unlink';
        if (args.packages) {
            config.tree.packageArgument = args.packages.join(',');
        }

        const result = await CommandsTree.tree(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                result: result,
                directory: args.directory || originalCwd,
                packages: args.packages,
            },
            message: 'Tree unlink completed successfully',
        };
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
            },
        };
    }
}

async function executeTreeUpdates(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.tree) {
            config.tree = {};
        }
        if (args.packages) {
            config.tree.packageArgument = args.packages.join(',');
        }

        const result = await CommandsTree.updates(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                updates: result,
                directory: args.directory || originalCwd,
                packages: args.packages,
            },
            message: 'Tree updates check completed successfully',
        };
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
            },
        };
    }
}

async function executeTreePull(args: any, context: ToolExecutionContext): Promise<ToolResult> {
    try {
        const originalCwd = process.cwd();
        if (args.directory) {
            process.chdir(args.directory);
        }

        const config = createConfig(args, context);
        if (!config.tree) {
            config.tree = {};
        }
        config.tree.builtInCommand = 'pull';
        // Note: The tree command doesn't directly support rebase flag,
        // but the individual git pull commands called might

        const result = await CommandsTree.tree(config);

        if (args.directory) {
            process.chdir(originalCwd);
        }

        return {
            success: true,
            data: {
                result: result,
                directory: args.directory || originalCwd,
                rebase: args.rebase || false,
            },
            message: 'Tree pull completed successfully',
        };
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
            },
        };
    }
}
