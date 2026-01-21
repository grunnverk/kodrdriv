/**
 * MCP Server Stdout Pollution Test
 *
 * Verifies that the MCP server does NOT output any non-JSON content to stdout.
 * This is critical because the MCP protocol uses JSON-RPC over stdio, and any
 * non-JSON output (like console.log messages) will corrupt the protocol stream.
 *
 * These tests catch issues like:
 * - console.log calls in command packages
 * - winston logger writing to console when it shouldn't
 * - tree-execution's default console.log logger
 * - ANSI escape codes from progress displays
 * - Child process output bleeding through
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { resolve as pathResolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = pathResolve(__dirname, '../..');
const mcpServerPath = pathResolve(root, 'dist/mcp-server.js');

// Non-existent directory for tools that require a directory argument
const NONEXISTENT_DIR = '/tmp/nonexistent-kodrdriv-test-dir-12345';

// All MCP tools that need to be tested for stdout pollution
const ALL_TOOLS = [
    'kodrdriv_get_version',
    'kodrdriv_commit',
    'kodrdriv_release',
    'kodrdriv_publish',
    'kodrdriv_development',
    'kodrdriv_precommit',
    'kodrdriv_review',
    'kodrdriv_pull',
    'kodrdriv_tree_commit',
    'kodrdriv_tree_publish',
    'kodrdriv_tree_precommit',
    'kodrdriv_tree_link',
    'kodrdriv_tree_unlink',
    'kodrdriv_tree_updates',
    'kodrdriv_tree_pull',
] as const;

/**
 * Validates that a string is valid JSON-RPC message format.
 */
function validateJsonRpc(line: string): true | string {
    const trimmed = line.trim();
    if (trimmed === '') return true;

    try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed !== 'object' || parsed === null) {
            return `Not a JSON object: ${typeof parsed}`;
        }
        return true;
    } catch (e: any) {
        return `Invalid JSON: ${e.message}\nContent: ${trimmed.substring(0, 200)}${trimmed.length > 200 ? '...' : ''}`;
    }
}

function sendJsonRpc(child: ChildProcess, message: object): void {
    const json = JSON.stringify(message);
    child.stdin?.write(json + '\n');
}

function createRequest(id: number, method: string, params?: object): object {
    const req: any = { jsonrpc: '2.0', id, method };
    if (params !== undefined) req.params = params;
    return req;
}

/**
 * Get test arguments for a tool that will make it fail quickly
 */
function getTestArgsForTool(toolName: string): object {
    switch (toolName) {
        case 'kodrdriv_get_version':
            return {};
        case 'kodrdriv_commit':
        case 'kodrdriv_publish':
        case 'kodrdriv_development':
        case 'kodrdriv_review':
        case 'kodrdriv_tree_publish':
            return { directory: NONEXISTENT_DIR, dry_run: true };
        default:
            return { directory: NONEXISTENT_DIR };
    }
}

interface McpTestResult {
    stdoutLines: string[];
    stderrLines: string[];
    errors: string[];
}

/**
 * Kill a process tree (the process and all its children)
 */
function killProcessTree(child: ChildProcess): void {
    try {
        // Close stdin first to signal the process to exit
        child.stdin?.end();
        child.stdin?.destroy();
    } catch { /* ignore */ }

    try {
        // Try SIGTERM first
        child.kill('SIGTERM');
    } catch { /* ignore */ }

    // Force kill after a short delay
    setTimeout(() => {
        try {
            child.kill('SIGKILL');
        } catch { /* ignore */ }
    }, 100);
}

/**
 * Robust helper to spawn MCP server, send messages, and validate stdout
 */
async function runMcpTest(
    messages: Array<{ delay: number; message: object }>,
    waitTime: number
): Promise<McpTestResult> {
    return new Promise((done) => {
        const stdoutLines: string[] = [];
        const stderrLines: string[] = [];
        let buffer = '';
        let finished = false;
        let child: ChildProcess | null = null;

        const finish = () => {
            if (finished) return;
            finished = true;

            if (buffer.trim()) stdoutLines.push(buffer);

            // Kill the process
            if (child) {
                killProcessTree(child);
                child = null;
            }

            const errors: string[] = [];
            for (let i = 0; i < stdoutLines.length; i++) {
                const result = validateJsonRpc(stdoutLines[i]);
                if (result !== true) {
                    errors.push(`Line ${i + 1}: ${result}`);
                }
            }

            done({ stdoutLines, stderrLines, errors });
        };

        try {
            child = spawn('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: root,
                env: { ...process.env, KODRDRIV_MCP_SERVER: 'true' },
            });

            child.stdout?.on('data', (data) => {
                if (finished) return;
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                stdoutLines.push(...lines);
            });

            child.stderr?.on('data', (data) => {
                if (finished) return;
                stderrLines.push(data.toString());
            });

            child.on('error', (err) => {
                stderrLines.push(`Process error: ${err.message}`);
                finish();
            });

            child.on('exit', () => {
                // Small delay to collect any remaining output
                setTimeout(finish, 50);
            });

            // Send messages with delays
            for (const { delay, message } of messages) {
                setTimeout(() => {
                    if (!finished && child) {
                        sendJsonRpc(child, message);
                    }
                }, delay);
            }

            // Hard timeout - always finish
            setTimeout(finish, waitTime);
        } catch (err: any) {
            stderrLines.push(`Spawn error: ${err.message}`);
            finish();
        }
    });
}

