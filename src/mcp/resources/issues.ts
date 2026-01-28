/**
 * GitHub Issues Resource Handler
 *
 * Provides GitHub issues via MCP resources
 */

/* eslint-disable import/extensions */
import type { KodrdrivUri, GitHubIssuesResource } from '../types.js';
import { Octokit } from '@octokit/rest';
/* eslint-enable import/extensions */

/**
 * Read GitHub issues resource
 *
 * URI format: kodrdriv://issues/owner/repo?state=open&milestone=1
 */
export async function readIssuesResource(uri: KodrdrivUri): Promise<GitHubIssuesResource> {
    const path = uri.path || '';
    const [owner, repo] = path.split('/');

    if (!owner || !repo) {
        return {
            repository: path,
            owner: owner || 'unknown',
            repo: repo || 'unknown',
            issues: [],
        };
    }

    try {
        // Check for GitHub token
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN environment variable not set');
        }

        const octokit = new Octokit({ auth: token });

        // Parse query parameters
        const state = uri.query?.state as 'open' | 'closed' | 'all' | undefined;
        const milestone = uri.query?.milestone;

        // Fetch issues
        const response = await octokit.issues.listForRepo({
            owner,
            repo,
            state: state || 'open',
            milestone: milestone || undefined,
            per_page: 100,
        });

        const issues = response.data.map(issue => ({
            number: issue.number,
            title: issue.title,
            state: issue.state as 'open' | 'closed',
            body: issue.body || '',
            createdAt: issue.created_at,
            updatedAt: issue.updated_at,
            labels: issue.labels.map(label =>
                typeof label === 'string' ? label : label.name || ''
            ),
        }));

        return {
            repository: `${owner}/${repo}`,
            owner,
            repo,
            issues,
        };
    } catch {
        // Return empty issues on error
        return {
            repository: `${owner}/${repo}`,
            owner,
            repo,
            issues: [],
        };
    }
}
