#!/usr/bin/env node
/**
 * Build MCP Server
 * Simple build script to compile the MCP server separately from main build
 */

import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { execSync } from 'child_process';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

// Capture git info
let gitInfo = {
    branch: '',
    commit: '',
    tags: '',
    commitDate: '',
};

try {
    gitInfo = {
        branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
        commit: execSync('git rev-parse --short HEAD').toString().trim(),
        tags: '',
        commitDate: execSync('git log -1 --format=%cd --date=iso').toString().trim(),
    };

    try {
        gitInfo.tags = execSync('git tag --points-at HEAD | paste -sd "," -').toString().trim();
    } catch {
        gitInfo.tags = '';
    }
} catch {
    console.log('No git repository, using placeholder values');
}

// Capture build metadata
const buildInfo = {
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
};

// Get package version
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
const version = packageJson.version;

async function buildMCPServer() {
    try {
        console.log('Building MCP server...');

        await build({
            entryPoints: [resolve(root, 'src/mcp/server.ts')],
            bundle: true,
            platform: 'node',
            target: 'esnext',
            format: 'esm',
            outfile: resolve(root, 'dist/mcp-server.js'),
            external: [
                '@modelcontextprotocol/*',
                '@grunnverk/*',
                '@theunwalked/*',
                '@riotprompt/*',
                // Winston and its dependencies use dynamic requires that don't work when bundled
                // These must be external dependencies, not bundled
                'winston',
                'winston/*',
                'logform',
                'logform/*',
                '@colors/colors',
                '@colors/safe',
            ],
            sourcemap: true,
        });

        // Add shebang and replace placeholders
        const outputPath = resolve(root, 'dist/mcp-server.js');
        let content = readFileSync(outputPath, 'utf-8');

        // Replace placeholders
        content = content.replace(/__VERSION__/g, version);
        content = content.replace(/__GIT_BRANCH__/g, gitInfo.branch);
        content = content.replace(/__GIT_COMMIT__/g, gitInfo.commit);
        content = content.replace(/__GIT_TAGS__/g, gitInfo.tags === '' ? '' : `T:${gitInfo.tags}`);
        content = content.replace(/__GIT_COMMIT_DATE__/g, gitInfo.commitDate);
        content = content.replace(/__SYSTEM_INFO__/g, `${process.platform} ${process.arch} ${process.version}`);
        content = content.replace(/__BUILD_HOSTNAME__/g, buildInfo.hostname);
        content = content.replace(/__BUILD_TIMESTAMP__/g, buildInfo.timestamp);

        if (!content.startsWith('#!')) {
            content = `#!/usr/bin/env node\n${content}`;
        }

        writeFileSync(outputPath, content);

        // Make executable
        chmodSync(outputPath, 0o755);

        console.log('✓ MCP server built successfully');
    } catch (error) {
        console.error('✗ MCP server build failed:', error);
        process.exit(1);
    }
}

buildMCPServer();
