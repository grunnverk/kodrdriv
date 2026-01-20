# KodrDriv MCP Prompts Reference

Complete reference for all workflow prompts available in KodrDriv.

## What are Prompts?

Prompts are workflow templates that guide you through common Git operations by combining multiple tools and resources in a specific sequence.

## Available Prompts

### 1. fix_and_commit

Run precommit checks, fix issues, and commit changes.

**Arguments:**
- `directory` (optional) - Repository directory

**Workflow:**
1. Run `kodrdriv_precommit` with `fix=true`
2. Review any unfixed issues
3. Run `kodrdriv_commit` with `sendit=true`

**Use Case:**
- Before committing code
- To ensure all checks pass
- To fix linting and formatting issues automatically

**Example in Cursor:**
> "Use kodrdriv to fix issues and commit my changes"

### 2. prepare_release

Complete release workflow: version bump, release notes, publish.

**Arguments:**
- `version_type` (required) - patch, minor, or major

**Workflow:**
1. Generate release notes with `kodrdriv_release`
2. Review the notes
3. Publish with `kodrdriv_publish` using specified version type

**Use Case:**
- Preparing a new release
- Automating version bumping and release notes
- Publishing to npm with proper documentation

**Example in Cursor:**
> "Prepare a minor release using kodrdriv"

### 3. monorepo_publish

Guided monorepo publishing workflow.

**Arguments:**
- `packages` (optional) - Comma-separated list of packages

**Workflow:**
1. Run `kodrdriv_tree_precommit` to verify all packages
2. Use `kodrdriv_tree_publish` to publish in dependency order
3. Verify all packages published successfully

**Use Case:**
- Publishing multiple packages in a monorepo
- Ensuring correct dependency order
- Coordinated multi-package releases

**Example in Cursor:**
> "Publish all changed packages in the monorepo"

### 4. dependency_update

Check and update dependencies with analysis.

**Arguments:** None

**Workflow:**
1. Run `kodrdriv_tree_updates` to find outdated dependencies
2. Review the updates and their impact
3. Update critical dependencies first
4. Test after each update
5. Commit the changes

**Use Case:**
- Regular dependency maintenance
- Security updates
- Keeping packages up-to-date

**Example in Cursor:**
> "Check for dependency updates across the monorepo"

### 5. smart_merge

Handle merge conflicts with context.

**Arguments:**
- `branch` (required) - Branch to merge from

**Workflow:**
1. Use `kodrdriv_pull` to fetch latest
2. Attempt merge
3. If conflicts occur, analyze and suggest resolutions
4. After resolving, run `kodrdriv_precommit`
5. Commit the merge

**Use Case:**
- Merging feature branches
- Handling merge conflicts intelligently
- Ensuring tests pass after merge

**Example in Cursor:**
> "Merge the feature-x branch using kodrdriv"

## How to Use Prompts

### In Cursor

Simply ask in natural language:
```
"Use the fix_and_commit workflow"
"Prepare a patch release"
"Help me merge the develop branch"
```

### Via MCP Inspector

```
prompts/get {
  "name": "fix_and_commit",
  "arguments": {
    "directory": "/path/to/repo"
  }
}
```

### Programmatically

```javascript
const messages = await getPrompt('prepare_release', {
  version_type: 'minor'
});
// Execute the workflow
```

## Prompt Structure

Each prompt returns an array of messages that guide the workflow:

```typescript
{
  role: 'user' | 'assistant';
  content: {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  };
}
```

## Best Practices

1. **Use prompts for complex workflows** - They combine multiple operations safely
2. **Review before executing** - Prompts guide you, but you control execution
3. **Customize as needed** - Arguments allow flexibility
4. **Check prerequisites** - Some prompts require specific files or state
5. **Follow the sequence** - Steps are ordered for a reason

## Creating Custom Prompts

To add your own prompts:

1. Define the prompt in `src/mcp/prompts.ts`
2. Implement the message generator function
3. Add to the `getPrompts()` array
4. Document the workflow and use cases

## Integration Tips

**With Cursor:**
- Prompts appear as suggested workflows
- AI assistant guides you through each step
- Results are presented for review

**With Other MCP Clients:**
- Call `prompts/list` to discover available workflows
- Call `prompts/get` with prompt name and args
- Execute the recommended sequence of operations
