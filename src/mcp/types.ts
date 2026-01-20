/**
 * MCP Type Definitions for KodrDriv
 *
 * This module defines types for the Model Context Protocol integration,
 * including protocol types, KodrDriv-specific types, and resource result types.
 */

// ============================================================================
// MCP Protocol Types
// ============================================================================

/**
 * MCP Tool definition
 * Represents a callable tool exposed via MCP
 */
export interface McpTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, McpToolParameter>;
        required?: string[];
    };
}

/**
 * MCP Tool Parameter definition
 * Describes a single parameter for a tool
 */
export interface McpToolParameter {
    type: string;
    description: string;
    enum?: string[];
    items?: { type: string };
}

/**
 * MCP Resource definition
 * Represents a readable resource exposed via MCP
 */
export interface McpResource {
    uri: string;
    name: string;
    description: string;
    mimeType?: string;
}

/**
 * MCP Prompt definition
 * Represents a workflow prompt template
 */
export interface McpPrompt {
    name: string;
    description: string;
    arguments?: Array<{
        name: string;
        description: string;
        required: boolean;
    }>;
}

/**
 * MCP Prompt Message
 * Represents a message in a prompt template
 */
export interface McpPromptMessage {
    role: 'user' | 'assistant';
    content: {
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
    };
}

// ============================================================================
// KodrDriv-Specific Types
// ============================================================================

/**
 * Parsed kodrdriv:// URI
 * Represents the structured components of a kodrdriv URI
 */
export interface KodrdrivUri {
    scheme: 'kodrdriv';
    type: 'config' | 'status' | 'workspace' | 'tree-graph' | 'package' |
          'recent-commits' | 'issues' | 'release-notes';
    path?: string;
    query?: Record<string, string>;
}

/**
 * Progress notification callback
 * Called periodically during long-running operations to send progress updates
 */
export interface ProgressCallback {
    (progress: number, total: number | null, message: string, logs?: string[]): void;
}

/**
 * Tool Execution Context
 * Provides context for tool execution
 */
export interface ToolExecutionContext {
    workingDirectory: string;
    config?: any; // KodrDriv config
    logger: any; // Logger instance
    progressCallback?: ProgressCallback; // Optional progress callback for long-running operations
}

/**
 * Tool Result
 * Standard result format for tool execution
 */
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
    // Enhanced error context for MCP
    context?: Record<string, any>;
    recovery?: string[];
    details?: {
        stdout?: string;
        stderr?: string;
        exitCode?: number;
        files?: string[];
        phase?: string;
    };
    // Progress reporting for long-running operations
    progress?: {
        current: number;
        total: number;
        currentStep: string;
        completedSteps: string[];
        remainingPackages?: string[];
    };
    // Captured log output from command execution
    logs?: string[];
}

// ============================================================================
// Resource Result Types
// ============================================================================

/**
 * Configuration Resource
 * Result of reading a kodrdriv configuration
 */
export interface ConfigResource {
    path: string;
    exists: boolean;
    config?: any;
    hierarchy?: string[];
}

/**
 * Status Resource
 * Result of reading repository status
 */
export interface StatusResource {
    repository: string;
    branch: string;
    staged: string[];
    modified: string[];
    untracked: string[];
    ahead: number;
    behind: number;
}

/**
 * Workspace Resource
 * Result of reading workspace structure
 */
export interface WorkspaceResource {
    root: string;
    packages: Array<{
        name: string;
        path: string;
        version: string;
    }>;
    dependencies: Record<string, string[]>;
}

/**
 * Tree Graph Resource
 * Result of reading dependency graph
 */
export interface TreeGraphResource {
    root: string;
    nodes: Array<{
        id: string;
        name: string;
        version: string;
        path: string;
    }>;
    edges: Array<{
        from: string;
        to: string;
        type: 'dependency' | 'devDependency' | 'peerDependency';
    }>;
}

/**
 * Package Resource
 * Result of reading package information
 */
export interface PackageResource {
    name: string;
    version: string;
    path: string;
    packageJson: any;
    dependencies: string[];
    devDependencies: string[];
}

/**
 * Recent Commits Resource
 * Result of reading recent commits
 */
export interface RecentCommitsResource {
    repository: string;
    branch: string;
    commits: Array<{
        hash: string;
        shortHash: string;
        author: string;
        date: string;
        message: string;
    }>;
}

/**
 * GitHub Issues Resource
 * Result of reading GitHub issues
 */
export interface GitHubIssuesResource {
    repository: string;
    owner: string;
    repo: string;
    issues: Array<{
        number: number;
        title: string;
        state: 'open' | 'closed';
        body: string;
        createdAt: string;
        updatedAt: string;
        labels: string[];
    }>;
}

/**
 * Release Notes Resource
 * Result of reading release notes
 */
export interface ReleaseNotesResource {
    repository: string;
    version: string;
    tag: string;
    date: string;
    notes: string;
    commits: Array<{
        hash: string;
        message: string;
    }>;
}
