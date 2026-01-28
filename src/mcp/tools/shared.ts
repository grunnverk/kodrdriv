/**
 * Shared utilities for MCP tools
 */

/* eslint-disable import/extensions */
import type { ToolExecutionContext, ToolResult } from '../types.js';
import { formatErrorForMCP, extractCommandErrorDetails, getLogger as getCoreLogger } from '@grunnverk/core';
import { installLogCapture } from '../logCapture.js';
import { scanForPackageJsonFiles, buildDependencyGraph, topologicalSort } from '@grunnverk/tree-core';
// Import setLogger to configure tree-execution logging to go through winston (not console)
import { setLogger as setTreeExecutionLogger } from '@grunnverk/tree-execution';
import { loadConfig } from '../../utils/config.js';
/* eslint-enable import/extensions */

/**
 * Default patterns for subprojects to exclude from scanning
 */
const DEFAULT_EXCLUDE_SUBPROJECTS = [
    'doc/',
    'docs/',
    'test-*/',
];

/**
 * Configure tree-execution to use the winston logger instead of console.log
 * This is critical for MCP server mode where console output interferes with the protocol.
 * We route all tree-execution logs through the core winston logger, which is:
 * 1. Captured by installLogCapture for MCP responses
 * 2. Has console transports removed in MCP server mode
 */
export function configureTreeExecutionLogger(): void {
    const coreLogger = getCoreLogger();
    setTreeExecutionLogger({
        info: (message: string, ...args: any[]) => coreLogger.info(message, ...args),
        error: (message: string, ...args: any[]) => coreLogger.error(message, ...args),
        warn: (message: string, ...args: any[]) => coreLogger.warn(message, ...args),
        verbose: (message: string, ...args: any[]) => coreLogger.verbose(message, ...args),
        debug: (message: string, ...args: any[]) => coreLogger.debug(message, ...args),
        silly: (message: string, ...args: any[]) => coreLogger.silly(message, ...args),
    });
}

/**
 * Helper to create Config object from MCP args
 * Returns a config object that's compatible with command functions
 */
export function createConfig(args: any, _context: ToolExecutionContext): any {
    return {
        dryRun: args.dry_run || false,
        verbose: false,
        debug: false,
        // Required Cardigantime.Config fields (minimal)
        configDirectory: process.cwd(),
        discoveredConfigDirs: [],
        resolvedConfigDirs: [],
    };
}

/**
 * Set up the onPackageFocus callback to send progress notifications
 */
export function setupPackageFocusCallback(config: any, context: ToolExecutionContext): void {
    if (!config.tree) {
        config.tree = {};
    }

    // Only set up callback if we have notification capability
    if (context.sendNotification && context.progressToken) {
        config.tree.onPackageFocus = async (packageName: string, index: number, total: number) => {
            const progress = index + 1; // Convert to 1-based for display
            const message = `Processing ${packageName} (${progress}/${total})`;

            // Build params object without undefined values to prevent JSON serialization issues
            const progressParams: Record<string, any> = {
                progressToken: context.progressToken!,
                progress: Math.floor(progress),
                total: Math.floor(total),
                message,
            };

            // Send progress notification (fire and forget - don't block execution)
            void context.sendNotification!({
                method: 'notifications/progress',
                params: progressParams as any,
            }).catch(() => {
                // Ignore errors in progress notifications
            });
        };
    } else if (context.progressCallback) {
        // Fallback to progress callback if sendNotification isn't available
        config.tree.onPackageFocus = async (packageName: string, index: number, total: number) => {
            const progress = index + 1; // Convert to 1-based for display
            const message = `Processing ${packageName} (${progress}/${total})`;

            // Call progress callback (fire and forget - don't block execution)
            void Promise.resolve(
                context.progressCallback!(
                    Math.floor(progress),
                    Math.floor(total),
                    message,
                    undefined
                )
            ).catch(() => {
                // Ignore errors in progress callback
            });
        };
    }
}

/**
 * Helper function to discover packages for tree operations
 * Returns package count and build order for better progress tracking
 */
