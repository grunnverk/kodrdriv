/**
 * Check Development Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import { formatErrorForMCP, getLogger as getCoreLogger, isDevelopmentVersion } from '@grunnverk/core';
import { installLogCapture } from '../logCapture.js';
import { scanForPackageJsonFiles } from '@grunnverk/tree-core';
import { getGitStatusSummary, getLinkedDependencies, run } from '@grunnverk/git-tools';
import { readFile } from 'fs/promises';
import * as path from 'path';
/* eslint-enable import/extensions */

export const checkDevelopmentTool: McpTool = {
    name: 'kodrdriv_check_development',
    description:
        'Check development readiness for a package or tree. ' +
        'Verifies branch status, remote sync, dev version, and link status.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Package or tree directory (defaults to current directory)',
            },
        },
    },
};

/**
 * Check development readiness for a package or tree
 * Verifies:
 * - Branch status (not on main/master)
 * - Remote sync status
 * - Dev version status
 * - Link status for local dependencies
 */
export async function executeCheckDevelopment(args: any, _context: ToolExecutionContext): Promise<ToolResult> {
    const directory = args.directory || process.cwd();
    const { getLogs, remove } = installLogCapture();

    try {
        const logger = getCoreLogger();

        // Determine if this is a tree or single package
        const packageJsonFiles = await scanForPackageJsonFiles(directory);
        const isTree = packageJsonFiles.length > 1;

        logger.info(`Checking development readiness for ${isTree ? 'tree' : 'single package'} in ${directory}`);

        const checks = {
            branch: { passed: true, issues: [] as string[] },
            remoteSync: { passed: true, issues: [] as string[] },
            devVersion: { passed: true, issues: [] as string[] },
            linkStatus: { passed: true, issues: [] as string[] },
        };

        const packagesToCheck = isTree ? packageJsonFiles : [path.join(directory, 'package.json')];

        for (const pkgJsonPath of packagesToCheck) {
            const pkgDir = path.dirname(pkgJsonPath);
            const pkgJsonContent = await readFile(pkgJsonPath, 'utf-8');
            const pkgJson = JSON.parse(pkgJsonContent);
            const pkgName = pkgJson.name || path.basename(pkgDir);

            // 1. Check branch status
            try {
                const gitStatus = await getGitStatusSummary(pkgDir);
                if (gitStatus.branch === 'main' || gitStatus.branch === 'master') {
                    checks.branch.passed = false;
                    checks.branch.issues.push(`${pkgName} is on ${gitStatus.branch} branch`);
                }
            } catch (error: any) {
                checks.branch.issues.push(`${pkgName}: Could not check branch - ${error.message || error}`);
            }

            // 2. Check remote sync status
            try {
                await run('git fetch', { cwd: pkgDir });
                const { stdout: statusOutput } = await run('git status -sb', { cwd: pkgDir });

                if (statusOutput.includes('behind')) {
                    checks.remoteSync.passed = false;
                    const match = statusOutput.match(/behind (\d+)/);
                    const count = match ? match[1] : 'some';
                    checks.remoteSync.issues.push(`${pkgName} is ${count} commits behind remote`);
                }
            } catch (error: any) {
                checks.remoteSync.issues.push(`${pkgName}: Could not check remote sync - ${error.message || error}`);
            }

            // 3. Check dev version status
            const version = pkgJson.version;
            if (!version) {
                checks.devVersion.issues.push(`${pkgName}: No version field in package.json`);
            } else if (!isDevelopmentVersion(version)) {
                checks.devVersion.passed = false;
                checks.devVersion.issues.push(`${pkgName} has non-dev version: ${version}`);
            } else {
                // Check if base version exists on npm
                const baseVersion = version.split('-')[0];
                try {
                    const { stdout } = await run(`npm view ${pkgName}@${baseVersion} version`, { cwd: pkgDir });
                    if (stdout.trim() === baseVersion) {
                        checks.devVersion.passed = false;
                        checks.devVersion.issues.push(
                            `${pkgName}: Base version ${baseVersion} already published (current: ${version})`
                        );
                    }
                } catch {
                    // Version doesn't exist on npm, which is good
                }
            }

            // 4. Check link status
            if (pkgJson.dependencies || pkgJson.devDependencies) {
                try {
                    const linkedDeps = await getLinkedDependencies(pkgDir);
                    const allDeps = {
                        ...pkgJson.dependencies,
                        ...pkgJson.devDependencies,
                    };

                    // Check for scoped packages that should be linked
                    const scopedPackages = Object.keys(allDeps).filter(dep => dep.startsWith('@'));
                    const unlinkedScoped = scopedPackages.filter(dep => !linkedDeps.has(dep));

                    if (unlinkedScoped.length > 0) {
                        checks.linkStatus.passed = false;
                        checks.linkStatus.issues.push(
                            `${pkgName}: Scoped dependencies not linked: ${unlinkedScoped.join(', ')}`
                        );
                    }
                } catch (error: any) {
                    checks.linkStatus.issues.push(`${pkgName}: Could not check link status - ${error.message || error}`);
                }
            }
        }

        // Build summary
        const allPassed = checks.branch.passed &&
                         checks.remoteSync.passed &&
                         checks.devVersion.passed &&
                         checks.linkStatus.passed;

        const summary = {
            ready: allPassed,
            isTree,
            packagesChecked: packagesToCheck.length,
            checks: {
                branch: {
                    passed: checks.branch.passed,
                    issues: checks.branch.issues,
                },
                remoteSync: {
                    passed: checks.remoteSync.passed,
                    issues: checks.remoteSync.issues,
                },
                devVersion: {
                    passed: checks.devVersion.passed,
                    issues: checks.devVersion.issues,
                },
                linkStatus: {
                    passed: checks.linkStatus.passed,
                    issues: checks.linkStatus.issues,
                },
            },
        };

        // Log results
        if (allPassed) {
            logger.info('✅ All development readiness checks passed');
        } else {
            logger.warn('⚠️  Some development readiness checks failed');
            if (!checks.branch.passed) {
                logger.warn(`Branch issues: ${checks.branch.issues.join('; ')}`);
            }
            if (!checks.remoteSync.passed) {
                logger.warn(`Remote sync issues: ${checks.remoteSync.issues.join('; ')}`);
            }
            if (!checks.devVersion.passed) {
                logger.warn(`Dev version issues: ${checks.devVersion.issues.join('; ')}`);
            }
            if (!checks.linkStatus.passed) {
                logger.warn(`Link status issues: ${checks.linkStatus.issues.join('; ')}`);
            }
        }

        return {
            success: true,
            data: summary,
            logs: getLogs(),
        };
    } catch (error: any) {
        const formatted = formatErrorForMCP(error);
        return {
            success: false,
            error: formatted.message,
            context: formatted.context,
            recovery: formatted.recovery,
            logs: getLogs(),
        };
    } finally {
        remove();
    }
}
