#!/usr/bin/env node
import { runApplication } from './application';
import { getLogger, closeLogger } from './logging';

/**
 * Main entry point - minimal wrapper around the application logic
 * Test commit: verifying tree publish behavior with small change
 */
async function main(): Promise<void> {
    try {
        await runApplication();
    } catch (error: any) {
        const logger = getLogger();
        logger.error('MAIN_ERROR_EXIT: Exiting due to error | Error: %s | Stack: %s | Status: terminating', error.message, error.stack);
        await closeLogger();
        process.exit(1);
    }
}

// Properly handle the main function with error handling and explicit process exit
main().then(async () => {
    await closeLogger();
    process.exit(0);
}).catch(async (error) => {
    const logger = getLogger();
    logger.error('MAIN_UNHANDLED_ERROR: Unhandled error in main process | Error: %s | Type: unhandled', error.message || error);
    await closeLogger();
    process.exit(1);
});
