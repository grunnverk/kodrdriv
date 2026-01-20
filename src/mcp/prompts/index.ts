/**
 * MCP Prompt Handlers
 *
 * Provides workflow templates via MCP prompts.
 * Prompts are loaded from external markdown files in this directory.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
/* eslint-disable import/extensions */
import type { McpPrompt, McpPromptMessage } from '../types.js';
/* eslint-enable import/extensions */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Helper to resolve the prompts directory path
 * When bundled, the MCP server is at dist/mcp-server.js and prompts are at dist/mcp/prompts/
 * When running from source, prompts are at src/mcp/prompts/
 */
function getPromptsDir(): string {
    // Check if we're running from a bundled file (dist/mcp-server.js)
    // When bundled, __dirname will be the 'dist' directory
    const isBundled = __dirname.includes('/dist') || __dirname.endsWith('dist') ||
                      __filename.includes('dist/mcp-server.js') || __filename.includes('dist\\mcp-server.js');

    if (isBundled) {
        // When bundled, prompts are at dist/mcp/prompts/
        const promptsDir = resolve(__dirname, 'mcp/prompts');
        return promptsDir;
    }
    // When running from source, prompts are in the same directory as this file
    return __dirname;
}

/**
 * Helper to load a prompt template from a markdown file
 */
function loadTemplate(name: string): string {
    const promptsDir = getPromptsDir();
    const path = resolve(promptsDir, `${name}.md`);
    try {
        return readFileSync(path, 'utf-8').trim();
    } catch (error) {
        throw new Error(`Failed to load prompt template "${name}" from ${path}: ${error}`);
    }
}

/**
 * Helper to replace placeholders in a template
 */
function fillTemplate(template: string, args: Record<string, string>): string {
    return template.replace(/\${(\w+)}/g, (_, key) => {
        return args[key] || `[${key}]`;
    });
}

/**
 * Get all available prompts
 */
export function getPrompts(): McpPrompt[] {
    return [
        {
            name: 'fix_and_commit',
            description: 'Run precommit checks, fix issues, and commit changes',
            arguments: [
                {
                    name: 'directory',
                    description: 'Repository directory',
                    required: false,
                },
            ],
        },
        {
            name: 'full_publish',
            description: 'Guided monorepo publishing workflow',
            arguments: [
                {
                    name: 'packages',
                    description: 'Packages to publish (comma-separated)',
                    required: false,
                },
            ],
        },
        {
            name: 'dependency_update',
            description: 'Check and update dependencies with analysis',
            arguments: [],
        },
        {
            name: 'check_development',
            description: 'Verify projects are ready for development (branch, sync, dev versions, links)',
            arguments: [
                {
                    name: 'directory',
                    description: 'Repository directory (defaults to current directory)',
                    required: false,
                },
            ],
        },
    ];
}

/**
 * Get a prompt by name
 */
export async function getPrompt(
    name: string,
    args: Record<string, string>
): Promise<McpPromptMessage[]> {
    // Validate prompt exists
    const prompts = getPrompts();
    if (!prompts.find(p => p.name === name)) {
        throw new Error(`Unknown prompt: ${name}`);
    }

    // Load and fill template
    const template = loadTemplate(name);

    // Set default values for common arguments if missing
    const filledArgs = { ...args };
    if (name === 'fix_and_commit' && !filledArgs.directory) filledArgs.directory = 'current directory';
    if (name === 'full_publish' && !filledArgs.packages) filledArgs.packages = 'all packages with changes';
    if (name === 'check_development' && !filledArgs.directory) filledArgs.directory = 'current directory';

    const content = fillTemplate(template, filledArgs);

    return [
        {
            role: 'user',
            content: {
                type: 'text',
                text: content,
            },
        },
    ];
}
