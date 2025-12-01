/**
 * Unit Tests for GitHub Activities
 */

import { fetchPRDetails, fetchCommitHistory } from '../../src/activities/github.activity';

// Mock Octokit
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      pulls: {
        get: jest.fn().mockResolvedValue({
          data: {
            number: 123,
            title: 'Test PR',
            body: 'Test description',
            user: { login: 'testuser' },
            html_url: 'https://github.com/test/repo/pull/123',
            base: { ref: 'main' },
            head: { ref: 'feature-branch' },
          },
        }),
        listCommits: jest.fn().mockResolvedValue({
          data: [
            {
              sha: 'abc123',
              commit: {
                message: 'feat: add feature',
                author: {
                  name: 'Test User',
                  date: '2024-01-01T00:00:00Z',
                },
              },
              html_url: 'https://github.com/test/repo/commit/abc123',
            },
          ],
        }),
      },
      users: {
        getByUsername: jest.fn().mockResolvedValue({
          data: {
            login: 'testuser',
            email: 'test@example.com',
          },
        }),
      },
    })),
  };
});

describe('GitHub Activities', () => {
  beforeEach(() => {
    // Set required env vars
    process.env.GITHUB_TOKEN = 'test-token';
  });

  describe('fetchPRDetails', () => {
    it('should fetch PR details successfully', async () => {
      const result = await fetchPRDetails('test', 'repo', 123);

      expect(result).toMatchObject({
        number: 123,
        title: 'Test PR',
        body: 'Test description',
        author: 'testuser',
        url: 'https://github.com/test/repo/pull/123',
        baseBranch: 'main',
        headBranch: 'feature-branch',
        repository: 'test/repo',
        repositoryOwner: 'test',
      });
    });
  });

  describe('fetchCommitHistory', () => {
    it('should fetch commit history successfully', async () => {
      const result = await fetchCommitHistory('test', 'repo', 123);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        sha: 'abc123',
        message: 'feat: add feature',
        author: 'Test User',
        date: '2024-01-01T00:00:00Z',
        url: 'https://github.com/test/repo/commit/abc123',
      });
    });
  });
});
