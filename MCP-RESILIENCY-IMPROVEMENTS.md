# MCP Server Resiliency Improvements

## Summary

Applied resiliency improvements from riotplan MCP server to kodrdriv MCP server to prevent server crashes and improve error handling.

## Changes Made

### 1. Added Error Logging Helper (Line 66-79)

Added a `logError` helper function that provides structured error logging with timestamps and stack traces:

```typescript
const logError = (context: string, error: unknown) => {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log to stderr for MCP debugging
    console.error(`[${timestamp}] KodrDriv MCP Error (${context}):`, errorMessage);
    if (errorStack) {
        console.error('Stack:', errorStack);
    }
};
```

### 2. Added Try-Catch Wrapper in Tool Execution (Line 127-280)

Wrapped the entire tool execution logic in a try-catch block to catch any unhandled errors:

```typescript
async (args, { sendNotification, _meta }) => {
    try {
        // ... existing tool execution code ...
    } catch (error) {
        // Catch any unhandled errors in tool execution
        logError(`tool:${name}`, error);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        return {
            content: [{
                type: 'text' as const,
                text: `=== Unhandled Error in ${name} ===\n\n${errorMessage}\n\n${errorStack ? `Stack:\n${errorStack}` : ''}`,
            }],
            isError: true,
        };
    }
}
```

### 3. Added Global Error Handlers (Line 536-551)

Added process-level error handlers that prevent the server from crashing:

```typescript
// Set up global error handlers for better resilience
process.on('uncaughtException', (error) => {
    console.error('[KodrDriv MCP] Uncaught Exception:', error.message);
    console.error('Stack:', error.stack);
    // Don't exit - try to keep server running
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[KodrDriv MCP] Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    // Don't exit - try to keep server running
});
```

### 4. Improved Main Error Handler (Line 553-561)

Enhanced the main error handler with better logging:

```typescript
// Handle errors with better logging
main().catch((error) => {
    console.error('[KodrDriv MCP] Fatal error during startup:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
        console.error('Stack:', error.stack);
    }
    process.exit(1);
});
```

## Benefits

1. **Server Resilience**: The server will attempt to stay running even when encountering uncaught exceptions or unhandled rejections
2. **Better Error Visibility**: All errors are logged with timestamps, context, and stack traces to stderr for debugging
3. **Graceful Error Handling**: Tool execution errors are caught and returned as proper MCP error responses instead of crashing the server
4. **Improved Debugging**: Structured error logging makes it easier to diagnose issues in production

## Testing

All precommit checks pass:
- ✅ Linting
- ✅ TypeScript compilation
- ✅ All 1054 tests pass
- ✅ MCP compliance tests pass (5/5)

## Reference

These changes were based on the resiliency improvements made to the riotplan MCP server at `/Users/tobrien/gitw/kjerneverk/riotplan/src/mcp/server.ts`.
