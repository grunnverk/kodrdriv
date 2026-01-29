/**
 * Check Development Tool
 */

/* eslint-disable import/extensions */
import type { McpTool, ToolResult, ToolExecutionContext } from '../types.js';
import { formatErrorForMCP, getLogger as getCoreLogger, isDevelopmentVersion } from '@grunnverk/core';
import { installLogCapture } from '../logCapture.js';
import { scanForPackageJsonFiles } from '@grunnverk/tree-core';
import { getGitStatusSummary, getLinkedDependencies, run } from '@grunnverk/git-tools';
import { getOctokit } from '@grunnverk/github-tools';
import { loadConfig } from '../../utils/config.js';
import { readFile } from 'fs/promises';
import * as path from 'path';
/* eslint-enable import/extensions */

/**
 * Default patterns for subprojects to exclude from scanning
 * These are test fixtures, documentation, examples, and other non-publishable packages
 */
const DEFAULT_EXCLUDE_SUBPROJECTS = [
    'doc/',
    'docs/',
    'examples/',
    'test-*/',
];

export const checkDevelopmentTool: McpTool = {
    name: 'kodrdriv_check_development',
    description:
        'Check development readiness for a package or tree. ' +
        'Verifies branch status, remote sync, dev version, and link status. ' +
        'Optionally validates release workflow readiness by checking for merge conflicts and open PRs.',
    inputSchema: {
        type: 'object',
        properties: {
            directory: {
                type: 'string',
                description: 'Package or tree directory (defaults to current directory)',
            },
            validateRelease: {
                type: 'boolean',
                description: 'Enable full release workflow validation (merge conflicts, open PRs). Defaults to false for quick checks.',
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
 *
 * When validateRelease is true, also checks:
 * - Merge conflicts with target branch (main)
 * - Open PRs from working branch (warns about potential conflicts)
 */
export async function executeCheckDevelopment(args: any, _context: ToolExecutionContext): Promise<ToolResult> {
    const directory = args.directory || process.cwd();
    const validateRelease = args.validateRelease ?? false;
    const { getLogs, remove } = installLogCapture();

    try {
        const logger = getCoreLogger();

        // Load config to get workspace exclusions
        const config = await loadConfig(directory);
        const excludeSubprojects = config?.workspace?.excludeSubprojects ?? DEFAULT_EXCLUDE_SUBPROJECTS;

        // Build exclusion patterns
        // For patterns like 'docs/', 'test-*/', we want to match any path containing these directories
        const excludedPatterns = [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**',
            // Add subproject exclusions
            ...excludeSubprojects.map((pattern: string) => {
                // Remove trailing slash if present
                const normalized = pattern.endsWith('/') ? pattern.slice(0, -1) : pattern;
                // Create pattern that matches the directory anywhere in the path
                return `**/${normalized}/**`;
            }),
        ];

        // Determine if this is a tree or single package
        const packageJsonFiles = await scanForPackageJsonFiles(directory, excludedPatterns);
        const isTree = packageJsonFiles.length > 1;

        logger.info(`Checking development readiness for ${isTree ? 'tree' : 'single package'} in ${directory}${validateRelease ? ' (full release validation)' : ' (quick check)'}`);

        const checks = {
            branch: { passed: true, issues: [] as string[] },
            remoteSync: { passed: true, issues: [] as string[] },
            mergeConflicts: { passed: true, issues: [] as string[], warnings: [] as string[] },
            devVersion: { passed: true, issues: [] as string[] },
            linkStatus: { passed: true, issues: [] as string[], warnings: [] as string[] },
            openPRs: { passed: true, issues: [] as string[], warnings: [] as string[] },
        };

        const packagesToCheck = isTree ? packageJsonFiles : [path.join(directory, 'package.json')];

        // Build a set of all local package names for link status checking
        const localPackageNames = new Set<string>();
        for (const pkgJsonPath of packagesToCheck) {
            try {
                const pkgJsonContent = await readFile(pkgJsonPath, 'utf-8');
                const pkgJson = JSON.parse(pkgJsonContent);
                if (pkgJson.name) {
                    localPackageNames.add(pkgJson.name);
                }
            } catch {
                // Skip packages we can't read
            }
        }

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

            // 3. Check for merge conflicts with target branch (main) - ALWAYS CHECK THIS
            try {
                const gitStatus = await getGitStatusSummary(pkgDir);
                const currentBranch = gitStatus.branch;
                const targetBranch = 'main'; // The branch we'll merge into during publish

                // Skip if we're already on main
                if (currentBranch !== 'main' && currentBranch !== 'master') {
                    // Fetch latest to ensure we have up-to-date refs
                    await run('git fetch origin', { cwd: pkgDir });

                    // Try a test merge to detect conflicts
                    // Use --no-commit --no-ff to simulate the merge without actually doing it
                    try {
                        // Check if there would be conflicts using git merge --no-commit --no-ff
                        // This is safer as it doesn't modify the working tree
                        await run(
                            `git merge --no-commit --no-ff origin/${targetBranch}`,
                            { cwd: pkgDir }
                        );

                        // If we get here, check if there are conflicts
                        const { stdout: statusAfterMerge } = await run('git status --porcelain', { cwd: pkgDir });

                        if (statusAfterMerge.includes('UU ') || statusAfterMerge.includes('AA ') ||
                                statusAfterMerge.includes('DD ') || statusAfterMerge.includes('AU ') ||
                                statusAfterMerge.includes('UA ') || statusAfterMerge.includes('DU ') ||
                                statusAfterMerge.includes('UD ')) {
                            checks.mergeConflicts.passed = false;
                            checks.mergeConflicts.issues.push(
                                `${pkgName}: Merge conflicts detected with ${targetBranch} branch`
                            );
                        }

                        // Abort the test merge (only if there's actually a merge in progress)
                        try {
                            await run('git merge --abort', { cwd: pkgDir });
                        } catch {
                            // Ignore - there might not be a merge to abort if it was a fast-forward
                        }
                    } catch (mergeError: any) {
                        // Abort any partial merge
                        try {
                            await run('git merge --abort', { cwd: pkgDir });
                        } catch {
                            // Ignore abort errors
                        }

                        // If merge failed, there are likely conflicts
                        if (mergeError.message?.includes('CONFLICT') || mergeError.stderr?.includes('CONFLICT')) {
                            checks.mergeConflicts.passed = false;
                            checks.mergeConflicts.issues.push(
                                `${pkgName}: Merge conflicts detected with ${targetBranch} branch`
                            );
                        } else {
                            // Some other error - log as warning
                            checks.mergeConflicts.warnings.push(
                                `${pkgName}: Could not check for merge conflicts - ${mergeError.message || mergeError}`
                            );
                        }
                    }
                }
            } catch (error: any) {
                checks.mergeConflicts.warnings.push(
                    `${pkgName}: Could not check for merge conflicts - ${error.message || error}`
                );
            }

            // 4. Check dev version status
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

            // 5. Check link status (warning only - links are recommended but not required)
            if (pkgJson.dependencies || pkgJson.devDependencies) {
                try {
                    const linkedDeps = await getLinkedDependencies(pkgDir);
                    const allDeps = {
                        ...pkgJson.dependencies,
                        ...pkgJson.devDependencies,
                    };

                    // Only check link status for dependencies that are part of the local workspace
                    // This filters out external scoped packages like @types/*, @typescript-eslint/*, etc.
                    const localDeps = Object.keys(allDeps).filter(dep => localPackageNames.has(dep));
                    const unlinkedLocal = localDeps.filter(dep => !linkedDeps.has(dep));

                    if (unlinkedLocal.length > 0) {
                        // Don't fail the check, just warn - links are recommended but not required
                        checks.linkStatus.warnings.push(
                            `${pkgName}: Local dependencies not linked (recommended): ${unlinkedLocal.join(', ')}`
                        );
                    }
                } catch (error: any) {
                    checks.linkStatus.warnings.push(`${pkgName}: Could not check link status - ${error.message || error}`);
                }
            }

            // 6. Check for open PRs from working branch - only if validateRelease is true
            if (validateRelease && pkgJson.repository?.url) {
                try {
                    const gitStatus = await getGitStatusSummary(pkgDir);
                    const currentBranch = gitStatus.branch;

                    // Extract owner/repo from repository URL
                    const repoUrl = pkgJson.repository.url;
                    const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);

                    if (match) {
                        const [, owner, repo] = match;

                        try {
                            const octokit = getOctokit();
                            const { data: openPRs } = await octokit.pulls.list({
                                owner,
                                repo,
                                state: 'open',
                                head: `${owner}:${currentBranch}`,
                            });

                            if (openPRs.length > 0) {
                                checks.openPRs.passed = false;
                                for (const pr of openPRs) {
                                    const prInfo = `PR #${pr.number}: ${pr.title} (${pr.html_url})`;
                                    checks.openPRs.issues.push(`${pkgName}: ${prInfo}`);
                                }
                            }
                        } catch (prError: any) {
                            // Only log if it's not a 404 (repo might not exist on GitHub)
                            if (!prError.message?.includes('404') && !prError.status || prError.status !== 404) {
                                checks.openPRs.warnings.push(
                                    `${pkgName}: Could not check PRs - ${prError.message || prError}`
                                );
                            }
                        }
                    }
                } catch (error: any) {
                    // Don't fail the check if we can't check PRs
                    checks.openPRs.warnings.push(
                        `${pkgName}: Could not check for open PRs - ${error.message || error}`
                    );
                }
            }
        }

        // Build summary - linkStatus is not included in allPassed (it's a recommendation, not a requirement)
        // mergeConflicts is ALWAYS checked (critical for preventing post-merge failures)
        // openPRs is only checked when validateRelease is true
        const allPassed = checks.branch.passed &&
                         checks.remoteSync.passed &&
                         checks.mergeConflicts.passed &&
                         checks.devVersion.passed &&
                         (validateRelease ? checks.openPRs.passed : true);

        const summary = {
            ready: allPassed,
            isTree,
            packagesChecked: packagesToCheck.length,
            releaseValidation: validateRelease,
            checks: {
                branch: {
                    passed: checks.branch.passed,
                    issues: checks.branch.issues,
                },
                remoteSync: {
                    passed: checks.remoteSync.passed,
                    issues: checks.remoteSync.issues,
                },
                mergeConflicts: {
                    passed: checks.mergeConflicts.passed,
                    issues: checks.mergeConflicts.issues,
                    warnings: checks.mergeConflicts.warnings,
                },
                devVersion: {
                    passed: checks.devVersion.passed,
                    issues: checks.devVersion.issues,
                },
                linkStatus: {
                    passed: checks.linkStatus.passed,
                    issues: checks.linkStatus.issues,
                    warnings: checks.linkStatus.warnings,
                },
                ...(validateRelease ? {
                    openPRs: {
                        passed: checks.openPRs.passed,
                        issues: checks.openPRs.issues,
                        warnings: checks.openPRs.warnings,
                    },
                } : {}),
            },
        };

        // Log results
        if (allPassed) {
            logger.info(`✅ All required ${validateRelease ? 'development and release' : 'development'} readiness checks passed`);
        } else {
            logger.warn(`⚠️  Some required ${validateRelease ? 'development or release' : 'development'} readiness checks failed`);
            if (!checks.branch.passed) {
                logger.warn(`Branch issues: ${checks.branch.issues.join('; ')}`);
            }
            if (!checks.remoteSync.passed) {
                logger.warn(`Remote sync issues: ${checks.remoteSync.issues.join('; ')}`);
            }
            if (!checks.mergeConflicts.passed) {
                logger.warn(`Merge conflict issues: ${checks.mergeConflicts.issues.join('; ')}`);
            }
            if (!checks.devVersion.passed) {
                logger.warn(`Dev version issues: ${checks.devVersion.issues.join('; ')}`);
            }
            if (validateRelease && !checks.openPRs.passed) {
                logger.warn(`Open PR issues: ${checks.openPRs.issues.join('; ')}`);
            }
        }

        // Log recommendations/warnings separately (non-blocking)
        if (checks.linkStatus.warnings.length > 0) {
            logger.warn(`Link status recommendations: ${checks.linkStatus.warnings.join('; ')}`);
        }
        if (checks.mergeConflicts.warnings.length > 0) {
            logger.warn(`Merge conflict warnings: ${checks.mergeConflicts.warnings.join('; ')}`);
        }
        if (validateRelease && checks.openPRs.warnings.length > 0) {
            logger.warn(`Open PR warnings: ${checks.openPRs.warnings.join('; ')}`);
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
