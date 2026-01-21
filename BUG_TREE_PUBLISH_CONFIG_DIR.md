# Bug: tree_publish passes incorrect --config-dir path

## Problem

When `tree_publish` executes `kodrdriv publish` for each package, it passes `--config-dir` with the parent directory path, but kodrdriv's config discovery expects either:
1. The full path to the config directory (`.kodrdriv`), or
2. No `--config-dir` flag at all (to allow hierarchical discovery)

## Current Behavior

When `tree_publish` runs from `/Users/tobrien/gitw/grunnverk/kodrdriv`, it passes:
```
--config-dir "/Users/tobrien/gitw/grunnverk/kodrdriv"
```

This causes kodrdriv to look for a config directory named `kodrdriv` instead of `.kodrdriv`.

When `tree_publish` runs from `/Users/tobrien/gitw/grunnverk`, it passes:
```
--config-dir "/Users/tobrien/gitw/grunnverk"
```

This causes kodrdriv to look for a config directory named `grunnverk` instead of `.kodrdriv`.

## Expected Behavior

The config file exists at: `/Users/tobrien/gitw/grunnverk/.kodrdriv/config.yaml`

`tree_publish` should either:
1. Pass `--config-dir "/Users/tobrien/gitw/grunnverk/.kodrdriv"` (full path to config directory), or
2. Not pass `--config-dir` at all and let hierarchical discovery find `.kodrdriv` automatically

## Error Details

```
Command failed: kodrdriv publish --config-dir "/Users/tobrien/gitw/grunnverk"
[winston] ... "Using hierarchical discovery: configDirName=grunnverk, startingDir=/Users/tobrien/gitw"
[winston] ... "Checking for config directory: /Users/tobrien/gitw/grunnverk"
[winston] ... "Found config directory at level 0: /Users/tobrien/gitw/grunnverk"
[winston] ... "Attempting to load config file: /Users/tobrien/gitw/grunnverk/config.yaml"
[winston] ... "Config file not found at /Users/tobrien/gitw/grunnverk/config.yaml"
```

The system is looking for `/Users/tobrien/gitw/grunnverk/config.yaml` but the actual file is at `/Users/tobrien/gitw/grunnverk/.kodrdriv/config.yaml`.

## Location of Issue

The issue is in `/Users/tobrien/gitw/grunnverk/commands-tree/src/commands/tree.ts` around line 2476:

```typescript
if (runConfig.configDirectory) globalOptions.push(`--config-dir "${runConfig.configDirectory}"`);
```

## Investigation Needed

1. Find where `runConfig.configDirectory` is set in the tree_publish flow
2. Determine if it should:
   - Be set to the full path of the `.kodrdriv` directory (e.g., `/Users/tobrien/gitw/grunnverk/.kodrdriv`)
   - Not be set at all (let hierarchical discovery work)
   - Be set differently based on how kodrdriv's config discovery works

## Suggested Fix

Option 1: If `configDirectory` should point to the config directory itself:
- When setting `runConfig.configDirectory`, append `/.kodrdriv` to the directory path
- Or detect the config directory location and use that full path

Option 2: If hierarchical discovery should handle it:
- Don't set `runConfig.configDirectory` when it would point to a parent directory
- Only set it when explicitly provided by the user or when pointing to the actual `.kodrdriv` directory

## Testing

After fixing, verify that:
1. `tree_publish` can find the config at `/Users/tobrien/gitw/grunnverk/.kodrdriv/config.yaml`
2. The publish workflow completes successfully
3. Both scenarios work:
   - Running from `/Users/tobrien/gitw/grunnverk/kodrdriv`
   - Running from `/Users/tobrien/gitw/grunnverk`
