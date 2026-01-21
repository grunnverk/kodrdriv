import { describe, it, expect } from 'vitest';
import { removeUndefinedValues } from '../../src/mcp/server.js';

describe('MCP Server - removeUndefinedValues', () => {
    it('should remove undefined values from simple object', () => {
        const input = {
            a: 1,
            b: undefined,
            c: 'test',
        };

        const result = removeUndefinedValues(input);

        expect(result).toEqual({
            a: 1,
            c: 'test',
        });
        expect(result.b).toBeUndefined();
    });

    it('should remove undefined values from nested objects', () => {
        const input = {
            a: {
                b: 1,
                c: undefined,
                d: {
                    e: 'test',
                    f: undefined,
                },
            },
            g: undefined,
        };

        const result = removeUndefinedValues(input);

        expect(result).toEqual({
            a: {
                b: 1,
                d: {
                    e: 'test',
                },
            },
        });
    });

    it('should handle arrays and remove undefined elements', () => {
        const input = {
            items: [1, undefined, 'test', undefined, 2],
        };

        const result = removeUndefinedValues(input);

        expect(result).toEqual({
            items: [1, 'test', 2],
        });
    });

    it('should handle nested arrays with undefined values', () => {
        const input = {
            packages: ['pkg-a', undefined, 'pkg-b'],
            other: undefined,
        };

        const result = removeUndefinedValues(input);

        expect(result).toEqual({
            packages: ['pkg-a', 'pkg-b'],
        });
    });

    it('should return undefined for undefined input', () => {
        const result = removeUndefinedValues(undefined);
        expect(result).toBeUndefined();
    });

    it('should preserve null input (null is valid in JSON)', () => {
        const result = removeUndefinedValues(null);
        expect(result).toBeNull();
    });

    it('should preserve null values (only remove undefined)', () => {
        const input = {
            a: null,
            b: undefined,
            c: 'test',
        };

        const result = removeUndefinedValues(input);

        expect(result).toEqual({
            a: null,
            c: 'test',
        });
    });

    it('should handle empty objects', () => {
        const input = {};
        const result = removeUndefinedValues(input);
        expect(result).toEqual({});
    });

    it('should handle empty arrays', () => {
        const input = { items: [] };
        const result = removeUndefinedValues(input);
        expect(result).toEqual({ items: [] });
    });

    it('should handle arrays with all undefined values', () => {
        const input = { items: [undefined, undefined] };
        const result = removeUndefinedValues(input);
        expect(result).toEqual({ items: [] });
    });

    it('should handle complex nested structures', () => {
        const input = {
            packages: ['pkg-a', undefined, 'pkg-b'],
            config: {
                directory: '/test',
                options: undefined,
                nested: {
                    value: 1,
                    empty: undefined,
                },
            },
            metadata: undefined,
            items: [1, undefined, { a: 'test', b: undefined }],
        };

        const result = removeUndefinedValues(input);

        expect(result).toEqual({
            packages: ['pkg-a', 'pkg-b'],
            config: {
                directory: '/test',
                nested: {
                    value: 1,
                },
            },
            items: [1, { a: 'test' }],
        });
    });

    it('should ensure result can be JSON serialized without errors', () => {
        const input = {
            packages: ['pkg-a', undefined, 'pkg-b'],
            config: {
                directory: '/test',
                options: undefined,
            },
            metadata: undefined,
        };

        const result = removeUndefinedValues(input);

        // Should not throw when stringifying
        expect(() => JSON.stringify(result)).not.toThrow();

        // Should produce valid JSON
        const json = JSON.stringify(result);
        expect(() => JSON.parse(json)).not.toThrow();

        // Should not contain undefined in the JSON string
        expect(json).not.toContain('undefined');
    });
});
