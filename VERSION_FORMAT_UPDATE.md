# Version Format Update - Aligned with Protokoll

## Summary

Updated kodrdriv to use the same version format as protokoll, which includes git commit information in the version string. This provides better visibility into which exact build is running.

## Changes Made

### 1. Updated vite.config.ts
- Removed `BUILD_HOSTNAME` and `BUILD_TIMESTAMP` from the build metadata
- Simplified to match protokoll's approach with just git info and system info
- Removed unused `os` import

### 2. Updated constants.ts
- Removed `BUILD_HOSTNAME` and `BUILD_TIMESTAMP` exports
- Added JSDoc comments to `VERSION` and `PROGRAM_NAME` constants to match cardigantime style
- Version format: `VERSION (BRANCH/COMMIT TAGS DATE) SYSTEM_INFO`

### 3. Updated MCP Tool (kodrdriv_get_version)
- Changed return format to match protokoll's `protokoll_get_version` tool
- Returns: `{ version, programName, fullVersion }`
- Message format: `kodrdriv VERSION`
- Removed build hostname and timestamp from response

### 4. Updated CLI Arguments (arguments.ts)
- Simplified version string display
- Removed BUILD_HOSTNAME and BUILD_TIMESTAMP references
- Version now shows just the formatted VERSION constant

### 5. Updated Application (application.ts)
- Updated `getVersionInfo()` function signature to return `{ version, programName, fullVersion, formatted }`
- Removed buildHostname and buildTimestamp from return type
- Simplified application startup logging to show only version

### 6. Updated Tests
- Fixed application.test.ts to expect new version format
- Updated mock constants to remove BUILD_HOSTNAME and BUILD_TIMESTAMP

### 7. Updated cardigantime Dependency
- Bumped from `^0.0.22` to `^0.0.23` to use latest version
- Aligns with cardigantime's own version format approach

## Version Format

### Before
```
1.5.0-dev.0
Built on: hostname
Build time: 2026-01-27T12:00:00.000Z
```

### After
```
1.5.0-dev.0 (working/5c697f5  2026-01-22 13:13:31 -0800) darwin arm64 v24.8.0
```

## Benefits

1. **Consistency**: Same format across protokoll and kodrdriv
2. **Git Traceability**: Can see exact commit and branch for any build
3. **System Info**: Platform, architecture, and Node version included
4. **Simplicity**: Removed unnecessary build metadata (hostname/timestamp)
5. **Alignment**: Follows cardigantime integration guide best practices

## Testing

- All tests passing (1062 total: 1061 passed, 1 skipped)
- Build successful
- Version output verified: `./dist/main.js --version`
- MCP tool format verified in tool definitions

## Related Files

- `/Users/tobrien/gitw/grunnverk/kodrdriv/vite.config.ts`
- `/Users/tobrien/gitw/grunnverk/kodrdriv/src/constants.ts`
- `/Users/tobrien/gitw/grunnverk/kodrdriv/src/mcp/tools.ts`
- `/Users/tobrien/gitw/grunnverk/kodrdriv/src/arguments.ts`
- `/Users/tobrien/gitw/grunnverk/kodrdriv/src/application.ts`
- `/Users/tobrien/gitw/grunnverk/kodrdriv/tests/application.test.ts`
- `/Users/tobrien/gitw/grunnverk/kodrdriv/package.json`

## Reference Implementation

Based on:
- `/Users/tobrien/gitw/redaksjon/protokoll/vite.config.ts`
- `/Users/tobrien/gitw/redaksjon/protokoll/src/constants.ts`
- `/Users/tobrien/gitw/redaksjon/protokoll/src/mcp/tools/systemTools.ts`
- `/Users/tobrien/gitw/utilarium/cardigantime/guide/integration.md`
