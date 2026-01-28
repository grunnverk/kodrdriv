/**
 * Tests for check-development MCP tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeCheckDevelopment } from '../../../src/mcp/tools/check-development';
import type { ToolExecutionContext } from '../../../src/mcp/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as gitTools from '@grunnverk/git-tools';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('@grunnverk/git-tools');
vi.mock('@grunnverk/tree-core', () => ({
    scanForPackageJsonFiles: vi.fn(),
}));
vi.mock('../../../src/utils/config', () => ({
    loadConfig: vi.fn().mockResolvedValue(null),
}));

describe('check-development tool', () => {
    const mockContext: ToolExecutionContext = {
        workingDirectory: '/test/workspace',
        logger: console,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('link status check', () => {
        it('should only flag local workspace packages as unlinked, not external scoped packages', async () => {
            const { scanForPackageJsonFiles } = await import('@grunnverk/tree-core');

            // Mock tree structure with 3 packages
            const packageJsonFiles = [
                '/test/workspace/pkg-a/package.json',
                '/test/workspace/pkg-b/package.json',
                '/test/workspace/pkg-c/package.json',
            ];

            vi.mocked(scanForPackageJsonFiles).mockResolvedValue(packageJsonFiles);

            // Mock package.json files
            const packageJsons = {
                '/test/workspace/pkg-a/package.json': {
                    name: '@workspace/pkg-a',
                    version: '1.0.0-dev.0',
                    dependencies: {
                        '@workspace/pkg-b': '^1.0.0',  // Local package - should be checked
                        '@types/node': '^20.0.0',      // External package - should be ignored
                        '@typescript-eslint/parser': '^6.0.0',  // External package - should be ignored
                    },
                    devDependencies: {
                        '@vitest/coverage-v8': '^1.0.0',  // External package - should be ignored
                    },
                },
                '/test/workspace/pkg-b/package.json': {
                    name: '@workspace/pkg-b',
                    version: '1.0.0-dev.0',
                    dependencies: {
                        '@workspace/pkg-c': '^1.0.0',  // Local package - should be checked
                        '@types/jest': '^29.0.0',      // External package - should be ignored
                    },
                },
                '/test/workspace/pkg-c/package.json': {
                    name: '@workspace/pkg-c',
                    version: '1.0.0-dev.0',
                    dependencies: {
                        'lodash': '^4.0.0',  // External non-scoped package - should be ignored
                    },
                },
            };

            vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
                const pathStr = filePath.toString();
                if (packageJsons[pathStr as keyof typeof packageJsons]) {
                    return JSON.stringify(packageJsons[pathStr as keyof typeof packageJsons]);
                }
                throw new Error(`File not found: ${pathStr}`);
            });

            // Mock git status - all on working branch
            vi.mocked(gitTools.getGitStatusSummary).mockResolvedValue({
                branch: 'working',
                hasUnstagedFiles: false,
                hasUncommittedChanges: false,
                hasUnpushedCommits: false,
                unstagedCount: 0,
                uncommittedCount: 0,
                unpushedCount: 0,
                status: 'clean',
            });

            // Mock git run commands
            vi.mocked(gitTools.run).mockImplementation(async (cmd: string) => {
                if (cmd.includes('git fetch')) {
                    return { stdout: '', stderr: '' };
                }
                if (cmd.includes('git status -sb')) {
                    return { stdout: '## working...origin/working', stderr: '' };
                }
                if (cmd.includes('npm view')) {
                    throw new Error('Package not found'); // Version doesn't exist on npm
                }
                return { stdout: '', stderr: '' };
            });

            // Mock linked dependencies - pkg-b is linked, but pkg-c is not
            vi.mocked(gitTools.getLinkedDependencies).mockImplementation(async (pkgDir: string) => {
                if (pkgDir.includes('pkg-a')) {
                    return new Set(['@workspace/pkg-b']); // Only pkg-b is linked
                }
                if (pkgDir.includes('pkg-b')) {
                    return new Set(); // pkg-c is NOT linked
                }
                return new Set();
            });

            const result = await executeCheckDevelopment({ directory: '/test/workspace' }, mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();

            const { checks } = result.data as any;

            // Link status should fail because local packages are not linked
            expect(checks.linkStatus.passed).toBe(false);

            // Should only report unlinked LOCAL packages, not external scoped packages
            expect(checks.linkStatus.issues).toHaveLength(1);
            expect(checks.linkStatus.issues[0]).toContain('@workspace/pkg-c');

            // Should NOT contain external scoped packages
            expect(checks.linkStatus.issues[0]).not.toContain('@types/node');
            expect(checks.linkStatus.issues[0]).not.toContain('@typescript-eslint/parser');
            expect(checks.linkStatus.issues[0]).not.toContain('@vitest/coverage-v8');
            expect(checks.linkStatus.issues[0]).not.toContain('@types/jest');
        });

        it('should pass link status check when all local packages are linked', async () => {
            const { scanForPackageJsonFiles } = await import('@grunnverk/tree-core');

            const packageJsonFiles = [
                '/test/workspace/pkg-a/package.json',
                '/test/workspace/pkg-b/package.json',
            ];

            vi.mocked(scanForPackageJsonFiles).mockResolvedValue(packageJsonFiles);

            const packageJsons = {
                '/test/workspace/pkg-a/package.json': {
                    name: '@workspace/pkg-a',
                    version: '1.0.0-dev.0',
                    dependencies: {
                        '@workspace/pkg-b': '^1.0.0',
                        '@types/node': '^20.0.0',
                    },
                },
                '/test/workspace/pkg-b/package.json': {
                    name: '@workspace/pkg-b',
                    version: '1.0.0-dev.0',
                    dependencies: {
                        '@types/jest': '^29.0.0',
                    },
                },
            };

            vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
                const pathStr = filePath.toString();
                if (packageJsons[pathStr as keyof typeof packageJsons]) {
                    return JSON.stringify(packageJsons[pathStr as keyof typeof packageJsons]);
                }
                throw new Error(`File not found: ${pathStr}`);
            });

            vi.mocked(gitTools.getGitStatusSummary).mockResolvedValue({
                branch: 'working',
                hasUnstagedFiles: false,
                hasUncommittedChanges: false,
                hasUnpushedCommits: false,
                unstagedCount: 0,
                uncommittedCount: 0,
                unpushedCount: 0,
                status: 'clean',
            });

            vi.mocked(gitTools.run).mockImplementation(async (cmd: string) => {
                if (cmd.includes('git fetch')) {
                    return { stdout: '', stderr: '' };
                }
                if (cmd.includes('git status -sb')) {
                    return { stdout: '## working...origin/working', stderr: '' };
                }
                if (cmd.includes('npm view')) {
                    throw new Error('Package not found');
                }
                return { stdout: '', stderr: '' };
            });

            // All local packages are linked
            vi.mocked(gitTools.getLinkedDependencies).mockImplementation(async (pkgDir: string) => {
                if (pkgDir.includes('pkg-a')) {
                    return new Set(['@workspace/pkg-b']);
                }
                return new Set();
            });

            const result = await executeCheckDevelopment({ directory: '/test/workspace' }, mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();

            const { checks } = result.data as any;

            // Link status should pass - all local packages are linked
            expect(checks.linkStatus.passed).toBe(true);
            expect(checks.linkStatus.issues).toHaveLength(0);
        });

        it('should handle single package (non-tree) correctly', async () => {
            const { scanForPackageJsonFiles } = await import('@grunnverk/tree-core');

            // Single package
            vi.mocked(scanForPackageJsonFiles).mockResolvedValue([
                '/test/workspace/package.json',
            ]);

            const packageJson = {
                name: '@workspace/single-pkg',
                version: '1.0.0-dev.0',
                dependencies: {
                    '@types/node': '^20.0.0',
                    '@typescript-eslint/parser': '^6.0.0',
                },
            };

            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(packageJson));

            vi.mocked(gitTools.getGitStatusSummary).mockResolvedValue({
                branch: 'working',
                hasUnstagedFiles: false,
                hasUncommittedChanges: false,
                hasUnpushedCommits: false,
                unstagedCount: 0,
                uncommittedCount: 0,
                unpushedCount: 0,
                status: 'clean',
            });

            vi.mocked(gitTools.run).mockImplementation(async (cmd: string) => {
                if (cmd.includes('git fetch')) {
                    return { stdout: '', stderr: '' };
                }
                if (cmd.includes('git status -sb')) {
                    return { stdout: '## working...origin/working', stderr: '' };
                }
                if (cmd.includes('npm view')) {
                    throw new Error('Package not found');
                }
                return { stdout: '', stderr: '' };
            });

            vi.mocked(gitTools.getLinkedDependencies).mockResolvedValue(new Set());

            const result = await executeCheckDevelopment({ directory: '/test/workspace' }, mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();

            const { checks, isTree } = result.data as any;

            // Should be detected as single package
            expect(isTree).toBe(false);

            // Link status should pass - no local dependencies to link
            expect(checks.linkStatus.passed).toBe(true);
            expect(checks.linkStatus.issues).toHaveLength(0);
        });
    });
});
