/**
 * Workspace Resource Handler
 *
 * Provides workspace structure and package information via MCP resources
 */

/* eslint-disable import/extensions */
import type { KodrdrivUri, WorkspaceResource } from '../types.js';
import { buildDependencyGraph, scanForPackageJsonFiles } from '@grunnverk/tree-core';
import { loadConfig } from '../../utils/config.js';
/* eslint-enable import/extensions */

/**
 * Default patterns for subprojects to exclude from workspace scanning
 */
const DEFAULT_EXCLUDE_SUBPROJECTS = [
    'doc/',
    'docs/',
    'examples/',
    'test-*/',
];

/**
 * Read workspace resource
 */
export async function readWorkspaceResource(uri: KodrdrivUri): Promise<WorkspaceResource> {
    const root = uri.path || process.cwd();

    try {
        // Load config to get workspace exclusions
        const config = await loadConfig(root);
        const excludeSubprojects = config?.workspace?.excludeSubprojects ?? DEFAULT_EXCLUDE_SUBPROJECTS;

        // Build exclusion patterns
        const excludedPatterns = [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**',
            // Add subproject exclusions
            ...excludeSubprojects.map((pattern: string) => `**/${pattern}**`),
        ];

        // Scan for package.json files
        const packageJsonFiles = await scanForPackageJsonFiles(root, excludedPatterns);

        // Build dependency graph
        const graph = await buildDependencyGraph(packageJsonFiles);

        // Extract packages information
        const packages = Array.from(graph.packages.values()).map(pkg => ({
            name: pkg.name,
            path: pkg.path,
            version: pkg.version,
        }));

        // Build dependencies map
        const dependencies: Record<string, string[]> = {};
        for (const [pkgName, deps] of graph.edges.entries()) {
            dependencies[pkgName] = Array.from(deps);
        }

        return {
            root,
            packages,
            dependencies,
        };
    } catch {
        // Return empty workspace on error
        return {
            root,
            packages: [],
            dependencies: {},
        };
    }
}
