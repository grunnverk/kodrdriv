/**
 * URI Parser for kodrdriv:// scheme
 *
 * This module provides parsing and building functions for kodrdriv:// URIs,
 * which are used to identify resources in the MCP integration.
 */

/* eslint-disable import/extensions */
import type { KodrdrivUri } from './types.js';
/* eslint-enable import/extensions */

const KODRDRIV_SCHEME = 'kodrdriv:';

/**
 * URI Parse Error
 * Thrown when a URI cannot be parsed
 */
export class UriParseError extends Error {
    constructor(message: string, public uri: string) {
        super(`Failed to parse URI ${uri}: ${message}`);
        this.name = 'UriParseError';
    }
}

/**
 * Parse a kodrdriv:// URI into structured components
 *
 * Supported formats:
 * - kodrdriv://config/path/to/repo
 * - kodrdriv://status/path/to/repo
 * - kodrdriv://workspace
 * - kodrdriv://tree-graph/path/to/monorepo
 * - kodrdriv://package/@scope/package-name
 * - kodrdriv://recent-commits/path/to/repo?count=10
 * - kodrdriv://issues/owner/repo?state=open&milestone=1
 * - kodrdriv://release-notes/owner/repo/version
 *
 * @param uri - The URI to parse
 * @returns Parsed URI components
 * @throws {UriParseError} If the URI is invalid
 */
export function parseKodrdrivUri(uri: string): KodrdrivUri {
    if (!uri.startsWith(KODRDRIV_SCHEME)) {
        throw new UriParseError('URI must start with kodrdriv:', uri);
    }

    // Remove scheme
    const withoutScheme = uri.slice(KODRDRIV_SCHEME.length);

    // Split into path and query
    const [pathPart, queryPart] = withoutScheme.split('?');

    // Parse path: //type/path or //type or /type
    const pathMatch = pathPart.match(/^\/\/([^/]+)(?:\/(.+))?$/);

    if (!pathMatch) {
        throw new UriParseError('Invalid path format', uri);
    }

    const type = pathMatch[1] as KodrdrivUri['type'];
    const path = pathMatch[2] || undefined;

    // Parse query parameters
    const query: Record<string, string> = {};
    if (queryPart) {
        const params = new URLSearchParams(queryPart);
        for (const [key, value] of params.entries()) {
            query[key] = value;
        }
    }

    return {
        scheme: 'kodrdriv',
        type,
        path,
        query: Object.keys(query).length > 0 ? query : undefined,
    };
}

/**
 * Build a kodrdriv:// URI from components
 *
 * @param type - Resource type
 * @param path - Optional resource path
 * @param query - Optional query parameters
 * @returns Built URI string
 */
export function buildKodrdrivUri(
    type: KodrdrivUri['type'],
    path?: string,
    query?: Record<string, string>
): string {
    let uri = `kodrdriv://${type}`;

    if (path) {
        uri += `/${path}`;
    }

    if (query && Object.keys(query).length > 0) {
        const params = new URLSearchParams(query);
        uri += `?${params.toString()}`;
    }

    return uri;
}

// ============================================================================
// Convenience builders for specific resource types
// ============================================================================

/**
 * Build a configuration resource URI
 * @param path - Absolute path to repository
 * @returns kodrdriv://config/path URI
 */
export function buildConfigUri(path: string): string {
    return buildKodrdrivUri('config', path);
}

/**
 * Build a status resource URI
 * @param path - Absolute path to repository
 * @returns kodrdriv://status/path URI
 */
export function buildStatusUri(path: string): string {
    return buildKodrdrivUri('status', path);
}

/**
 * Build a tree-graph resource URI
 * @param path - Absolute path to monorepo
 * @returns kodrdriv://tree-graph/path URI
 */
export function buildTreeGraphUri(path: string): string {
    return buildKodrdrivUri('tree-graph', path);
}

/**
 * Build a package resource URI
 * @param packageName - Package name (e.g., @scope/package)
 * @returns kodrdriv://package/name URI
 */
export function buildPackageUri(packageName: string): string {
    return buildKodrdrivUri('package', packageName);
}

/**
 * Build a recent-commits resource URI
 * @param path - Absolute path to repository
 * @param count - Optional number of commits to retrieve
 * @returns kodrdriv://recent-commits/path?count=N URI
 */
export function buildRecentCommitsUri(path: string, count?: number): string {
    const query = count ? { count: count.toString() } : undefined;
    return buildKodrdrivUri('recent-commits', path, query);
}

/**
 * Build an issues resource URI
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param state - Optional issue state filter
 * @param milestone - Optional milestone ID
 * @returns kodrdriv://issues/owner/repo?... URI
 */
export function buildIssuesUri(
    owner: string,
    repo: string,
    state?: 'open' | 'closed',
    milestone?: string
): string {
    const path = `${owner}/${repo}`;
    const query: Record<string, string> = {};
    if (state) query.state = state;
    if (milestone) query.milestone = milestone;
    return buildKodrdrivUri('issues', path, Object.keys(query).length > 0 ? query : undefined);
}

/**
 * Build a release-notes resource URI
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param version - Release version
 * @returns kodrdriv://release-notes/owner/repo/version URI
 */
export function buildReleaseNotesUri(
    owner: string,
    repo: string,
    version: string
): string {
    return buildKodrdrivUri('release-notes', `${owner}/${repo}/${version}`);
}

/**
 * Build a workspace resource URI
 * @returns kodrdriv://workspace URI
 */
export function buildWorkspaceUri(): string {
    return buildKodrdrivUri('workspace');
}
