# KodrDriv MCP Resources Reference

Complete reference for all 8 resource types available in KodrDriv.

## Resource URI Scheme

All kodrdriv resources use the `kodrdriv://` URI scheme.

## Resource Types

### 1. Configuration (`config`)

Access repository configuration.

**URI Pattern:** `kodrdriv://config/{path}`

**Parameters:**
- `path` - Absolute path to repository

**Example:**
```
kodrdriv://config//Users/dev/myproject
```

**Returns:**
```typescript
{
  path: string;
  exists: boolean;
  config?: object;
  hierarchy?: string[];
}
```

### 2. Status (`status`)

Get current git repository status.

**URI Pattern:** `kodrdriv://status/{path}`

**Parameters:**
- `path` - Absolute path to repository

**Example:**
```
kodrdriv://status//Users/dev/myproject
```

**Returns:**
```typescript
{
  repository: string;
  branch: string;
  staged: string[];
  modified: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}
```

### 3. Workspace (`workspace`)

Get current workspace/monorepo structure.

**URI Pattern:** `kodrdriv://workspace`

**Parameters:** None

**Example:**
```
kodrdriv://workspace
```

**Returns:**
```typescript
{
  root: string;
  packages: Array<{
    name: string;
    path: string;
    version: string;
  }>;
  dependencies: Record<string, string[]>;
}
```

### 4. Tree Graph (`tree-graph`)

Get dependency graph for monorepo.

**URI Pattern:** `kodrdriv://tree-graph/{path}`

**Parameters:**
- `path` - Absolute path to monorepo

**Example:**
```
kodrdriv://tree-graph//Users/dev/monorepo
```

**Returns:**
```typescript
{
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
```

### 5. Package (`package`)

Get information about a specific package.

**URI Pattern:** `kodrdriv://package/{packageName}`

**Parameters:**
- `packageName` - Package name (e.g., @scope/package-name)

**Example:**
```
kodrdriv://package/@grunnverk/kodrdriv
```

**Returns:**
```typescript
{
  name: string;
  version: string;
  path: string;
  packageJson: object;
  dependencies: string[];
  devDependencies: string[];
}
```

### 6. Recent Commits (`recent-commits`)

Get recent commit history.

**URI Pattern:** `kodrdriv://recent-commits/{path}?count={n}`

**Parameters:**
- `path` - Absolute path to repository
- `count` (query param) - Number of commits to retrieve (default: 10)

**Example:**
```
kodrdriv://recent-commits//Users/dev/myproject?count=20
```

**Returns:**
```typescript
{
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
```

### 7. GitHub Issues (`issues`)

Access GitHub issues for a repository.

**URI Pattern:** `kodrdriv://issues/{owner}/{repo}?state={state}&milestone={id}`

**Parameters:**
- `owner` - Repository owner
- `repo` - Repository name
- `state` (query param) - Filter by state: open, closed
- `milestone` (query param) - Filter by milestone ID

**Example:**
```
kodrdriv://issues/grunnverk/kodrdriv?state=open&milestone=1
```

**Returns:**
```typescript
{
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
```

### 8. Release Notes (`release-notes`)

Get release notes for a specific version.

**URI Pattern:** `kodrdriv://release-notes/{owner}/{repo}/{version}`

**Parameters:**
- `owner` - Repository owner
- `repo` - Repository name
- `version` - Release version

**Example:**
```
kodrdriv://release-notes/grunnverk/kodrdriv/1.0.0
```

**Returns:**
```typescript
{
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
```

## Usage with Cursor

Resources can be accessed in Cursor using natural language:
- "Show me the kodrdriv configuration for this repo"
- "What's the status of this repository?"
- "Show me recent commits"
- "Get the dependency graph for this monorepo"

## Resource Discovery

List all available resources:
```
MCP tools/list → resources
```

Each resource includes:
- `uri` - The resource URI
- `name` - Human-readable name
- `description` - What the resource provides
- `mimeType` - Content type (usually application/json)
