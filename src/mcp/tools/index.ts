/**
 * MCP Tool Definitions and Executors
 *
 * Provides MCP tool interfaces for kodrdriv commands
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import { formatErrorForMCP, extractCommandErrorDetails } from '@grunnverk/core';
import { configureTreeExecutionLogger } from './shared.js';

// Core tools
import { getVersionTool, executeGetVersion } from './get-version.js';
import { getConfigTool, executeGetConfig } from './get-config.js';
import { commitTool, executeCommit } from './commit.js';
import { releaseTool, executeRelease } from './release.js';
import { publishTool, executePublish } from './publish.js';
import { developmentTool, executeDevelopment } from './development.js';
import { precommitTool, executePrecommit } from './precommit.js';
import { reviewTool, executeReview } from './review.js';
import { pullTool, executePull } from './pull.js';
import { checkDevelopmentTool, executeCheckDevelopment } from './check-development.js';

// Tree tools
import { treeCommitTool, executeTreeCommit } from './tree-commit.js';
import { treePublishTool, executeTreePublish } from './tree-publish.js';
import { treePrecommitTool, executeTreePrecommit } from './tree-precommit.js';
import { treeLinkTool, executeTreeLink } from './tree-link.js';
import { treeLinkStatusTool, executeTreeLinkStatus } from './tree-link-status.js';
import { treeUnlinkTool, executeTreeUnlink } from './tree-unlink.js';
import { updatesTool, executeUpdates } from './updates.js';
import { treeUpdatesTool, executeTreeUpdates } from './tree-updates.js';
import { treePullTool, executeTreePull } from './tree-pull.js';
/* eslint-enable import/extensions */

// Configure tree-execution logger immediately when this module is loaded
// This ensures tree-execution never uses console.log in MCP mode
configureTreeExecutionLogger();

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
            case 'kodrdriv_get_config':
                return await executeGetConfig(args, context);
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
            // Development readiness check
            case 'kodrdriv_check_development':
                return await executeCheckDevelopment(args, context);
            // Tree tools
            case 'kodrdriv_tree_commit':
                return await executeTreeCommit(args, context);
            case 'kodrdriv_tree_publish':
                return await executeTreePublish(args, context);
            case 'kodrdriv_tree_precommit':
                return await executeTreePrecommit(args, context);
            case 'kodrdriv_tree_link':
                return await executeTreeLink(args, context);
            case 'kodrdriv_tree_link_status':
                return await executeTreeLinkStatus(args, context);
            case 'kodrdriv_tree_unlink':
                return await executeTreeUnlink(args, context);
            case 'kodrdriv_updates':
                return await executeUpdates(args, context);
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
    // Core tools
    getVersionTool,
    getConfigTool,
    commitTool,
    releaseTool,
    publishTool,
    developmentTool,
    precommitTool,
    reviewTool,
    pullTool,
    checkDevelopmentTool,

    // Tree tools
    treeCommitTool,
    treePublishTool,
    treePrecommitTool,
    treeLinkTool,
    treeLinkStatusTool,
    treeUnlinkTool,
    updatesTool,
    treeUpdatesTool,
    treePullTool,
];
