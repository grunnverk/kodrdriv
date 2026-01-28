/**
 * MCP Resource Handlers
 *
 * Provides read-only access to kodrdriv data via MCP resources
 */

/* eslint-disable import/extensions */
import type {
    McpResource,
} from '../types.js';
import { parseKodrdrivUri } from '../uri.js';
import { readConfigResource } from './config.js';
import { readStatusResource } from './status.js';
import { readWorkspaceResource } from './workspace.js';
import { readTreeGraphResource } from './tree-graph.js';
import { readPackageResource } from './package.js';
import { readRecentCommitsResource } from './recent-commits.js';
import { readIssuesResource } from './issues.js';
import { readReleaseNotesResource } from './release-notes.js';
import { readVersionResource } from './version.js';
/* eslint-enable import/extensions */

/**
 * Get all available resources
 */
export function getResources(): McpResource[] {
    return [
        {
            uri: 'kodrdriv://version',
            name: 'Version Information',
            description: 'Returns the current version of kodrdriv. ' +
                'URI format: kodrdriv://version. ' +
                'Returns: { version: string, programName: string, fullVersion: string }. ' +
                'Use this to check which version of kodrdriv is installed.',
            mimeType: 'application/json',
        },
        {
            uri: 'kodrdriv://workspace',
            name: 'Workspace Structure',
            description: 'Scans the current workspace/monorepo and returns all packages with their dependencies. ' +
                'URI format: kodrdriv://workspace[/path/to/monorepo]. ' +
                'If no path is provided, uses current working directory. ' +
                'Returns: { root: string, packages: Array<{name, path, version}>, dependencies: Record<string, string[]> }. ' +
                'Use this to understand the structure of a monorepo, find all packages, and see how they depend on each other. ' +
                'CRITICAL: Use this resource to determine if a directory is a tree (monorepo with multiple packages) or a single package. ' +
                'If packages.length > 1, it is a tree operation. If packages.length === 1, it is a single-package operation.',
            mimeType: 'application/json',
        },
        {
            uri: 'kodrdriv://config',
            name: 'Configuration',
            description: 'Loads and merges kodrdriv configuration from multiple sources (project config, user config, defaults). ' +
                'URI format: kodrdriv://config[/path/to/directory]. ' +
                'If no path is provided, uses current working directory. ' +
                'Returns: { path: string, exists: boolean, config: object, hierarchy: string[] }. ' +
                'The config object includes branches, updates.scopes, publish settings, and all other kodrdriv configuration. ' +
                'Use this to understand how kodrdriv is configured for a project.',
            mimeType: 'application/json',
        },
        {
            uri: 'kodrdriv://status',
            name: 'Git Status',
            description: 'Gets the current git repository status including branch, staged/modified/untracked files, and sync status. ' +
                'URI format: kodrdriv://status[/path/to/repo]. ' +
                'If no path is provided, uses current working directory. ' +
                'Returns: { repository: string, branch: string, staged: string[], modified: string[], untracked: string[], ahead: number, behind: number }. ' +
                'Use this to check the state of a git repository before operations like commit or publish.',
            mimeType: 'application/json',
        },
        {
            uri: 'kodrdriv://tree-graph',
            name: 'Dependency Graph',
            description: 'Builds a complete dependency graph of all packages in a monorepo, showing nodes (packages) and edges (dependencies). ' +
                'URI format: kodrdriv://tree-graph[/path/to/monorepo]. ' +
                'If no path is provided, uses current working directory. ' +
                'Returns: { root: string, nodes: Array<{id, name, version, path}>, edges: Array<{from, to, type}> }. ' +
                'Edge types include "dependency", "devDependency", and "peerDependency". ' +
                'Use this for visualization, topological sorting, or understanding dependency relationships.',
            mimeType: 'application/json',
        },
    ];
}

/**
 * Read a resource by URI
 */
export async function readResource(uri: string): Promise<any> {
    const parsed = parseKodrdrivUri(uri);

    switch (parsed.type) {
        case 'version':
            return readVersionResource(parsed);
        case 'config':
            return readConfigResource(parsed);
        case 'status':
            return readStatusResource(parsed);
        case 'workspace':
            return readWorkspaceResource(parsed);
        case 'tree-graph':
            return readTreeGraphResource(parsed);
        case 'package':
            return readPackageResource(parsed);
        case 'recent-commits':
            return readRecentCommitsResource(parsed);
        case 'issues':
            return readIssuesResource(parsed);
        case 'release-notes':
            return readReleaseNotesResource(parsed);
        default:
            throw new Error(`Unknown resource type: ${parsed.type}`);
    }
}

// Re-export individual handlers for testing
export {
    readVersionResource,
    readConfigResource,
    readStatusResource,
    readWorkspaceResource,
    readTreeGraphResource,
    readPackageResource,
    readRecentCommitsResource,
    readIssuesResource,
    readReleaseNotesResource,
};
