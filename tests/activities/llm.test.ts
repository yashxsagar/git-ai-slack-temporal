/**
 * Unit Tests for LLM Activities
 */

import { summarizeChanges } from '../../src/activities/llm.activity';
import { SummarizationInput } from '../../src/types';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'This PR adds a new authentication feature.',
                },
              },
            ],
            usage: {
              total_tokens: 150,
            },
          }),
        },
      },
    })),
  };
});

describe('LLM Activities', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  describe('summarizeChanges', () => {
    it('should generate a summary successfully', async () => {
      const input: SummarizationInput = {
        prDetails: {
          number: 123,
          title: 'Add authentication',
          body: 'This PR adds user authentication',
          author: 'testuser',
          url: 'https://github.com/test/repo/pull/123',
          baseBranch: 'main',
          headBranch: 'feature/auth',
          repository: 'test/repo',
          repositoryOwner: 'test',
        },
        commits: [
          {
            sha: 'abc123',
            message: 'feat: add login endpoint',
            author: 'testuser',
            date: '2024-01-01T00:00:00Z',
            url: 'https://github.com/test/repo/commit/abc123',
          },
        ],
      };

      const result = await summarizeChanges(input);

      expect(result.summary).toBe('This PR adds a new authentication feature.');
      expect(result.model).toBe('gpt-4-turbo-preview');
      expect(result.tokensUsed).toBe(150);
    });

    it('should handle empty commits', async () => {
      const input: SummarizationInput = {
        prDetails: {
          number: 456,
          title: 'Empty PR',
          body: null,
          author: 'testuser',
          url: 'https://github.com/test/repo/pull/456',
          baseBranch: 'main',
          headBranch: 'test',
          repository: 'test/repo',
          repositoryOwner: 'test',
        },
        commits: [],
      };

      const result = await summarizeChanges(input);

      expect(result.summary).toBeDefined();
      expect(result.model).toBe('gpt-4-turbo-preview');
    });
  });
});
