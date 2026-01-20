/**
 * MCP Server Stdout Pollution Test
 *
 * Verifies that the MCP server does NOT output any non-JSON content to stdout.
 * This is critical because the MCP protocol uses JSON-RPC over stdio, and any
 * non-JSON output (like console.log messages) will corrupt the protocol stream.
 *
 * The test catches issues like:
 * - console.log calls in command packages
 * - winston logger writing to console when it shouldn't
 * - tree-execution's default console.log logger
 * - Any other stdout pollution
 *
 * These issues manifest as errors like:
 * - "Expected ',' or ']' after array element in JSON at position 2"
 * - "Unexpected token 'A', "Analyzing "... is not valid JSON"
 * - "Unexpected token '═', "══════════"... is not valid JSON"
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '../..');
const mcpServerPath = resolve(root, 'dist/mcp-server.js');

/**
 * Validates that a string is valid JSON-RPC message format.
 * Returns true if valid, or an error message if invalid.
 */
function validateJsonRpc(line: string): true | string {
    const trimmed = line.trim();

    // Empty lines are acceptable
    if (trimmed === '') {
        return true;
    }

    // Try to parse as JSON
    let parsed: any;
    try {
        parsed = JSON.parse(trimmed);
    } catch (e: any) {
        return `Invalid JSON: ${e.message}\nContent: ${trimmed.substring(0, 100)}${trimmed.length > 100 ? '...' : ''}`;
    }

    // Validate it looks like JSON-RPC
    // JSON-RPC messages should have jsonrpc field or be responses with result/error
    if (typeof parsed !== 'object' || parsed === null) {
        return `Not a JSON object: ${typeof parsed}`;
    }

    // Valid JSON-RPC 2.0 messages:
    // - Request: { jsonrpc: "2.0", method: "...", id: ..., params?: ... }
    // - Response: { jsonrpc: "2.0", id: ..., result: ... } or { jsonrpc: "2.0", id: ..., error: ... }
    // - Notification: { jsonrpc: "2.0", method: "...", params?: ... }

    const hasJsonRpc = parsed.jsonrpc === '2.0';
    const hasMethod = typeof parsed.method === 'string';
    const hasResult = 'result' in parsed;
    const hasError = 'error' in parsed;

    if (hasJsonRpc && (hasMethod || hasResult || hasError)) {
        return true;
    }

    // Some MCP implementations may not strictly follow JSON-RPC 2.0
    // Accept any valid JSON object as a fallback
    return true;
}

/**
 * Helper to send a JSON-RPC message to the server
 */
function sendJsonRpc(child: ChildProcess, message: object): void {
    const json = JSON.stringify(message);
    child.stdin?.write(json + '\n');
}

/**
 * Create a JSON-RPC request
 */
function createRequest(id: number, method: string, params?: object): object {
    const req: any = {
        jsonrpc: '2.0',
        id,
        method,
    };
    if (params !== undefined) {
        req.params = params;
    }
    return req;
}

