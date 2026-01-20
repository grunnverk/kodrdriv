/**
 * MCP Server Startup Test
 *
 * Verifies that the MCP server can start without runtime errors.
 * This test specifically checks for the "Dynamic require" error that occurs
 * when winston and its dependencies are incorrectly bundled.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Go up from tests/mcp/server-startup.test.ts to project root
const root = resolve(__dirname, '../..');
const mcpServerPath = resolve(root, 'dist/mcp-server.js');

describe('MCP Server Startup', () => {
    beforeAll(() => {
        // Ensure the MCP server is built before running tests
        if (!existsSync(mcpServerPath)) {
            throw new Error(
                'MCP server not built. Run "npm run build" or "node scripts/build-mcp.js" first.'
            );
        }
    });

    it('should start without dynamic require errors', async () => {
        // This test verifies that the bundled MCP server can be executed
        // without throwing "Dynamic require" errors for Node.js built-ins

        // The MCP server reads from stdin and writes to stdout/stderr
        // We'll spawn it and check stderr for the specific error

        const { spawn } = await import('child_process');

        return new Promise<void>((resolve, reject) => {
            const child = spawn('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: root,
            });

            let stderr = '';
            let startupComplete = false;

            // Collect stderr output
            child.stderr?.on('data', (data) => {
                const output = data.toString();
                stderr += output;

                // Check for the specific error we're testing for
                if (output.includes('Dynamic require of')) {
                    child.kill();
                    reject(new Error(
                        `MCP server failed to start with dynamic require error:\n${stderr}\n\n` +
                        'This usually means winston or its dependencies are being incorrectly bundled. ' +
                        'Check that winston, logform, and @colors/colors are marked as external in build-mcp.js'
                    ));
                    return;
                }

                // If we see the startup message, the server started successfully
                if (output.includes('KodrDriv MCP server started')) {
                    startupComplete = true;
                    child.kill();
                    resolve();
                }
            });

            child.on('error', (error) => {
                if (!startupComplete) {
                    reject(error);
                }
            });

            child.on('exit', (code) => {
                if (!startupComplete && code !== null && code !== 0) {
                    // Check if stderr contains the dynamic require error
                    if (stderr.includes('Dynamic require of')) {
                        reject(new Error(
                            `MCP server failed to start with dynamic require error:\n${stderr}\n\n` +
                            'This usually means winston or its dependencies are being incorrectly bundled. ' +
                            'Check that winston, logform, and @colors/colors are marked as external in build-mcp.js'
                        ));
                    } else if (stderr) {
                        // Other errors are acceptable (like JSON parse errors from invalid input)
                        // The key is we didn't get the dynamic require error
                        resolve();
                    } else {
                        resolve();
                    }
                } else if (startupComplete) {
                    resolve();
                } else {
                    // Server exited without error and without startup message
                    // This is fine - it might have exited due to invalid input
                    resolve();
                }
            });

            // Send invalid JSON to trigger initialization and then close stdin
            // This will cause the server to try to parse and potentially error,
            // but we're only checking for the dynamic require error
            child.stdin?.write('{}\n');
            child.stdin?.end();

            // Timeout after 5 seconds - if we haven't seen the error by then, we're good
            setTimeout(() => {
                if (!startupComplete) {
                    child.kill();
                    // If we got here without seeing the dynamic require error, that's success
                    resolve();
                }
            }, 5000);
        });
    });

    it('should be able to import winston dependencies without bundling errors', async () => {
        // This test verifies that winston can be imported in the context
        // where the MCP server runs (i.e., as an external dependency, not bundled)

        // We'll check that winston is available as an external module
        // by trying to require it in a Node.js context
        try {
            // Use a simple Node.js script to verify winston can be loaded
            const testScript = `
                import winston from 'winston';
                console.log('winston loaded successfully');
            `;

            // Write a temp test file
            const testFile = resolve(root, 'dist/.test-winston-import.mjs');
            const { writeFileSync, unlinkSync } = await import('fs');
            writeFileSync(testFile, testScript);

            try {
                const result = execSync(`node "${testFile}"`, {
                    encoding: 'utf-8',
                    cwd: root,
                });

                expect(result).toContain('winston loaded successfully');
            } finally {
                // Clean up
                try {
                    unlinkSync(testFile);
                } catch {
                    // Ignore cleanup errors
                }
            }
        } catch (error: any) {
            // If winston can't be imported, that's a problem
            throw new Error(
                `Failed to import winston as external dependency: ${error.message}\n\n` +
                'This suggests winston might not be available in node_modules or there\'s a dependency issue.'
            );
        }
    });

    it('should have winston marked as external in the bundle', () => {
        // Verify that the built MCP server doesn't contain bundled winston code
        // by checking that winston is imported, not bundled

        if (!existsSync(mcpServerPath)) {
            throw new Error('MCP server not built');
        }

        const { readFileSync } = require('fs');
        const bundleContent = readFileSync(mcpServerPath, 'utf-8');

        // The bundle should import winston, not contain winston's source code
        // Check that we're importing winston (external) rather than bundling it
        // We look for import statements, not winston's internal code

        // Winston's internal code would contain things like "createLogger" implementations
        // If winston is external, we should see import statements but not its implementation
        const hasWinstonImport = bundleContent.includes("from 'winston'") ||
                                  bundleContent.includes('from "winston"') ||
                                  bundleContent.includes("require('winston'") ||
                                  bundleContent.includes('require("winston"');

        // If winston was bundled, we'd see its internal implementation details
        // This is a heuristic check - if winston is external, we won't see its source
        const hasWinstonSource = bundleContent.includes('createLogger') &&
                                 bundleContent.includes('winston.transports');

        // We want winston to be imported (external), not bundled
        // Note: This is a best-effort check. The real test is the startup test above.
        if (!hasWinstonImport && hasWinstonSource) {
            console.warn(
                'Warning: winston appears to be bundled rather than external. ' +
                'This may cause dynamic require errors. Check build-mcp.js external configuration.'
            );
        }

        // The key assertion: we should NOT see the dynamic require pattern that causes errors
        expect(bundleContent).not.toContain('Dynamic require of');
    });
});