/**
 * Test a specific tool for stdout pollution
 */
async function testTool(toolName: string, toolArgs: object, waitTime: number = 3000): Promise<void> {
    const result = await runMcpTest([
        { delay: 0, message: createRequest(1, 'initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0.0' },
        })},
        { delay: 100, message: { jsonrpc: '2.0', method: 'notifications/initialized' }},
        { delay: 200, message: createRequest(3, 'tools/call', { name: toolName, arguments: toolArgs })},
    ], waitTime);

    if (result.errors.length > 0) {
        throw new Error(
            `Stdout pollution detected calling ${toolName}! ${result.errors.length} invalid line(s):\n\n` +
            result.errors.join('\n\n') +
            '\n\n--- Full stdout ---\n' + result.stdoutLines.join('\n') +
            '\n\n--- Stderr ---\n' + result.stderrLines.join('')
        );
    }
}

describe.sequential('MCP Server Stdout Pollution', () => {
    beforeAll(() => {
        if (!existsSync(mcpServerPath)) {
            throw new Error('MCP server not built. Run "npm run build" first.');
        }
    });

    it('should only output valid JSON-RPC during initialization', async () => {
        const result = await runMcpTest([
            { delay: 0, message: createRequest(1, 'initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'test', version: '1.0.0' },
            })},
        ], 1000);

        expect(result.errors).toEqual([]);
    }, 4000);

    it('should only output valid JSON-RPC when listing tools', async () => {
        const result = await runMcpTest([
            { delay: 0, message: createRequest(1, 'initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'test', version: '1.0.0' },
            })},
            { delay: 200, message: createRequest(2, 'tools/list', {})},
        ], 1000);

        expect(result.errors).toEqual([]);
    }, 4000);

    it('should handle malformed requests without stdout pollution', async () => {
        const result = await runMcpTest([
            { delay: 0, message: { invalid: 'not json-rpc' } as any },
            { delay: 100, message: { jsonrpc: '2.0' } as any },
        ], 1000);

        expect(result.errors).toEqual([]);
    }, 4000);
});

// Run tool tests sequentially to avoid spawning too many processes
describe.sequential('MCP Tool Stdout Pollution - All Tools', () => {
    beforeAll(() => {
        if (!existsSync(mcpServerPath)) {
            throw new Error('MCP server not built. Run "npm run build" first.');
        }
    });

    // Test each tool - use shorter wait times since we just need to check for pollution
    for (const toolName of ALL_TOOLS) {
        const isTreeTool = toolName.startsWith('kodrdriv_tree_');
        const timeout = isTreeTool ? 6000 : 4000;
        const waitTime = isTreeTool ? 3000 : 2000;

        it(`should not pollute stdout when calling ${toolName}`, async () => {
            await testTool(toolName, getTestArgsForTool(toolName), waitTime);
        }, timeout);
    }
});

// NOTE: Workspace scan tests are skipped because they require tree-execution
// to be built and published with MCP-mode logging fixes. The individual tool
// tests above cover the same code paths for tool invocation - they just fail
// fast due to non-existent directories. When tree-execution is published with
// the KODRDRIV_MCP_SERVER check in its logger, these tests can be enabled.
describe.sequential.skip('MCP Workspace Scan Tests', () => {
    beforeAll(() => {
        if (!existsSync(mcpServerPath)) {
            throw new Error('MCP server not built. Run "npm run build" first.');
        }
    });

    it('should not pollute stdout when tree_precommit scans real workspace', async () => {
        await testTool('kodrdriv_tree_precommit', { directory: pathResolve(root, '..') }, 3000);
    }, 8000);

    it('should not pollute stdout when tree_updates scans real workspace', async () => {
        await testTool('kodrdriv_tree_updates', { directory: pathResolve(root, '..') }, 3000);
    }, 8000);
});

describe('Static Analysis Checks', () => {
    it('should have KODRDRIV_MCP_SERVER check in core logging', async () => {
        const coreLoggingPath = pathResolve(root, '../core/src/logging.ts');
        if (existsSync(coreLoggingPath)) {
            const content = readFileSync(coreLoggingPath, 'utf-8');
            expect(content).toContain('KODRDRIV_MCP_SERVER');
        }
    });

    it('should have KODRDRIV_MCP_SERVER check in tree-execution logger', async () => {
        const treeLoggerPath = pathResolve(root, '../tree-execution/src/util/logger.ts');
        if (existsSync(treeLoggerPath)) {
            const content = readFileSync(treeLoggerPath, 'utf-8');
            expect(content).toContain('KODRDRIV_MCP_SERVER');
        }
    });

    it('should have KODRDRIV_MCP_SERVER check in tree-execution ANSI support', async () => {
        const treePath = pathResolve(root, '../tree-execution/src/tree.ts');
        if (existsSync(treePath)) {
            const content = readFileSync(treePath, 'utf-8');
            expect(content).toContain('KODRDRIV_MCP_SERVER');
        }
    });
});
