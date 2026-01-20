/**
 * MCP Prompt Handlers
 *
 * Provides workflow templates via MCP prompts
 */

/* eslint-disable import/extensions */
import type { McpPrompt, McpPromptMessage } from './types.js';
/* eslint-enable import/extensions */

/**
 * Get all available prompts
 */
export function getPrompts(): McpPrompt[] {
    return [
        {
            name: 'fix_and_commit',
            description: 'Run precommit checks, fix issues, and commit changes',
            arguments: [
                {
                    name: 'directory',
                    description: 'Repository directory',
                    required: false,
                },
            ],
        },
        {
            name: 'prepare_release',
            description: 'Complete release workflow: version bump, release notes, publish',
            arguments: [
                {
                    name: 'version_type',
                    description: 'Version bump type: patch, minor, major',
                    required: true,
                },
            ],
        },
        {
            name: 'monorepo_publish',
            description: 'Guided monorepo publishing workflow',
            arguments: [
                {
                    name: 'packages',
                    description: 'Packages to publish (comma-separated)',
                    required: false,
                },
            ],
        },
        {
            name: 'dependency_update',
            description: 'Check and update dependencies with analysis',
            arguments: [],
        },
        {
            name: 'smart_merge',
            description: 'Handle merge conflicts with context',
            arguments: [
                {
                    name: 'branch',
                    description: 'Branch to merge from',
                    required: true,
                },
            ],
        },
        {
            name: 'issue_from_review',
            description: 'Create GitHub issues from review notes',
            arguments: [
                {
                    name: 'review_file',
                    description: 'Path to review notes file',
                    required: true,
                },
            ],
        },
    ];
}

/**
 * Get a prompt by name
 */
export async function getPrompt(
    name: string,
    args: Record<string, string>
): Promise<McpPromptMessage[]> {
    switch (name) {
        case 'fix_and_commit':
            return getFixAndCommitPrompt(args);
        case 'prepare_release':
            return getPrepareReleasePrompt(args);
        case 'monorepo_publish':
            return getMonorepoPublishPrompt(args);
        case 'dependency_update':
            return getDependencyUpdatePrompt(args);
        case 'smart_merge':
            return getSmartMergePrompt(args);
        case 'issue_from_review':
            return getIssueFromReviewPrompt(args);
        default:
            throw new Error(`Unknown prompt: ${name}`);
    }
}

// ============================================================================
// Prompt Generators
// ============================================================================

async function getFixAndCommitPrompt(args: Record<string, string>): Promise<McpPromptMessage[]> {
    const dir = args.directory || 'current directory';
    return [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Run precommit checks in ${dir}, fix any issues, and commit the changes. Use the kodrdriv_precommit tool with fix=true, then kodrdriv_commit with sendit=true.`,
            },
        },
    ];
}

async function getPrepareReleasePrompt(args: Record<string, string>): Promise<McpPromptMessage[]> {
    const versionType = args.version_type || 'patch';
    return [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Prepare a ${versionType} release: 1) Generate release notes with kodrdriv_release, 2) Review the notes, 3) Publish with kodrdriv_publish version_type="${versionType}".`,
            },
        },
    ];
}

async function getMonorepoPublishPrompt(args: Record<string, string>): Promise<McpPromptMessage[]> {
    const packages = args.packages || 'all packages with changes';
    return [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Publish ${packages} in the monorepo: 1) Run kodrdriv_tree_precommit, 2) Use kodrdriv_tree_publish to publish in dependency order, 3) Verify all packages published successfully.`,
            },
        },
    ];
}

async function getDependencyUpdatePrompt(_args: Record<string, string>): Promise<McpPromptMessage[]> {
    return [
        {
            role: 'user',
            content: {
                type: 'text',
                text: 'Check for dependency updates: 1) Run kodrdriv_tree_updates to find outdated dependencies, 2) Review the updates, 3) Update and test critical dependencies first, 4) Commit the changes.',
            },
        },
    ];
}

async function getSmartMergePrompt(args: Record<string, string>): Promise<McpPromptMessage[]> {
    const branch = args.branch || 'unknown';
    return [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Merge branch "${branch}" intelligently: 1) Use kodrdriv_pull to fetch latest, 2) Attempt merge, 3) If conflicts occur, analyze them and suggest resolutions, 4) After resolving, run kodrdriv_precommit, 5) Commit the merge.`,
            },
        },
    ];
}

async function getIssueFromReviewPrompt(args: Record<string, string>): Promise<McpPromptMessage[]> {
    const reviewFile = args.review_file || 'review notes';
    return [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Create GitHub issues from ${reviewFile}: 1) Use kodrdriv_review with dry_run=true to preview issues, 2) Review the extracted action items, 3) Run kodrdriv_review with dry_run=false to create the issues.`,
            },
        },
    ];
}
