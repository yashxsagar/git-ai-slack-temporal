/**
 * PR Summarizer Workflow
 *
 * This workflow orchestrates the entire process of:
 * 1. Fetching PR details from GitHub
 * 2. Fetching commit history
 * 3. Summarizing changes with GPT-4
 * 4. Sending notification to Slack
 *
 * Workflows must be deterministic - all external I/O happens in Activities.
 */

import { proxyActivities, log } from '@temporalio/workflow';
import type * as activities from '../activities';
import { PRSummarizerInput, PRSummarizerOutput } from '../types';
import { SLACK_CONFIG } from '../config/workflow-constants';
// import { Duration } from '@temporalio/common';

// Create activity proxies with retry policies and timeouts
const { fetchPRDetails, fetchCommitHistory, summarizeChanges, sendPRSummaryToSlack } =
  proxyActivities<typeof activities>({
    retry: {
      initialInterval: '1s',
      maximumInterval: '30s',
      backoffCoefficient: 2,
      maximumAttempts: 5,
    },
    startToCloseTimeout: '2m', // Overall timeout for any single activity
  });

/**
 * Main PR Summarizer Workflow
 */
export async function prSummarizerWorkflow(input: PRSummarizerInput): Promise<PRSummarizerOutput> {
  const { repository, repositoryOwner, prNumber, slackChannel } = input;

  log.info('Starting PR Summarizer Workflow', {
    repository,
    prNumber,
    slackChannel,
  });

  try {
    // Step 1: Fetch PR details from GitHub
    log.info('Step 1: Fetching PR details', { repository, prNumber });
    const prDetails = await fetchPRDetails(repositoryOwner, repository, prNumber);

    log.info('PR details fetched successfully', {
      prTitle: prDetails.title,
      author: prDetails.author,
    });

    // Step 2: Fetch commit history
    log.info('Step 2: Fetching commit history', { prNumber });
    const commits = await fetchCommitHistory(repositoryOwner, repository, prNumber);

    log.info('Commit history fetched successfully', {
      commitCount: commits.length,
    });

    // Step 3: Summarize changes using GPT-4
    log.info('Step 3: Summarizing changes with GPT-4', { prNumber });
    const summarization = await summarizeChanges({
      prDetails,
      commits,
    });

    log.info('PR summary generated successfully', {
      summaryLength: summarization.summary.length,
      tokensUsed: summarization.tokensUsed,
    });

    // Step 4: Send summary to Slack
    const targetChannel = slackChannel || SLACK_CONFIG.defaultChannel;
    log.info('Step 4: Sending summary to Slack', {
      channel: targetChannel,
      prNumber,
    });

    const slackMessageTs = await sendPRSummaryToSlack(
      {
        prNumber: prDetails.number,
        prTitle: prDetails.title,
        prUrl: prDetails.url,
        author: prDetails.author,
        repository: prDetails.repository,
        baseBranch: prDetails.baseBranch,
        headBranch: prDetails.headBranch,
        summary: summarization.summary,
        commitCount: commits.length,
      },
      targetChannel
    );

    log.info('Workflow completed successfully', {
      prNumber,
      slackMessageTs,
    });

    return {
      success: true,
      prDetails,
      summary: summarization.summary,
      slackMessageTs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    log.error('Workflow failed', {
      repository,
      prNumber,
      error: errorMessage,
    });

    // Return failure result (don't throw - let caller handle)
    return {
      success: false,
      prDetails: {
        number: prNumber,
        title: 'Failed to fetch',
        body: null,
        author: 'unknown',
        url: '',
        baseBranch: '',
        headBranch: '',
        repository: `${repositoryOwner}/${repository}`,
        repositoryOwner,
      },
      summary: '',
      slackMessageTs: '',
      error: errorMessage,
    };
  }
}
