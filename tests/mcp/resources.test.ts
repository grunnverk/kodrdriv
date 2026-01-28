import { describe, it, expect } from 'vitest';
import { getResources, readResource } from '../../src/mcp/resources/index.js';

describe('MCP Resources', () => {
    describe('getResources', () => {
        it('should return array of resources', () => {
            const resources = getResources();
            expect(Array.isArray(resources)).toBe(true);
            expect(resources.length).toBeGreaterThan(0);
        });

        it('should have valid resource structure', () => {
            const resources = getResources();
            resources.forEach(resource => {
                expect(resource.uri).toBeTruthy();
                expect(resource.name).toBeTruthy();
                expect(resource.description).toBeTruthy();
            });
        });
    });

    describe('readResource', () => {
        it('should read config resource', async () => {
            const data = await readResource('kodrdriv://config/test/path');
            expect(data).toBeDefined();
            expect(data.path).toBeTruthy();
        });

        it('should read status resource', async () => {
            const data = await readResource('kodrdriv://status/test/repo');
            expect(data).toBeDefined();
            expect(data.repository).toBeTruthy();
            expect(data.branch).toBeTruthy();
        });

        it('should read workspace resource', async () => {
            const data = await readResource('kodrdriv://workspace');
            expect(data).toBeDefined();
            expect(data.root).toBeTruthy();
            expect(Array.isArray(data.packages)).toBe(true);
        });

        it('should throw on invalid resource type', async () => {
            await expect(readResource('kodrdriv://invalid/path'))
                .rejects.toThrow('Unknown resource type');
        });
    });
});
