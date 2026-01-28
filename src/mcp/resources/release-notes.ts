/**
 * Release Notes Resource Handler
 *
 * Provides release notes via MCP resources
 */

/* eslint-disable import/extensions */
import type { KodrdrivUri, ReleaseNotesResource } from '../types.js';
import { run } from '@grunnverk/git-tools';
/* eslint-enable import/extensions */

/**
 * Read release notes resource
 *
 * URI format: kodrdriv://release-notes/owner/repo/version
 * or: kodrdriv://release-notes/path/to/repo?version=1.0.0&from=v0.9.0
 */
export async function readReleaseNotesResource(uri: KodrdrivUri): Promise<ReleaseNotesResource> {
    const path = uri.path || '';

    // Parse path - could be owner/repo/version or a local path
    const parts = path.split('/');
    let repository: string;
    let version: string;
    let fromTag: string | undefined;

    if (parts.length >= 3 && !path.startsWith('/')) {
        // Format: owner/repo/version
        repository = process.cwd(); // Use current directory for git operations
        version = parts[parts.length - 1];
    } else {
        // Local path
        repository = path || process.cwd();
        version = uri.query?.version || 'HEAD';
        fromTag = uri.query?.from;
    }

    try {
        // Determine tag name
        const tag = version.startsWith('v') ? version : `v${version}`;

        // Get commits since last tag or from specified tag
        let gitLogCmd: string;
        if (fromTag) {
            gitLogCmd = `git log ${fromTag}..${tag} --format="%H|%s"`;
        } else {
            // Get previous tag
            const { stdout: prevTagOutput } = await run(
                `git describe --tags --abbrev=0 ${tag}^ 2>/dev/null || echo ""`,
                { cwd: repository }
            );
            const prevTag = prevTagOutput.trim();

            if (prevTag) {
                gitLogCmd = `git log ${prevTag}..${tag} --format="%H|%s"`;
            } else {
                gitLogCmd = `git log ${tag} --format="%H|%s"`;
            }
        }

        const { stdout: logOutput } = await run(gitLogCmd, { cwd: repository });

        // Parse commits
        const commits = logOutput
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [hash, ...messageParts] = line.split('|');
                return {
                    hash,
                    message: messageParts.join('|'),
                };
            });

        // Generate release notes from commits
        const notes = generateReleaseNotes(commits, version);

        // Get tag date
        let date: string;
        try {
            const { stdout: dateOutput } = await run(
                `git log -1 --format=%ai ${tag}`,
                { cwd: repository }
            );
            date = dateOutput.trim();
        } catch {
            date = new Date().toISOString();
        }

        return {
            repository,
            version,
            tag,
            date,
            notes,
            commits,
        };
    } catch {
        // Return minimal release notes on error
        return {
            repository,
            version,
            tag: version,
            date: new Date().toISOString(),
            notes: 'Release notes unavailable',
            commits: [],
        };
    }
}

/**
 * Generate release notes from commits
 */
function generateReleaseNotes(
    commits: Array<{ hash: string; message: string }>,
    version: string
): string {
    const lines: string[] = [];

    lines.push(`# Release ${version}`);
    lines.push('');

    // Categorize commits
    const features: string[] = [];
    const fixes: string[] = [];
    const other: string[] = [];

    for (const commit of commits) {
        const msg = commit.message.trim();
        const shortHash = commit.hash.substring(0, 7);

        if (msg.match(/^feat(\(.*?\))?:/i)) {
            features.push(`- ${msg} (${shortHash})`);
        } else if (msg.match(/^fix(\(.*?\))?:/i)) {
            fixes.push(`- ${msg} (${shortHash})`);
        } else {
            other.push(`- ${msg} (${shortHash})`);
        }
    }

    // Add sections
    if (features.length > 0) {
        lines.push('## Features');
        lines.push('');
        lines.push(...features);
        lines.push('');
    }

    if (fixes.length > 0) {
        lines.push('## Bug Fixes');
        lines.push('');
        lines.push(...fixes);
        lines.push('');
    }

    if (other.length > 0) {
        lines.push('## Other Changes');
        lines.push('');
        lines.push(...other);
        lines.push('');
    }

    return lines.join('\n');
}
