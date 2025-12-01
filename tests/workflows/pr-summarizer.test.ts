/**
 * Unit Tests for PR Summarizer Workflow
 *
 * Uses Temporal's testing framework to test workflows with mocked activities.
 */

import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { prSummarizerWorkflow } from '../../src/workflows/pr-summarizer.workflow';
import { PRSummarizerInput, PRDetails, CommitInfo } from '../../src/types';
import * as activities from '../../src/activities';

describe('PR Summarizer Workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  }, 30000); // 30 second timeout for environment setup

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('should successfully process a PR and send Slack notification', async () => {
    // Mock data
    const mockPRDetails: PRDetails = {
      number: 123,
      title: 'Add new feature',
      body: 'This PR adds a new feature',
      author: 'testuser',
      url: 'https://github.com/test/repo/pull/123',
      baseBranch: 'main',
      headBranch: 'feature/new-feature',
      repository: 'test/repo',
      repositoryOwner: 'test',
    };

    const mockCommits: CommitInfo[] = [
      {
        sha: 'abc123',
        message: 'feat: add new feature',
        author: 'testuser',
        date: '2024-01-01T00:00:00Z',
        url: 'https://github.com/test/repo/commit/abc123',
      },
      {
        sha: 'def456',
        message: 'fix: fix bug',
        author: 'testuser',
        date: '2024-01-02T00:00:00Z',
        url: 'https://github.com/test/repo/commit/def456',
      },
    ];

    const mockSummary = 'This PR adds a new feature and fixes a bug.';
    const mockSlackTs = '1234567890.123456';

    // Create worker with mocked activities
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-queue',
      workflowsPath: require.resolve('../../src/workflows'),
      activities: {
        fetchPRDetails: async () => mockPRDetails,
        fetchCommitHistory: async () => mockCommits,
        summarizeChanges: async () => ({
          summary: mockSummary,
          model: 'gpt-4-turbo-preview',
          tokensUsed: 100,
        }),
        sendPRSummaryToSlack: async () => mockSlackTs,
      },
    });

    // Start the worker
    await worker.runUntil(async () => {
      // Input
      const input: PRSummarizerInput = {
        repository: 'repo',
        repositoryOwner: 'test',
        prNumber: 123,
      };

      // Execute workflow in test environment
      const result = await testEnv.client.workflow.execute(prSummarizerWorkflow, {
        taskQueue: 'test-queue',
        workflowId: 'test-workflow-1',
        args: [input],
      });

      // Assertions
      expect(result.success).toBe(true);
      expect(result.prDetails.number).toBe(123);
      expect(result.prDetails.title).toBe('Add new feature');
      expect(result.summary).toBe(mockSummary);
      expect(result.slackMessageTs).toBe(mockSlackTs);
      expect(result.error).toBeUndefined();
    });
  }, 15000); // 15 second timeout

  it('should handle workflow failure gracefully', async () => {
    // Create worker with failing activity
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-queue-fail',
      workflowsPath: require.resolve('../../src/workflows'),
      activities: {
        fetchPRDetails: async () => {
          throw new Error('GitHub API error');
        },
        fetchCommitHistory: async () => [],
        summarizeChanges: async () => ({
          summary: '',
          model: 'gpt-4',
          tokensUsed: 0,
        }),
        sendPRSummaryToSlack: async () => '',
      },
    });

    // Start the worker
    await worker.runUntil(async () => {
      const input: PRSummarizerInput = {
        repository: 'repo',
        repositoryOwner: 'test',
        prNumber: 999,
      };

      const result = await testEnv.client.workflow.execute(prSummarizerWorkflow, {
        taskQueue: 'test-queue-fail',
        workflowId: 'test-workflow-fail',
        args: [input],
      });

      // Should return failure result
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Activity task failed');
    });
  }, 30000); // 30 second timeout - needs more time for retries

  it('should use custom Slack channel when provided', async () => {
    let capturedChannel: string = '';

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-queue-channel',
      workflowsPath: require.resolve('../../src/workflows'),
      activities: {
        fetchPRDetails: async () => ({
          number: 1,
          title: 'Test',
          body: null,
          author: 'test',
          url: 'https://test.com',
          baseBranch: 'main',
          headBranch: 'test',
          repository: 'test/repo',
          repositoryOwner: 'test',
        }),
        fetchCommitHistory: async () => [],
        summarizeChanges: async () => ({
          summary: 'Test summary',
          model: 'gpt-4',
          tokensUsed: 10,
        }),
        sendPRSummaryToSlack: async (message: any, channel: string) => {
          capturedChannel = channel;
          return 'ts123';
        },
      },
    });

    // Start the worker
    await worker.runUntil(async () => {
      const input: PRSummarizerInput = {
        repository: 'repo',
        repositoryOwner: 'test',
        prNumber: 1,
        slackChannel: 'C_CUSTOM_CHANNEL',
      };

      await testEnv.client.workflow.execute(prSummarizerWorkflow, {
        taskQueue: 'test-queue-channel',
        workflowId: 'test-workflow-channel',
        args: [input],
      });

      expect(capturedChannel).toBe('C_CUSTOM_CHANNEL');
    });
  }, 15000); // 15 second timeout
});
