/**
 * Log Capture Utility
 *
 * Provides in-memory log capturing for MCP tool execution
 * Intercepts winston logger output to provide real-time feedback
 */

/* eslint-disable import/extensions */
import { Writable } from 'stream';
import winston from 'winston';
import { getLogger } from '../logging.js';
/* eslint-enable import/extensions */

export interface CapturedLog {
    level: string;
    message: string;
}

/**
 * Create a log capturing transport and install it on the global logger
 * Returns functions to retrieve logs and remove the transport
 */
export function installLogCapture(): {
    getLogs: () => string[];
    remove: () => void;
    } {
    const capturedLogs: CapturedLog[] = [];
    const logger = getLogger();

    // Create a writable stream that captures log messages
    const captureStream = new Writable({
        write(chunk: any, _encoding: string, callback: (error?: Error | null) => void) {
            const message = chunk.toString();
            
            // Clean up the message - remove ANSI color codes and extra formatting
            // eslint-disable-next-line no-control-regex
            const cleanMessage = message.replace(/\x1B\[[0-9;]*[mG]/g, '').replace(/^(info|warn|error|debug|verbose):\s*/i, '').trim();
            
            // Detect level from message or default to info
            let level = 'info';
            if (message.includes('error:')) level = 'error';
            else if (message.includes('warn:')) level = 'warn';
            else if (message.includes('debug:')) level = 'debug';
            else if (message.includes('verbose:')) level = 'verbose';
            
            if (cleanMessage) {
                capturedLogs.push({
                    level,
                    message: cleanMessage,
                });
            }
            
            callback();
        },
    });

    // Create a custom winston transport that uses our stream
    const memoryTransport = new winston.transports.Stream({
        stream: captureStream,
        level: 'info', // Capture info and above (info, warn, error)
    });

    // Add our transport to the logger
    logger.add(memoryTransport);

    return {
        getLogs: () => capturedLogs.map(log => {
            // Format as a readable string with emoji indicators
            const emoji = {
                error: '❌',
                warn: '⚠️ ',
                info: 'ℹ️ ',
                debug: '🔍',
                verbose: '📝',
            }[log.level] || '  ';
            
            return `${emoji} ${log.message}`;
        }),
        remove: () => {
            // Remove our transport from the logger
            logger.remove(memoryTransport);
        },
    };
}