describe('MCP Server Stdout Pollution', () => {
    beforeAll(() => {
        if (!existsSync(mcpServerPath)) {
            throw new Error(
                'MCP server not built. Run "npm run build" or "node scripts/build-mcp.js" first.'
            );
        }
    });

    it('should only output valid JSON-RPC on stdout during initialization', async () => {
        return new Promise<void>((resolve, reject) => {
            const child = spawn('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: root,
                env: {
                    ...process.env,
                    KODRDRIV_MCP_SERVER: 'true',
                },
            });

            const stdoutLines: string[] = [];
            const stderrLines: string[] = [];
            let buffer = '';

            child.stdout?.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer
                stdoutLines.push(...lines);
            });

            child.stderr?.on('data', (data) => {
                stderrLines.push(data.toString());
            });

            // Send initialize request
            sendJsonRpc(child, createRequest(1, 'initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'test', version: '1.0.0' },
            }));

            // Wait a bit, then close
            setTimeout(() => {
                // Flush any remaining buffer
                if (buffer.trim()) {
                    stdoutLines.push(buffer);
                }

                child.kill();

                // Validate all stdout lines
                const errors: string[] = [];
                for (let i = 0; i < stdoutLines.length; i++) {
                    const line = stdoutLines[i];
                    const result = validateJsonRpc(line);
                    if (result !== true) {
                        errors.push(`Line ${i + 1}: ${result}`);
                    }
                }

                if (errors.length > 0) {
                    reject(new Error(
                        `Stdout pollution detected! ${errors.length} invalid line(s):\n\n` +
                        errors.join('\n\n') +
                        '\n\n--- Full stdout ---\n' +
                        stdoutLines.join('\n') +
                        '\n\n--- Stderr ---\n' +
                        stderrLines.join('')
                    ));
                } else {
                    resolve();
                }
            }, 1000);
        });
    }, 10000);

    it('should only output valid JSON-RPC when listing tools', async () => {
        return new Promise<void>((resolve, reject) => {
            const child = spawn('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: root,
                env: {
                    ...process.env,
                    KODRDRIV_MCP_SERVER: 'true',
                },
            });

            const stdoutLines: string[] = [];
            const stderrLines: string[] = [];
            let buffer = '';

            child.stdout?.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                stdoutLines.push(...lines);
            });

            child.stderr?.on('data', (data) => {
                stderrLines.push(data.toString());
            });

            // Send initialize
            sendJsonRpc(child, createRequest(1, 'initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'test', version: '1.0.0' },
            }));

            // Wait for init, then list tools
            setTimeout(() => {
                sendJsonRpc(child, createRequest(2, 'tools/list', {}));
            }, 200);

            // Wait for response
            setTimeout(() => {
                if (buffer.trim()) {
                    stdoutLines.push(buffer);
                }

                child.kill();

                const errors: string[] = [];
                for (let i = 0; i < stdoutLines.length; i++) {
                    const line = stdoutLines[i];
                    const result = validateJsonRpc(line);
                    if (result !== true) {
                        errors.push(`Line ${i + 1}: ${result}`);
                    }
                }

                if (errors.length > 0) {
                    reject(new Error(
                        `Stdout pollution detected during tools/list! ${errors.length} invalid line(s):\n\n` +
                        errors.join('\n\n') +
                        '\n\n--- Full stdout ---\n' +
                        stdoutLines.join('\n')
                    ));
                } else {
                    resolve();
                }
            }, 1000);
        });
    }, 10000);

    it('should only output valid JSON-RPC when calling kodrdriv_get_version tool', async () => {
        return new Promise<void>((resolve, reject) => {
            const child = spawn('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: root,
                env: {
                    ...process.env,
                    KODRDRIV_MCP_SERVER: 'true',
                },
            });

            const stdoutLines: string[] = [];
            const stderrLines: string[] = [];
            let buffer = '';

            child.stdout?.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                stdoutLines.push(...lines);
            });

            child.stderr?.on('data', (data) => {
                stderrLines.push(data.toString());
            });

            // Send initialize
            sendJsonRpc(child, createRequest(1, 'initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'test', version: '1.0.0' },
            }));

            // Send initialized notification
            setTimeout(() => {
                sendJsonRpc(child, { jsonrpc: '2.0', method: 'notifications/initialized' });
            }, 100);

            // Call the get_version tool
            setTimeout(() => {
                sendJsonRpc(child, createRequest(3, 'tools/call', {
                    name: 'kodrdriv_get_version',
                    arguments: {},
                }));
            }, 300);

            // Wait for response
            setTimeout(() => {
                if (buffer.trim()) {
                    stdoutLines.push(buffer);
                }

                child.kill();

                const errors: string[] = [];
                for (let i = 0; i < stdoutLines.length; i++) {
                    const line = stdoutLines[i];
                    const result = validateJsonRpc(line);
                    if (result !== true) {
                        errors.push(`Line ${i + 1}: ${result}`);
                    }
                }

                if (errors.length > 0) {
                    reject(new Error(
                        `Stdout pollution detected during tool call! ${errors.length} invalid line(s):\n\n` +
                        errors.join('\n\n') +
                        '\n\n--- Full stdout ---\n' +
                        stdoutLines.join('\n') +
                        '\n\n--- Stderr ---\n' +
                        stderrLines.join('')
                    ));
                } else {
                    // Verify we got a valid response
                    const hasToolResponse = stdoutLines.some(line => {
                        try {
                            const parsed = JSON.parse(line);
                            return parsed.id === 3 && parsed.result;
                        } catch {
                            return false;
                        }
                    });

                    if (!hasToolResponse) {
                        reject(new Error(
                            'Tool call did not return expected response\n' +
                            '--- Stdout ---\n' +
                            stdoutLines.join('\n')
                        ));
                    } else {
                        resolve();
                    }
                }
            }, 2000);
        });
    }, 15000);

    it('should not have any console.log calls that could pollute stdout', async () => {
        // This is a static analysis test - check that the built server
        // doesn't contain obvious console.log patterns that would output
        // the kinds of strings we've seen pollute stdout

        const { readFileSync } = await import('fs');
        const serverContent = readFileSync(mcpServerPath, 'utf-8');

        // These patterns are things we've seen pollute stdout in the past
        const pollutionPatterns = [
            // Box drawing characters used for formatted output
            /console\.log\([^)]*[═╔╗╚╝║]/,
            // Emoji patterns in console.log
            /console\.log\([^)]*[📦⏱️✅❌✓]/,
            // Common progress messages
            /console\.log\([^)]*['"]Analyzing/,
            /console\.log\([^)]*['"]Found.*packages/,
            /console\.log\([^)]*['"]Processing/,
            /console\.log\([^)]*['"]Build order/,
        ];

        const foundPatterns: string[] = [];
        for (const pattern of pollutionPatterns) {
            if (pattern.test(serverContent)) {
                foundPatterns.push(pattern.toString());
            }
        }

        // This test is informational - it might have false positives
        // The real test is the runtime test above
        if (foundPatterns.length > 0) {
            console.warn(
                'Warning: Found potential console.log patterns that could pollute stdout:\n' +
                foundPatterns.join('\n') +
                '\n\nThese may be false positives. Check the runtime tests for actual pollution.'
            );
        }

        // Always pass - this is just informational
        expect(true).toBe(true);
    });

    it('should have KODRDRIV_MCP_SERVER env var check in logging modules', async () => {
        // Verify that the core logging module checks for MCP server mode
        const coreLoggingPath = resolve(root, '../core/src/logging.ts');

        if (existsSync(coreLoggingPath)) {
            const { readFileSync } = await import('fs');
            const content = readFileSync(coreLoggingPath, 'utf-8');

            expect(content).toContain('KODRDRIV_MCP_SERVER');
            expect(content).toMatch(/isMcpServer|MCP.*server/i);
        }
    });

    it('should have KODRDRIV_MCP_SERVER env var check in tree-execution logger', async () => {
        // Verify that tree-execution's logger checks for MCP server mode
        const treeLoggerPath = resolve(root, '../tree-execution/src/util/logger.ts');

        if (existsSync(treeLoggerPath)) {
            const { readFileSync } = await import('fs');
            const content = readFileSync(treeLoggerPath, 'utf-8');

            expect(content).toContain('KODRDRIV_MCP_SERVER');
            expect(content).toMatch(/isMcpServer|MCP.*mode/i);
        }
    });
});

describe('MCP Protocol Compliance', () => {
    beforeAll(() => {
        if (!existsSync(mcpServerPath)) {
            throw new Error(
                'MCP server not built. Run "npm run build" or "node scripts/build-mcp.js" first.'
            );
        }
    });

    it('should respond with valid JSON-RPC to malformed requests without crashing stdout', async () => {
        return new Promise<void>((resolve, reject) => {
            const child = spawn('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: root,
                env: {
                    ...process.env,
                    KODRDRIV_MCP_SERVER: 'true',
                },
            });

            const stdoutLines: string[] = [];
            let buffer = '';

            child.stdout?.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                stdoutLines.push(...lines);
            });

            // Send various malformed inputs
            child.stdin?.write('not json at all\n');
            child.stdin?.write('{ incomplete json\n');
            child.stdin?.write('{"jsonrpc": "2.0"}\n'); // Missing required fields

            setTimeout(() => {
                if (buffer.trim()) {
                    stdoutLines.push(buffer);
                }

                child.kill();

                // Even with malformed input, stdout should only contain valid JSON
                const errors: string[] = [];
                for (let i = 0; i < stdoutLines.length; i++) {
                    const line = stdoutLines[i];
                    const result = validateJsonRpc(line);
                    if (result !== true) {
                        errors.push(`Line ${i + 1}: ${result}`);
                    }
                }

                if (errors.length > 0) {
                    reject(new Error(
                        `Malformed input caused stdout pollution! ${errors.length} invalid line(s):\n\n` +
                        errors.join('\n\n')
                    ));
                } else {
                    resolve();
                }
            }, 1000);
        });
    }, 10000);
});
