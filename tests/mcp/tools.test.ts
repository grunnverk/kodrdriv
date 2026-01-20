import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tools, executeTool } from '../../src/mcp/tools.js';
import * as CommandsGit from '@eldrforge/commands-git';
import * as CommandsTree from '@eldrforge/commands-tree';
import * as CommandsPublish from '@eldrforge/commands-publish';

// Mock the command modules
vi.mock('@eldrforge/commands-git', () => ({
    commit: vi.fn(),
    precommit: vi.fn(),
    review: vi.fn(),
    pull: vi.fn(),
}));

vi.mock('@eldrforge/commands-tree', () => ({
    tree: vi.fn(),
    updates: vi.fn(),
}));

vi.mock('@eldrforge/commands-publish', () => ({
    publish: vi.fn(),
    release: vi.fn(),
    development: vi.fn(),
}));

describe('MCP Tools', () => {
    let originalCwd: string;

    beforeEach(() => {
        originalCwd = process.cwd();
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore original cwd
        try {
            process.chdir(originalCwd);
        } catch (e) {
            // Ignore errors restoring cwd
        }
    });

    describe('tools array', () => {
        it('should have 15 tools defined', () => {
            expect(tools).toHaveLength(15);
        });

        it('should have all core tools', () => {
            const coreTools = ['kodrdriv_get_version', 'kodrdriv_commit', 'kodrdriv_release', 'kodrdriv_publish',
                'kodrdriv_development', 'kodrdriv_precommit', 'kodrdriv_review', 'kodrdriv_pull'];

            coreTools.forEach(toolName => {
                const tool = tools.find(t => t.name === toolName);
                expect(tool).toBeDefined();
                expect(tool?.description).toBeTruthy();
                expect(tool?.inputSchema).toBeDefined();
            });
        });

        it('should have all tree tools', () => {
            const treeTools = ['kodrdriv_tree_commit', 'kodrdriv_tree_publish',
                'kodrdriv_tree_precommit', 'kodrdriv_tree_link', 'kodrdriv_tree_unlink',
                'kodrdriv_tree_updates', 'kodrdriv_tree_pull'];

            treeTools.forEach(toolName => {
                const tool = tools.find(t => t.name === toolName);
                expect(tool).toBeDefined();
                expect(tool?.description).toBeTruthy();
                expect(tool?.inputSchema).toBeDefined();
            });
        });

        it('should have valid schemas for all tools', () => {
            tools.forEach(tool => {
                expect(tool.inputSchema.type).toBe('object');
                expect(tool.inputSchema.properties).toBeDefined();
            });
        });

        it('should have proper input schema for commit tool', () => {
            const commitTool = tools.find(t => t.name === 'kodrdriv_commit');
            expect(commitTool?.inputSchema.properties).toHaveProperty('directory');
            expect(commitTool?.inputSchema.properties).toHaveProperty('sendit');
            expect(commitTool?.inputSchema.properties).toHaveProperty('issue');
            expect(commitTool?.inputSchema.properties).toHaveProperty('dry_run');
        });

        it('should have proper input schema for publish tool', () => {
            const publishTool = tools.find(t => t.name === 'kodrdriv_publish');
            expect(publishTool?.inputSchema.properties).toHaveProperty('directory');
            expect(publishTool?.inputSchema.properties).toHaveProperty('version_type');
            expect(publishTool?.inputSchema.properties).toHaveProperty('dry_run');
            expect(publishTool?.inputSchema.properties).toHaveProperty('skip_tests');
        });

        it('should have proper input schema for development tool', () => {
            const developmentTool = tools.find(t => t.name === 'kodrdriv_development');
            expect(developmentTool?.inputSchema.properties).toHaveProperty('directory');
            expect(developmentTool?.inputSchema.properties).toHaveProperty('target_version');
            expect(developmentTool?.inputSchema.properties).toHaveProperty('tag_working_branch');
            expect(developmentTool?.inputSchema.properties).toHaveProperty('dry_run');
        });

        it('should have proper input schema for tree_commit tool', () => {
            const treeCommitTool = tools.find(t => t.name === 'kodrdriv_tree_commit');
            expect(treeCommitTool?.inputSchema.properties).toHaveProperty('directory');
            expect(treeCommitTool?.inputSchema.properties).toHaveProperty('packages');
            expect(treeCommitTool?.inputSchema.properties).toHaveProperty('sendit');
        });
    });

    describe('executeTool - Core Tools', () => {
        const context = {
            workingDirectory: '/test/dir',
            logger: undefined,
        };

        describe('kodrdriv_commit', () => {
            it('should execute commit tool with success', async () => {
                vi.mocked(CommandsGit.commit).mockResolvedValue('Commit message created');

                const result = await executeTool('kodrdriv_commit', { dry_run: true }, context);

                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data?.message).toBe('Commit message created');
                expect(CommandsGit.commit).toHaveBeenCalled();
            });

            it('should handle commit tool failure', async () => {
                vi.mocked(CommandsGit.commit).mockRejectedValue(new Error('No staged changes'));

                const result = await executeTool('kodrdriv_commit', {}, context);

                expect(result.success).toBe(false);
                expect(result.error).toContain('No staged changes');
            });

            it('should pass sendit flag correctly', async () => {
                vi.mocked(CommandsGit.commit).mockResolvedValue('Committed');

                await executeTool('kodrdriv_commit', { sendit: true, dry_run: true }, context);

                expect(CommandsGit.commit).toHaveBeenCalledWith(
                    expect.objectContaining({
                        commit: expect.objectContaining({
                            sendit: true,
                            interactive: false,
                        }),
                        dryRun: true,
                    })
                );
            });

            it('should pass issue context correctly', async () => {
                vi.mocked(CommandsGit.commit).mockResolvedValue('Committed');

                await executeTool('kodrdriv_commit', { issue: '123', dry_run: true }, context);

                expect(CommandsGit.commit).toHaveBeenCalledWith(
                    expect.objectContaining({
                        commit: expect.objectContaining({
                            context: 'GitHub Issue #123',
                        }),
                    })
                );
            });
        });

        describe('kodrdriv_release', () => {
            it('should execute release tool with success', async () => {
                const mockReleaseSummary = { title: 'v1.0.0', body: 'Release notes' };
                vi.mocked(CommandsPublish.release).mockResolvedValue(mockReleaseSummary as any);

                const result = await executeTool('kodrdriv_release', { version: '1.0.0' }, context);

                expect(result.success).toBe(true);
                expect(result.data?.releaseNotes).toEqual(mockReleaseSummary);
                expect(CommandsPublish.release).toHaveBeenCalled();
            });

            it('should pass from and to tags correctly', async () => {
                const mockReleaseSummary = { title: 'v1.1.0', body: 'Release notes' };
                vi.mocked(CommandsPublish.release).mockResolvedValue(mockReleaseSummary as any);

                await executeTool('kodrdriv_release', { from_tag: 'v1.0.0', to_tag: 'v1.1.0' }, context);

                expect(CommandsPublish.release).toHaveBeenCalledWith(
                    expect.objectContaining({
                        release: expect.objectContaining({
                            from: 'v1.0.0',
                            to: 'v1.1.0',
                            interactive: false,
                        }),
                    })
                );
            });

            it('should handle release tool failure', async () => {
                vi.mocked(CommandsPublish.release).mockRejectedValue(new Error('No commits found'));

                const result = await executeTool('kodrdriv_release', {}, context);

                expect(result.success).toBe(false);
                expect(result.error).toContain('No commits found');
            });
        });

        describe('kodrdriv_publish', () => {
            it('should execute publish tool with success', async () => {
                vi.mocked(CommandsPublish.publish).mockResolvedValue(undefined as any);

                const result = await executeTool('kodrdriv_publish', { version_type: 'minor', dry_run: true }, context);

                expect(result.success).toBe(true);
                expect(result.data?.result).toBeUndefined();
                expect(CommandsPublish.publish).toHaveBeenCalled();
            });

            it('should pass version type correctly', async () => {
                vi.mocked(CommandsPublish.publish).mockResolvedValue(undefined as any);

                await executeTool('kodrdriv_publish', { version_type: 'major', dry_run: true }, context);

                expect(CommandsPublish.publish).toHaveBeenCalledWith(
                    expect.objectContaining({
                        publish: expect.objectContaining({
                            targetVersion: 'major',
                        }),
                        dryRun: true,
                    })
                );
            });

            it('should handle publish tool failure', async () => {
                vi.mocked(CommandsPublish.publish).mockRejectedValue(new Error('Publish failed'));

                const result = await executeTool('kodrdriv_publish', {}, context);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Publish failed');
            });
        });

        describe('kodrdriv_development', () => {
            it('should execute development tool with success', async () => {
                vi.mocked(CommandsPublish.development).mockResolvedValue('Development workflow completed');

                const result = await executeTool('kodrdriv_development', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.result).toBe('Development workflow completed');
                expect(CommandsPublish.development).toHaveBeenCalled();
            });

            it('should pass target version correctly', async () => {
                vi.mocked(CommandsPublish.development).mockResolvedValue('Completed');

                await executeTool('kodrdriv_development', { target_version: 'minor', dry_run: true }, context);

                expect(CommandsPublish.development).toHaveBeenCalledWith(
                    expect.objectContaining({
                        development: expect.objectContaining({
                            targetVersion: 'minor',
                        }),
                        dryRun: true,
                    })
                );
            });

            it('should pass tag_working_branch flag correctly', async () => {
                vi.mocked(CommandsPublish.development).mockResolvedValue('Completed');

                await executeTool('kodrdriv_development', { tag_working_branch: false, dry_run: true }, context);

                expect(CommandsPublish.development).toHaveBeenCalledWith(
                    expect.objectContaining({
                        development: expect.objectContaining({
                            tagWorkingBranch: false,
                        }),
                        dryRun: true,
                    })
                );
            });

            it('should handle development tool failure', async () => {
                vi.mocked(CommandsPublish.development).mockRejectedValue(new Error('Development failed'));

                const result = await executeTool('kodrdriv_development', {}, context);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Development failed');
            });
        });

        describe('kodrdriv_precommit', () => {
            it('should execute precommit tool with success', async () => {
                vi.mocked(CommandsGit.precommit).mockResolvedValue('All checks passed' as any);

                const result = await executeTool('kodrdriv_precommit', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.result).toBe('All checks passed');
                expect(CommandsGit.precommit).toHaveBeenCalled();
            });

            it('should handle precommit tool failure', async () => {
                vi.mocked(CommandsGit.precommit).mockRejectedValue(new Error('Lint errors found'));

                const result = await executeTool('kodrdriv_precommit', {}, context);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Lint errors found');
            });
        });

        describe('kodrdriv_review', () => {
            it('should execute review tool with success', async () => {
                vi.mocked(CommandsGit.review).mockResolvedValue('Review processed');

                const result = await executeTool('kodrdriv_review', { review_file: 'review.md', dry_run: true }, context);

                expect(result.success).toBe(true);
                expect(result.data?.reviewResult).toBe('Review processed');
                expect(CommandsGit.review).toHaveBeenCalled();
            });

            it('should pass review file correctly', async () => {
                vi.mocked(CommandsGit.review).mockResolvedValue('Processed');

                await executeTool('kodrdriv_review', { review_file: 'notes.md', dry_run: true }, context);

                expect(CommandsGit.review).toHaveBeenCalledWith(
                    expect.objectContaining({
                        review: expect.objectContaining({
                            file: 'notes.md',
                            sendit: false,
                        }),
                        dryRun: true,
                    })
                );
            });
        });

        describe('kodrdriv_pull', () => {
            it('should execute pull tool with success', async () => {
                vi.mocked(CommandsGit.pull).mockResolvedValue('Pull completed');

                const result = await executeTool('kodrdriv_pull', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.pullResult).toBe('Pull completed');
                expect(CommandsGit.pull).toHaveBeenCalled();
            });

            it('should handle pull tool failure', async () => {
                vi.mocked(CommandsGit.pull).mockRejectedValue(new Error('Merge conflicts'));

                const result = await executeTool('kodrdriv_pull', {}, context);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Merge conflicts');
            });
        });
    });

    describe('executeTool - Tree Tools', () => {
        const context = {
            workingDirectory: '/test/dir',
            logger: undefined,
        };

        describe('kodrdriv_tree_commit', () => {
            it('should execute tree commit with success', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Tree commit completed');

                const result = await executeTool('kodrdriv_tree_commit', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.result).toBe('Tree commit completed');
                expect(CommandsTree.tree).toHaveBeenCalled();
            });

            it('should pass packages correctly', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                await executeTool('kodrdriv_tree_commit', { packages: ['pkg-a', 'pkg-b'] }, context);

                expect(CommandsTree.tree).toHaveBeenCalledWith(
                    expect.objectContaining({
                        tree: expect.objectContaining({
                            builtInCommand: 'commit',
                            packageArgument: 'pkg-a,pkg-b',
                        }),
                    })
                );
            });

            it('should not include packages in result when undefined', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_commit', {}, context);

                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data?.packages).toBeUndefined();
            });

            it('should not include packages in result when empty array', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_commit', { packages: [] }, context);

                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data?.packages).toBeUndefined();
            });

            it('should include packages in result when provided', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_commit', { packages: ['pkg-a', 'pkg-b'] }, context);

                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data?.packages).toEqual(['pkg-a', 'pkg-b']);
            });
        });

        describe('kodrdriv_tree_publish', () => {
            it('should execute tree publish with success', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Tree publish completed');

                const result = await executeTool('kodrdriv_tree_publish', { dry_run: true }, context);

                expect(result.success).toBe(true);
                expect(result.data?.result).toBe('Tree publish completed');
                expect(CommandsTree.tree).toHaveBeenCalled();
            });

            it('should pass version type correctly', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                await executeTool('kodrdriv_tree_publish', { version_type: 'minor', dry_run: true }, context);

                expect(CommandsTree.tree).toHaveBeenCalledWith(
                    expect.objectContaining({
                        publish: expect.objectContaining({
                            targetVersion: 'minor',
                        }),
                        dryRun: true,
                    })
                );
            });

            it('should not include packages in result when undefined', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_publish', { dry_run: true }, context);

                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data?.packages).toBeUndefined();
            });

            it('should include packages in result when provided', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_publish', { packages: ['pkg-a'], dry_run: true }, context);

                expect(result.success).toBe(true);
                expect(result.data?.packages).toEqual(['pkg-a']);
            });
        });

        describe('kodrdriv_tree_precommit', () => {
            it('should execute tree precommit with success', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Tree precommit completed');

                const result = await executeTool('kodrdriv_tree_precommit', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.result).toBe('Tree precommit completed');
                expect(CommandsTree.tree).toHaveBeenCalled();
            });

            it('should not include packages in result when undefined', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_precommit', {}, context);

                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data?.packages).toBeUndefined();
            });

            it('should include packages in result when provided', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_precommit', { packages: ['pkg-a'] }, context);

                expect(result.success).toBe(true);
                expect(result.data?.packages).toEqual(['pkg-a']);
            });
        });

        describe('kodrdriv_tree_link', () => {
            it('should execute tree link with success', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Tree link completed');

                const result = await executeTool('kodrdriv_tree_link', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.result).toBe('Tree link completed');
                expect(CommandsTree.tree).toHaveBeenCalled();
            });

            it('should not include packages in result when undefined', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_link', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.packages).toBeUndefined();
            });

            it('should include packages in result when provided', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_link', { packages: ['pkg-a'] }, context);

                expect(result.success).toBe(true);
                expect(result.data?.packages).toEqual(['pkg-a']);
            });
        });

        describe('kodrdriv_tree_unlink', () => {
            it('should execute tree unlink with success', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Tree unlink completed');

                const result = await executeTool('kodrdriv_tree_unlink', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.result).toBe('Tree unlink completed');
                expect(CommandsTree.tree).toHaveBeenCalled();
            });

            it('should not include packages in result when undefined', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_unlink', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.packages).toBeUndefined();
            });

            it('should include packages in result when provided', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Completed');

                const result = await executeTool('kodrdriv_tree_unlink', { packages: ['pkg-a'] }, context);

                expect(result.success).toBe(true);
                expect(result.data?.packages).toEqual(['pkg-a']);
            });
        });

        describe('kodrdriv_tree_updates', () => {
            it('should execute tree updates with success', async () => {
                vi.mocked(CommandsTree.updates).mockResolvedValue('No updates available');

                const result = await executeTool('kodrdriv_tree_updates', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.updates).toBe('No updates available');
                expect(CommandsTree.updates).toHaveBeenCalled();
            });

            it('should not include packages in result when undefined', async () => {
                vi.mocked(CommandsTree.updates).mockResolvedValue('No updates');

                const result = await executeTool('kodrdriv_tree_updates', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.packages).toBeUndefined();
            });

            it('should include packages in result when provided', async () => {
                vi.mocked(CommandsTree.updates).mockResolvedValue('No updates');

                const result = await executeTool('kodrdriv_tree_updates', { packages: ['pkg-a'] }, context);

                expect(result.success).toBe(true);
                expect(result.data?.packages).toEqual(['pkg-a']);
            });
        });

        describe('kodrdriv_tree_pull', () => {
            it('should execute tree pull with success', async () => {
                vi.mocked(CommandsTree.tree).mockResolvedValue('Tree pull completed');

                const result = await executeTool('kodrdriv_tree_pull', {}, context);

                expect(result.success).toBe(true);
                expect(result.data?.result).toBe('Tree pull completed');
                expect(CommandsTree.tree).toHaveBeenCalled();
            });
        });
    });

    describe('executeTool - Error Handling', () => {
        const context = {
            workingDirectory: '/test/dir',
            logger: undefined,
        };

        it('should handle unknown tool', async () => {
            const result = await executeTool('unknown_tool', {}, context);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unknown tool');
        });

        it('should handle errors without message', async () => {
            vi.mocked(CommandsGit.commit).mockRejectedValue(new Error());

            const result = await executeTool('kodrdriv_commit', {}, context);

            expect(result.success).toBe(false);
            expect(result.error).toBeTruthy();
        });

        it('should restore cwd on error', async () => {
            const testDir = process.cwd();
            vi.mocked(CommandsGit.commit).mockRejectedValue(new Error('Test error'));

            await executeTool('kodrdriv_commit', { directory: testDir }, context);

            expect(process.cwd()).toBe(originalCwd);
        });
    });
});
