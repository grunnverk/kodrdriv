import { describe, it, expect } from 'vitest';
import {
    parseKodrdrivUri,
    buildKodrdrivUri,
    buildConfigUri,
    buildStatusUri,
    buildTreeGraphUri,
    buildPackageUri,
    buildRecentCommitsUri,
    buildIssuesUri,
    buildReleaseNotesUri,
    buildWorkspaceUri,
    UriParseError,
} from '../../src/mcp/uri.js';

describe('URI Parser', () => {
    describe('parseKodrdrivUri', () => {
        it('should parse config URI', () => {
            const uri = 'kodrdriv://config/Users/dev/project';
            const result = parseKodrdrivUri(uri);

            expect(result.scheme).toBe('kodrdriv');
            expect(result.type).toBe('config');
            expect(result.path).toBe('Users/dev/project');
        });

        it('should parse status URI', () => {
            const uri = 'kodrdriv://status/Users/dev/project';
            const result = parseKodrdrivUri(uri);

            expect(result.type).toBe('status');
            expect(result.path).toBe('Users/dev/project');
        });

        it('should parse URI with query parameters', () => {
            const uri = 'kodrdriv://recent-commits/Users/dev/project?count=10';
            const result = parseKodrdrivUri(uri);

            expect(result.type).toBe('recent-commits');
            expect(result.path).toBe('Users/dev/project');
            expect(result.query).toEqual({ count: '10' });
        });

        it('should parse URI with multiple query parameters', () => {
            const uri = 'kodrdriv://issues/owner/repo?state=closed&milestone=1';
            const result = parseKodrdrivUri(uri);

            expect(result.type).toBe('issues');
            expect(result.path).toBe('owner/repo');
            expect(result.query).toEqual({ state: 'closed', milestone: '1' });
        });

        it('should parse URI without path', () => {
            const uri = 'kodrdriv://workspace';
            const result = parseKodrdrivUri(uri);

            expect(result.type).toBe('workspace');
            expect(result.path).toBeUndefined();
        });

        it('should parse package URI with scope', () => {
            const uri = 'kodrdriv://package/@eldrforge/kodrdriv';
            const result = parseKodrdrivUri(uri);

            expect(result.type).toBe('package');
            expect(result.path).toBe('@eldrforge/kodrdriv');
        });

        it('should parse tree-graph URI', () => {
            const uri = 'kodrdriv://tree-graph/Users/dev/monorepo';
            const result = parseKodrdrivUri(uri);

            expect(result.type).toBe('tree-graph');
            expect(result.path).toBe('Users/dev/monorepo');
        });

        it('should parse release-notes URI', () => {
            const uri = 'kodrdriv://release-notes/owner/repo/1.0.0';
            const result = parseKodrdrivUri(uri);

            expect(result.type).toBe('release-notes');
            expect(result.path).toBe('owner/repo/1.0.0');
        });

        it('should throw on invalid scheme', () => {
            expect(() => parseKodrdrivUri('http://config/path'))
                .toThrow(UriParseError);
            expect(() => parseKodrdrivUri('http://config/path'))
                .toThrow('URI must start with kodrdriv:');
        });

        it('should throw on missing scheme', () => {
            expect(() => parseKodrdrivUri('config/path'))
                .toThrow(UriParseError);
        });

        it('should throw on invalid format', () => {
            expect(() => parseKodrdrivUri('kodrdriv:invalid'))
                .toThrow(UriParseError);
            expect(() => parseKodrdrivUri('kodrdriv:invalid'))
                .toThrow('Invalid path format');
        });

        it('should throw on empty path after scheme', () => {
            expect(() => parseKodrdrivUri('kodrdriv://'))
                .toThrow(UriParseError);
        });
    });

    describe('buildKodrdrivUri', () => {
        it('should build URI with path', () => {
            const uri = buildKodrdrivUri('config', 'Users/dev/project');
            expect(uri).toBe('kodrdriv://config/Users/dev/project');
        });

        it('should build URI with query', () => {
            const uri = buildKodrdrivUri('recent-commits', 'path', { count: '10' });
            expect(uri).toContain('kodrdriv://recent-commits/path?');
            expect(uri).toContain('count=10');
        });

        it('should build URI without path', () => {
            const uri = buildKodrdrivUri('workspace');
            expect(uri).toBe('kodrdriv://workspace');
        });

        it('should build URI with multiple query parameters', () => {
            const uri = buildKodrdrivUri('issues', 'owner/repo', { state: 'closed', milestone: '1' });
            expect(uri).toContain('kodrdriv://issues/owner/repo?');
            expect(uri).toContain('state=closed');
            expect(uri).toContain('milestone=1');
        });

        it('should handle empty query object', () => {
            const uri = buildKodrdrivUri('config', 'path', {});
            expect(uri).toBe('kodrdriv://config/path');
        });
    });

    describe('convenience builders', () => {
        it('should build config URI', () => {
            const uri = buildConfigUri('/Users/dev/project');
            expect(uri).toBe('kodrdriv://config//Users/dev/project');
        });

        it('should build status URI', () => {
            const uri = buildStatusUri('/Users/dev/project');
            expect(uri).toBe('kodrdriv://status//Users/dev/project');
        });

        it('should build tree-graph URI', () => {
            const uri = buildTreeGraphUri('/Users/dev/monorepo');
            expect(uri).toBe('kodrdriv://tree-graph//Users/dev/monorepo');
        });

        it('should build package URI', () => {
            const uri = buildPackageUri('@eldrforge/kodrdriv');
            expect(uri).toBe('kodrdriv://package/@eldrforge/kodrdriv');
        });

        it('should build recent-commits URI without count', () => {
            const uri = buildRecentCommitsUri('/Users/dev/project');
            expect(uri).toBe('kodrdriv://recent-commits//Users/dev/project');
        });

        it('should build recent-commits URI with count', () => {
            const uri = buildRecentCommitsUri('/Users/dev/project', 10);
            expect(uri).toContain('kodrdriv://recent-commits//Users/dev/project?');
            expect(uri).toContain('count=10');
        });

        it('should build issues URI without filters', () => {
            const uri = buildIssuesUri('grunnverk', 'kodrdriv');
            expect(uri).toBe('kodrdriv://issues/grunnverk/kodrdriv');
        });

        it('should build issues URI with state filter', () => {
            const uri = buildIssuesUri('grunnverk', 'kodrdriv', 'closed');
            expect(uri).toContain('kodrdriv://issues/grunnverk/kodrdriv?');
            expect(uri).toContain('state=closed');
        });

        it('should build issues URI with all filters', () => {
            const uri = buildIssuesUri('grunnverk', 'kodrdriv', 'closed', '1');
            expect(uri).toContain('kodrdriv://issues/grunnverk/kodrdriv?');
            expect(uri).toContain('state=closed');
            expect(uri).toContain('milestone=1');
        });

        it('should build release notes URI', () => {
            const uri = buildReleaseNotesUri('grunnverk', 'kodrdriv', '1.0.0');
            expect(uri).toBe('kodrdriv://release-notes/grunnverk/kodrdriv/1.0.0');
        });

        it('should build workspace URI', () => {
            const uri = buildWorkspaceUri();
            expect(uri).toBe('kodrdriv://workspace');
        });
    });

    describe('roundtrip parsing', () => {
        it('should parse and build config URI', () => {
            const original = 'kodrdriv://config/Users/dev/project';
            const parsed = parseKodrdrivUri(original);
            const rebuilt = buildKodrdrivUri(parsed.type, parsed.path, parsed.query);
            expect(rebuilt).toBe(original);
        });

        it('should parse and build URI with query', () => {
            const built = buildRecentCommitsUri('/path', 10);
            const parsed = parseKodrdrivUri(built);
            expect(parsed.type).toBe('recent-commits');
            expect(parsed.path).toBe('/path');
            expect(parsed.query).toEqual({ count: '10' });
        });
    });
});
