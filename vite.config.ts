import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import replace from '@rollup/plugin-replace';
// import { visualizer } from 'rollup-plugin-visualizer';
import { execSync } from 'child_process';
import shebang from 'rollup-plugin-preserve-shebang';
import os from 'os';

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
    // eslint-disable-next-line no-console
    console.log('Directory does not have a Git repository, skipping git info');
}

// Capture build metadata
const buildInfo = {
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
};


export default defineConfig({
    server: {
        port: 3000
    },
    plugins: [
        ...VitePluginNode({
            adapter: 'express',
            appPath: './src/main.ts',
            exportName: 'viteNodeApp',
            tsCompiler: 'swc',
            swcOptions: {
                sourceMaps: true,
            },
        }),
        // visualizer({
        //     template: 'network',
        //     filename: 'network.html',
        //     projectRoot: process.cwd(),
        // }),
        replace({
            '__VERSION__': process.env.npm_package_version,
            '__GIT_BRANCH__': gitInfo.branch,
            '__GIT_COMMIT__': gitInfo.commit,
            '__GIT_TAGS__': gitInfo.tags === '' ? '' : `T:${gitInfo.tags}`,
            '__GIT_COMMIT_DATE__': gitInfo.commitDate,
            '__SYSTEM_INFO__': `${process.platform} ${process.arch} ${process.version}`,
            '__BUILD_HOSTNAME__': buildInfo.hostname,
            '__BUILD_TIMESTAMP__': buildInfo.timestamp,
            preventAssignment: true,
        }),
    ],
    build: {
        target: 'esnext',
        outDir: 'dist',
        lib: {
            entry: './src/main.ts',
            formats: ['es'],
            fileName: 'main',
        },
        rollupOptions: {
            external: [
                // Command packages
                '@eldrforge/core',
                '@eldrforge/commands-git',
                '@eldrforge/commands-tree',
                '@eldrforge/commands-publish',
                '@eldrforge/commands-audio',
                // Foundation packages
                '@eldrforge/ai-service',
                '@eldrforge/git-tools',
                '@eldrforge/github-tools',
                '@eldrforge/shared',
                '@eldrforge/tree-core',
                '@eldrforge/tree-execution',
                '@eldrforge/audio-tools',
                // MCP dependencies
                '@modelcontextprotocol/sdk',
                // External dependencies
                '@theunwalked/dreadcabinet',
                '@theunwalked/cardigantime',
                '@theunwalked/unplayable',
                '@riotprompt/riotprompt',
                '@riotprompt/riotprompt/formatter',
                '@riotprompt/riotprompt/chat'
            ],
            input: 'src/main.ts',
            output: {
                dir: 'dist',
                format: 'es',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                preserveModules: true,
                preserveModulesRoot: 'src',
                exports: 'named',
            },
            plugins: [
                shebang({
                    shebang: '#!/usr/bin/env node',
                }),
            ],
        },
        // Make sure Vite generates ESM-compatible code
        modulePreload: false,
        minify: false,
        sourcemap: true
    },
});
