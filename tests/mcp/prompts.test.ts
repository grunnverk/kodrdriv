import { describe, it, expect } from 'vitest';
import { getPrompts, getPrompt } from '../../src/mcp/prompts.js';

describe('MCP Prompts', () => {
    describe('getPrompts', () => {
        it('should return array of prompts', () => {
            const prompts = getPrompts();
            expect(Array.isArray(prompts)).toBe(true);
            expect(prompts).toHaveLength(6);
        });

        it('should have all expected prompts', () => {
            const prompts = getPrompts();
            const expectedPrompts = [
                'fix_and_commit',
                'prepare_release',
                'monorepo_publish',
                'dependency_update',
                'smart_merge',
                'issue_from_review',
            ];

            expectedPrompts.forEach(name => {
                const prompt = prompts.find(p => p.name === name);
                expect(prompt).toBeDefined();
                expect(prompt?.description).toBeTruthy();
            });
        });

        it('should have valid prompt structure', () => {
            const prompts = getPrompts();
            prompts.forEach(prompt => {
                expect(prompt.name).toBeTruthy();
                expect(prompt.description).toBeTruthy();
                expect(Array.isArray(prompt.arguments)).toBe(true);
            });
        });
    });

    describe('getPrompt', () => {
        it('should return messages for fix_and_commit', async () => {
            const messages = await getPrompt('fix_and_commit', {});
            expect(Array.isArray(messages)).toBe(true);
            expect(messages.length).toBeGreaterThan(0);
            expect(messages[0].role).toBe('user');
            expect(messages[0].content.type).toBe('text');
        });

        it('should return messages for prepare_release', async () => {
            const messages = await getPrompt('prepare_release', { version_type: 'minor' });
            expect(Array.isArray(messages)).toBe(true);
            expect(messages[0].content.text).toContain('minor');
        });

        it('should return messages for monorepo_publish', async () => {
            const messages = await getPrompt('monorepo_publish', {});
            expect(Array.isArray(messages)).toBe(true);
            expect(messages[0].content.text).toContain('monorepo');
        });

        it('should throw on unknown prompt', async () => {
            await expect(getPrompt('unknown_prompt', {}))
                .rejects.toThrow('Unknown prompt');
        });

        it('should use provided arguments', async () => {
            const messages = await getPrompt('smart_merge', { branch: 'feature-x' });
            expect(messages[0].content.text).toContain('feature-x');
        });
    });
});
