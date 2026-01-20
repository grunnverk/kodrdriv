import { describe, it, expect } from 'vitest';
import { getPrompts, getPrompt } from '../../src/mcp/prompts/index.js';

describe('MCP Prompts', () => {
    describe('getPrompts', () => {
        it('should return array of prompts', () => {
            const prompts = getPrompts();
            expect(Array.isArray(prompts)).toBe(true);
            expect(prompts).toHaveLength(4);
        });

        it('should have all expected prompts', () => {
            const prompts = getPrompts();
            const expectedPrompts = [
                'fix_and_commit',
                'full_publish',
                'dependency_update',
                'check_development',
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

        it('should return messages for full_publish', async () => {
            const messages = await getPrompt('full_publish', {});
            expect(Array.isArray(messages)).toBe(true);
            expect(messages[0].content.text).toContain('monorepo');
        });

        it('should throw on unknown prompt', async () => {
            await expect(getPrompt('unknown_prompt', {}))
                .rejects.toThrow('Unknown prompt');
        });

        it('should use provided arguments', async () => {
            const messages = await getPrompt('full_publish', { packages: 'package-a,package-b' });
            expect(messages[0].content.text).toContain('package-a,package-b');
        });
    });
});
