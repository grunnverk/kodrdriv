/**
 * Tree Graph Resource Handler
 *
 * Provides dependency graph visualization data via MCP resources
 */

/* eslint-disable import/extensions */
import type { KodrdrivUri, TreeGraphResource } from '../types.js';
import { buildDependencyGraph, scanForPackageJsonFiles } from '@grunnverk/tree-core';
import { loadConfig } from '../../utils/config.js';
/* eslint-enable import/extensions */

/**
 * Default patterns for subprojects to exclude from workspace scanning
 */
const DEFAULT_EXCLUDE_SUBPROJECTS = [
    'doc/',
    'docs/',
    'test-*/',
];

/**
 * Read tree graph resource
 */
export async function readTreeGraphResource(uri: KodrdrivUri): Promise<TreeGraphResource> {
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

        // Convert to graph format
        const nodes = Array.from(graph.packages.values()).map(pkg => ({
            id: pkg.name,
            name: pkg.name,
            version: pkg.version,
            path: pkg.path,
        }));

        const edges: Array<{
            from: string;
            to: string;
            type: 'dependency' | 'devDependency' | 'peerDependency';
        }> = [];

        for (const [pkgName, pkg] of graph.packages.entries()) {
            // Add regular dependencies (only local ones from edges)
            const localDeps = graph.edges.get(pkgName) || new Set();
            for (const dep of localDeps) {
                const isDevDep = pkg.devDependencies.has(dep);
                edges.push({
                    from: pkgName,
                    to: dep,
                    type: isDevDep ? 'devDependency' : 'dependency',
                });
            }
        }

        return {
            root,
            nodes,
            edges,
        };
    } catch {
        // Return empty graph on error
        return {
            root,
            nodes: [],
            edges: [],
        };
    }
}
