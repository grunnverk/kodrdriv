/**
 * Status Resource Handler
 *
 * Provides git repository status via MCP resources
 */

/* eslint-disable import/extensions */
import type { KodrdrivUri, StatusResource } from '../types.js';
import { getGitStatusSummary } from '@grunnverk/git-tools';
/* eslint-enable import/extensions */

/**
 * Read git status resource
 */
export async function readStatusResource(uri: KodrdrivUri): Promise<StatusResource> {
    const repository = uri.path || process.cwd();

    try {
        const status = await getGitStatusSummary(repository);

        // getGitStatusSummary returns counts, not file lists
        // We'll return empty arrays for now and could enhance this later
        return {
            repository,
            branch: status.branch,
            staged: [],
            modified: [],
            untracked: [],
            ahead: status.unpushedCount,
            behind: 0, // Not provided by getGitStatusSummary
        };
    } catch {
        // Return empty status on error
        return {
            repository,
            branch: 'unknown',
            staged: [],
            modified: [],
            untracked: [],
            ahead: 0,
            behind: 0,
        };
    }
}