export async function discoverTreePackages(
    directory: string,
    packages?: string[],
    startFrom?: string
): Promise<{ total: number; buildOrder: string[]; message: string } | null> {
    try {
        // Load config to get workspace exclusions
        const config = await loadConfig(directory);
        const excludeSubprojects = config?.workspace?.excludeSubprojects ?? DEFAULT_EXCLUDE_SUBPROJECTS;

        // Build exclusion patterns (same as workspace resource)
        const excludedPatterns = [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**',
            // Add subproject exclusions
            ...excludeSubprojects.map((pattern: string) => `**/${pattern}**`),
        ];

        // Send status update about discovering packages
        const packageJsonPaths = await scanForPackageJsonFiles(directory, excludedPatterns);

        if (packageJsonPaths.length === 0) {
            return null;
        }

        // Build dependency graph to get build order
        const dependencyGraph = await buildDependencyGraph(packageJsonPaths);
        let buildOrder = topologicalSort(dependencyGraph);

        // Filter packages if specific packages are requested
        if (packages && packages.length > 0) {
            const packageSet = new Set(packages);
            buildOrder = buildOrder.filter(pkg => packageSet.has(pkg));
        }

        // Filter by startFrom if specified
        if (startFrom) {
            const startIndex = buildOrder.indexOf(startFrom);
            if (startIndex >= 0) {
                buildOrder = buildOrder.slice(startIndex);
            }
        }

        return {
            total: buildOrder.length,
            buildOrder,
            message: `Found ${buildOrder.length} package${buildOrder.length !== 1 ? 's' : ''} to process`,
        };
    } catch {
        // If discovery fails, return null to fall back to default behavior
        return null;
    }
}

/**
 * Extract package progress information from log messages
 * Looks for patterns like "[1/13] package-name: Running..." or similar
 */
export function extractPackageProgress(logs: string[], totalPackages: number | null): {
    currentPackage: string | null;
    currentIndex: number | null;
    completedCount: number;
    message: string;
} {
    if (logs.length === 0) {
        return {
            currentPackage: null,
            currentIndex: null,
            completedCount: 0,
            message: 'Processing...',
        };
    }

    // Look for package execution patterns in logs
    // Pattern: "[N/TOTAL] package-name: Running command..." or "[N/TOTAL] package-name: ..."
    // Also handles emoji prefixes like "ℹ️ [1/13] package-name: ..."
    // The logCapture format is: "ℹ️ [1/13] package-name: message"
    // Match emoji (any non-bracket chars) + space, then the bracket pattern
    const packagePattern = /(?:[^[]+\s+)?\[(\d+)\/(\d+)\]\s+([^:]+):\s*(.+)/;

    // Also look for completion patterns
    const completionPattern = /(?:✅|✓|Success|completed|finished).*?\[(\d+)\/(\d+)\]/i;

    let currentPackage: string | null = null;
    let currentIndex: number | null = null;
    let completedCount = 0;

    // Scan logs from newest to oldest to find the most recent package being processed
    for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];
        const packageMatch = log.match(packagePattern);

        if (packageMatch) {
            const index = parseInt(packageMatch[1], 10);
            const packageName = packageMatch[3].trim();
            const action = packageMatch[4].trim();

            // Skip "Discovery" messages for progress tracking (they're at index 0)
            // But still use them to know we've started
            if (packageName.toLowerCase() !== 'discovery') {
                // Use the most recent package we find
                if (!currentPackage) {
                    currentPackage = packageName;
                    currentIndex = index;
                }

                // Check if this looks like a completion
                if (action.toLowerCase().includes('completed') ||
                    action.toLowerCase().includes('success') ||
                    action.toLowerCase().includes('finished') ||
                    log.includes('✅') ||
                    log.includes('✓')) {
                    completedCount = Math.max(completedCount, index);
                }
            }
        }

        // Also check for completion patterns
        const completionMatch = log.match(completionPattern);
        if (completionMatch) {
            const index = parseInt(completionMatch[1], 10);
            completedCount = Math.max(completedCount, index);
        }
    }

    // Build progress message
    let message: string;
    if (currentPackage && currentIndex !== null && totalPackages !== null) {
        message = `Processing ${currentPackage} (${currentIndex}/${totalPackages})`;
    } else if (currentPackage) {
        message = `Processing ${currentPackage}...`;
    } else if (totalPackages !== null) {
        message = `Found ${totalPackages} package${totalPackages !== 1 ? 's' : ''} to process`;
    } else {
        // Fallback: use the latest log message, cleaned up
        const latestLog = logs[logs.length - 1];
        message = latestLog.replace(/^[^\s]+\s/, '').trim() || 'Processing...';
    }

    return {
        currentPackage,
        currentIndex,
        completedCount,
        message,
    };
}

