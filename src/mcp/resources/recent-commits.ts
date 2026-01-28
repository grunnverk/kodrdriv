/**
 * Recent Commits Resource Handler
 *
 * Provides recent git commit history via MCP resources
 */

/* eslint-disable import/extensions */
import type { KodrdrivUri, RecentCommitsResource } from '../types.js';
import { run } from '@grunnverk/git-tools';
/* eslint-enable import/extensions */

/**
 * Read recent commits resource
 */
export async function readRecentCommitsResource(uri: KodrdrivUri): Promise<RecentCommitsResource> {
    const repository = uri.path || process.cwd();
    const count = uri.query?.count ? parseInt(uri.query.count, 10) : 10;

    try {
        // Get current branch
        const { stdout: branchOutput } = await run('git branch --show-current', { cwd: repository });
        const branch = branchOutput.trim();

        // Get recent commits
        const format = '%H%n%h%n%an%n%ai%n%s%n---COMMIT-END---';
        const { stdout: logOutput } = await run(
            `git log -n ${count} --format="${format}"`,
            { cwd: repository }
        );

        // Parse commits
        const commits = [];
        const commitBlocks = logOutput.split('---COMMIT-END---').filter(block => block.trim());

        for (const block of commitBlocks) {
            const lines = block.trim().split('\n');
            if (lines.length >= 5) {
                commits.push({
                    hash: lines[0],
                    shortHash: lines[1],
                    author: lines[2],
                    date: lines[3],
                    message: lines[4],
                });
            }
        }

        return {
            repository,
            branch,
            commits,
        };
    } catch {
        // Return empty commits on error
        return {
            repository,
            branch: 'unknown',
            commits: [],
        };
    }
}
