#!/usr/bin/env node
/**
 * Test get_version MCP tool
 */

import { spawn } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVER_PATH = resolve(__dirname, '../dist/mcp-server.js');
const TIMEOUT_MS = 5000;

console.log('🔍 Testing get_version tool...\n');

function sendMCPRequest(server, method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = Math.floor(Math.random() * 1000000);
        const request = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };

        let response = '';
        const timeout = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, TIMEOUT_MS);

        server.stdout.on('data', (data) => {
            response += data.toString();
            try {
                const parsed = JSON.parse(response);
                if (parsed.id === id) {
                    clearTimeout(timeout);
                    resolve(parsed);
                }
            } catch (e) {
                // Still accumulating response
            }
        });

        server.stdin.write(JSON.stringify(request) + '\n');
    });
}

async function testGetVersionTool() {
    const server = spawn('node', [SERVER_PATH], {
        stdio: ['pipe', 'pipe', 'pipe'],
    });

    try {
        // Initialize
        await sendMCPRequest(server, 'initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0.0' },
        });

        // Call get_version tool
        const response = await sendMCPRequest(server, 'tools/call', {
            name: 'kodrdriv_get_version',
            arguments: {},
        });

        if (response.result && response.result.content) {
            const content = response.result.content[0];
            console.log('✅ get_version tool executed successfully\n');
            console.log('Response:');
            console.log(content.text);
            console.log('\n');

            // Parse and display structured data
            try {
                const data = JSON.parse(content.text);
                console.log('Parsed data:');
                console.log('  Version:', data.version);
                console.log('  Build Hostname:', data.buildHostname);
                console.log('  Build Timestamp:', data.buildTimestamp);
            } catch (e) {
                // Response might be text format
            }
        } else {
            throw new Error('Invalid response from get_version tool');
        }

        server.kill();
        return true;
    } catch (error) {
        server.kill();
        console.log(`❌ Test failed: ${error.message}\n`);
        return false;
    }
}

testGetVersionTool().then(success => {
    process.exit(success ? 0 : 1);
});