/**
 * Generic command executor - wraps command execution with common patterns
 * Handles directory changes, config creation, log capturing, and error formatting
 */
export async function executeCommand<T>(
    args: any,
    context: ToolExecutionContext,
    commandFn: (config: any) => Promise<T>,
    configBuilder?: (config: any, args: any) => void,
    resultBuilder?: (result: T, args: any, originalCwd: string) => any,
    getInitialStatus?: (args: any, directory: string) => Promise<{ total: number; message: string } | null>
): Promise<ToolResult> {
    const originalCwd = process.cwd();

    // Install log capturing transport on the global logger
    const { getLogs, remove } = installLogCapture();

    // Set up progress polling if callback is provided
    let progressInterval: NodeJS.Timeout | null = null;
    let lastLogCount = 0;
    let totalCount: number | null = null;
    let initialMessage = 'Starting command...';
    let lastSentProgress: number | null = null;
    let lastSentMessage: string | null = null;

    // Discover initial status for tree operations
    if (getInitialStatus) {
        const targetDir = args.directory || originalCwd;
        try {
            const initialStatus = await getInitialStatus(args, targetDir);
            if (initialStatus) {
                totalCount = initialStatus.total;
                initialMessage = initialStatus.message;
                // Log the discovery message with progress context so it can be parsed
                if (totalCount > 0) {
                    const coreLogger = getCoreLogger();
                    coreLogger.info(`[0/${totalCount}] Discovery: ${initialMessage}`);
                }
            }
        } catch {
            // If discovery fails, continue with default behavior
        }
    }

    // Set up progress reporting if sendNotification is available
    if (context.sendNotification && context.progressToken) {
        // Send initial progress with discovered total if available
        // Build params object without undefined values to prevent JSON serialization issues
        const initialParams: Record<string, any> = {
            progressToken: context.progressToken,
            progress: 0,
        };
        if (totalCount !== null && totalCount !== undefined) {
            initialParams.total = Math.floor(totalCount);
        }
        if (initialMessage) {
            initialParams.message = initialMessage;
        }
        lastSentProgress = 0;
        lastSentMessage = initialMessage;
        void context.sendNotification({
            method: 'notifications/progress',
            params: initialParams as any,
        }).catch(() => {
            // Ignore errors in progress notifications
        });

        // Poll logs every 2 seconds to send progress updates
        progressInterval = setInterval(() => {
            const logs = getLogs();
            const newLogs = logs.slice(lastLogCount);
            lastLogCount = logs.length;

            if (newLogs.length > 0 || logs.length > 0) {
                // Extract package progress information from logs
                const packageProgress = extractPackageProgress(logs, totalCount);

                // Use completed count if available, otherwise use current index
                // Ensure progress is always an integer to prevent JSON serialization issues
                const progress = Math.floor(
                    packageProgress.completedCount > 0
                        ? packageProgress.completedCount
                        : (packageProgress.currentIndex ?? 0)
                );

                // Only send update if progress or message changed
                const message = packageProgress.message || initialMessage;
                if (progress !== lastSentProgress || message !== lastSentMessage) {
                    lastSentProgress = progress;
                    lastSentMessage = message;

                    // Send progress notification (fire and forget - don't block execution)
                    // Build params object without undefined values to prevent JSON serialization issues
                    const progressParams: Record<string, any> = {
                        progressToken: context.progressToken!,
                        progress,
                    };
                    if (totalCount !== null && totalCount !== undefined) {
                        progressParams.total = Math.floor(totalCount);
                    }
                    if (message) {
                        progressParams.message = message;
                    }
                    void context.sendNotification!({
                        method: 'notifications/progress',
                        params: progressParams as any,
                    }).catch(() => {
                        // Ignore errors in progress notifications
                    });
                }
            } else if (totalCount !== null) {
                // Even if no new logs, send periodic heartbeat with current status
                // But only if we haven't sent this exact message recently
                const heartbeatMessage = initialMessage;
                if (heartbeatMessage !== lastSentMessage || 0 !== lastSentProgress) {
                    lastSentProgress = 0;
                    lastSentMessage = heartbeatMessage;
                    const heartbeatParams: Record<string, any> = {
                        progressToken: context.progressToken!,
                        progress: 0,
                        total: Math.floor(totalCount),
                    };
                    if (heartbeatMessage) {
                        heartbeatParams.message = heartbeatMessage;
                    }
                    void context.sendNotification!({
                        method: 'notifications/progress',
                        params: heartbeatParams as any,
                    }).catch(() => {
                        // Ignore errors in progress notifications
                    });
                }
            }
        }, 2000); // Poll every 2 seconds
    } else if (context.progressCallback) {
        // Fallback to progress callback if sendNotification isn't available
        let lastCallbackProgress: number | null = null;
        let lastCallbackMessage: string | null = null;
        void Promise.resolve(context.progressCallback(0, totalCount ?? null, initialMessage, [])).catch(() => {
            // Ignore errors in progress callback
        });
        lastCallbackProgress = 0;
        lastCallbackMessage = initialMessage;

        // Poll logs every 2 seconds to send progress updates
        progressInterval = setInterval(() => {
            const logs = getLogs();
            const newLogs = logs.slice(lastLogCount);
            lastLogCount = logs.length;

            if (newLogs.length > 0 || logs.length > 0) {
                // Extract package progress information from logs
                const packageProgress = extractPackageProgress(logs, totalCount);

                // Use completed count if available, otherwise use current index
                // Ensure progress is always an integer to prevent JSON serialization issues
                const progress = Math.floor(
                    packageProgress.completedCount > 0
                        ? packageProgress.completedCount
                        : (packageProgress.currentIndex ?? 0)
                );

                // Only call callback if progress or message changed
                const message = packageProgress.message || initialMessage;
                if (progress !== lastCallbackProgress || message !== lastCallbackMessage) {
                    lastCallbackProgress = progress;
                    lastCallbackMessage = message;

                    // Call progress callback (fire and forget - don't block execution)
                    void Promise.resolve(
                        context.progressCallback!(
                            progress,
                            totalCount !== null ? Math.floor(totalCount) : null,
                            message,
                            newLogs.length > 0 ? newLogs : undefined
                        )
                    ).catch(() => {
                        // Ignore errors in progress callback
                    });
                }
            } else if (totalCount !== null) {
                // Even if no new logs, send periodic heartbeat with current status
                // But only if we haven't sent this exact message recently
                const heartbeatMessage = initialMessage;
                if (heartbeatMessage !== lastCallbackMessage || 0 !== lastCallbackProgress) {
                    lastCallbackProgress = 0;
                    lastCallbackMessage = heartbeatMessage;
                    void Promise.resolve(
                        context.progressCallback!(0, Math.floor(totalCount), heartbeatMessage, undefined)
                    ).catch(() => {
                        // Ignore errors in progress callback
                    });
                }
            }
        }, 2000); // Poll every 2 seconds
    }

    try {
        // Change to target directory if specified
        if (args.directory) {
            process.chdir(args.directory);
        }

        // Create base config
        const config = createConfig(args, context);

        // Allow command-specific config customization
        if (configBuilder) {
            configBuilder(config, args);
        }

        // Execute the command
        const result = await commandFn(config);

        // Stop progress polling
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }

        // Restore original directory
        if (args.directory) {
            process.chdir(originalCwd);
        }

        // Get captured logs and remove transport
        const logs = getLogs();
        remove();

        // Send final progress update
        if (context.sendNotification && context.progressToken) {
            const packageProgress = extractPackageProgress(logs, totalCount);
            const finalMessage = packageProgress.message ||
                (logs.length > 0
                    ? logs[logs.length - 1].replace(/^[^\s]+\s/, '').trim()
                    : 'Command completed successfully');
            // Ensure progress is always an integer to prevent JSON serialization issues
            const finalProgress = Math.floor(
                packageProgress.completedCount > 0
                    ? packageProgress.completedCount
                    : (totalCount ?? logs.length)
            );
            const finalTotal = totalCount !== null ? Math.floor(totalCount) : finalProgress;
            const finalParams: Record<string, any> = {
                progressToken: context.progressToken,
                progress: finalProgress,
            };
            if (finalTotal !== null && finalTotal !== undefined) {
                finalParams.total = finalTotal;
            }
            if (finalMessage) {
                finalParams.message = finalMessage;
            }
            void context.sendNotification({
                method: 'notifications/progress',
                params: finalParams as any,
            }).catch(() => {
                // Ignore errors in progress notifications
            });
        } else if (context.progressCallback) {
            const packageProgress = extractPackageProgress(logs, totalCount);
            const finalMessage = packageProgress.message ||
                (logs.length > 0
                    ? logs[logs.length - 1].replace(/^[^\s]+\s/, '').trim()
                    : 'Command completed successfully');
            // Ensure progress is always an integer to prevent JSON serialization issues
            const finalProgress = Math.floor(
                packageProgress.completedCount > 0
                    ? packageProgress.completedCount
                    : (totalCount ?? logs.length)
            );
            const finalTotal = totalCount !== null ? Math.floor(totalCount) : finalProgress;
            void Promise.resolve(
                context.progressCallback(finalProgress, finalTotal, finalMessage, logs)
            ).catch(() => {
                // Ignore errors in progress callback
            });
        }

        // Build the result
        const data = resultBuilder ? resultBuilder(result, args, originalCwd) : { result, directory: args.directory || originalCwd };

        return {
            success: true,
            data,
            message: args.dry_run ? 'Dry run completed' : 'Command completed successfully',
            logs: logs.length > 0 ? logs : ['ℹ️ Command executed successfully (no logs captured)'],
        };
    } catch (error: any) {
        // Stop progress polling on error
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }

        // Restore directory on error
        if (args.directory && process.cwd() !== originalCwd) {
            try {
                process.chdir(originalCwd);
            } catch {
                // Ignore errors restoring directory
            }
        }

        // Get captured logs and remove transport
        const logs = getLogs();
        remove();

        // Send error progress update
        if (context.sendNotification && context.progressToken) {
            const errorParams: Record<string, any> = {
                progressToken: context.progressToken,
                progress: Math.floor(logs.length),
            };
            const errorMessage = `Error: ${error.message || 'Command failed'}`;
            if (errorMessage) {
                errorParams.message = errorMessage;
            }
            void context.sendNotification({
                method: 'notifications/progress',
                params: errorParams as any,
            }).catch(() => {
                // Ignore errors in progress notifications
            });
        } else if (context.progressCallback) {
            void Promise.resolve(
                context.progressCallback(
                    Math.floor(logs.length),
                    null,
                    `Error: ${error.message || 'Command failed'}`,
                    logs.length > 0 ? logs : undefined
                )
            ).catch(() => {
                // Ignore errors in progress callback
            });
        }

        const formatted = formatErrorForMCP(error);
        const commandDetails = extractCommandErrorDetails(error);

        // Always include logs, even if empty, so user can see what happened
        const allLogs = logs.length > 0
            ? logs
            : ['ℹ️ Command started but no logs were captured before failure'];

        return {
            success: false,
            error: formatted.message,
            context: formatted.context,
            recovery: formatted.recovery,
            details: {
                stdout: commandDetails.stdout,
                stderr: commandDetails.stderr,
                exitCode: commandDetails.exitCode,
                phase: commandDetails.phase,
                files: commandDetails.files,
            },
            logs: allLogs,
        };
    }
}
