import { describe, it, expect } from 'vitest';
import { tools, executeTool } from '../../src/mcp/tools.js';

describe('MCP Tools', () => {
    describe('tools array', () => {
        it('should have 13 tools defined', () => {
            expect(tools).toHaveLength(13);
        });

        it('should have all core tools', () => {
            const coreTools = ['kodrdriv_commit', 'kodrdriv_release', 'kodrdriv_publish',
                'kodrdriv_precommit', 'kodrdriv_review', 'kodrdriv_pull'];

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
    });

    describe('executeTool', () => {
        const context = {
            workingDirectory: '/test/dir',
            config: undefined,
            logger: undefined,
        };

        it('should execute commit tool', async () => {
            const result = await executeTool('kodrdriv_commit', {}, context);
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it('should execute release tool', async () => {
            const result = await executeTool('kodrdriv_release', { version: '1.0.0' }, context);
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it('should execute tree_commit tool', async () => {
            const result = await executeTool('kodrdriv_tree_commit', {}, context);
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it('should handle unknown tool', async () => {
            const result = await executeTool('unknown_tool', {}, context);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unknown tool');
        });

        it('should pass args to tool executors', async () => {
            const result = await executeTool('kodrdriv_commit', {
                directory: '/custom/dir',
                sendit: true,
            }, context);

            expect(result.success).toBe(true);
            expect(result.data?.directory).toBe('/custom/dir');
        });
    });
});
