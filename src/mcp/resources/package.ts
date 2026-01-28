/**
 * Package Resource Handler
 *
 * Provides individual package information via MCP resources
 */

/* eslint-disable import/extensions */
import type { KodrdrivUri, PackageResource } from '../types.js';
import { parsePackageJson, scanForPackageJsonFiles } from '@grunnverk/tree-core';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
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
 * Read package resource
 *
 * The path can be either:
 * - A package name (e.g., @scope/package-name) - will search for it
 * - A directory path - will read package.json from that directory
 */
export async function readPackageResource(uri: KodrdrivUri): Promise<PackageResource> {
    const pathOrName = uri.path || '';

    try {
        let packageJsonPath: string;

        // Check if it's a directory path
        if (pathOrName.includes('/') || pathOrName.includes('\\')) {
            packageJsonPath = resolve(pathOrName, 'package.json');

            if (!existsSync(packageJsonPath)) {
                throw new Error(`package.json not found at ${packageJsonPath}`);
            }
        } else {
            // It's a package name - search for it
            const cwd = process.cwd();
            
            // Load config to get workspace exclusions
            const config = await loadConfig(cwd);
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

            const packageJsonFiles = await scanForPackageJsonFiles(cwd, excludedPatterns);

            // Find the package by name
            let found = false;
            for (const pkgPath of packageJsonFiles) {
                const pkgInfo = await parsePackageJson(pkgPath);
                if (pkgInfo.name === pathOrName) {
                    packageJsonPath = pkgPath;
                    found = true;
                    break;
                }
            }

            if (!found) {
                throw new Error(`Package ${pathOrName} not found in workspace`);
            }
        }

        // Parse the package.json
        const pkgInfo = await parsePackageJson(packageJsonPath!);

        return {
            name: pkgInfo.name,
            version: pkgInfo.version,
            path: pkgInfo.path,
            packageJson: {}, // PackageInfo doesn't include raw packageJson
            dependencies: Array.from(pkgInfo.dependencies),
            devDependencies: Array.from(pkgInfo.devDependencies),
        };
    } catch {
        // Return minimal package info on error
        return {
            name: pathOrName || 'unknown',
            version: '0.0.0',
            path: pathOrName || process.cwd(),
            packageJson: {},
            dependencies: [],
            devDependencies: [],
        };
    }
}
