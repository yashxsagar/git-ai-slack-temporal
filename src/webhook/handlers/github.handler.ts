/**
 * GitHub Webhook Handler
 *
 * Handles GitHub webhook events and starts Temporal workflows.
 */

import { Request, Response } from 'express';
import { GitHubWebhookPayload } from '../../types';
import { startPRSummarizerWorkflow } from '../../client/temporal.client';
import { generatePRWorkflowId } from '../../utils/idempotency';
import logger from '../../config/logger';

/**
 * Handle GitHub PR webhook events
 */
export async function handleGitHubPRWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const event = req.headers['x-github-event'] as string;
  const payload = req.body as GitHubWebhookPayload;

  logger.info('Received GitHub webhook', {
    event,
    action: payload.action,
    prNumber: payload.pull_request?.number,
  });

  // Only process PR opened/reopened/synchronize events
  if (event !== 'pull_request') {
    logger.info('Ignoring non-PR event', { event });
    res.status(200).json({ message: 'Event ignored' });
    return;
  }

  const validActions = ['opened', 'reopened', 'synchronize'];
  if (!validActions.includes(payload.action)) {
    logger.info('Ignoring PR action', { action: payload.action });
    res.status(200).json({ message: 'Action ignored' });
    return;
  }

  try {
    const { pull_request, repository } = payload;

    // Extract repository details
    const [owner, repo] = repository.full_name.split('/');

    // Generate deterministic workflow ID for idempotency
    const workflowId = generatePRWorkflowId(
      repository.full_name,
      pull_request.number,
      payload.action
    );

    logger.info('Starting workflow for PR', {
      workflowId,
      repository: repository.full_name,
      prNumber: pull_request.number,
      action: payload.action,
    });

    // Start Temporal workflow
    const handle = await startPRSummarizerWorkflow(
      {
        repository: repo,
        repositoryOwner: owner,
        prNumber: pull_request.number,
      },
      workflowId
    );

    logger.info('Workflow started successfully', {
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
    });

    // Respond immediately (workflow runs asynchronously)
    res.status(202).json({
      message: 'Workflow started',
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if it's a duplicate workflow error
    if (errorMessage.includes('ALREADY_EXISTS') || errorMessage.includes('duplicate')) {
      logger.info('Workflow already exists (idempotency)', {
        prNumber: payload.pull_request?.number,
      });
      res.status(200).json({ message: 'Workflow already running' });
      return;
    }

    logger.error('Failed to start workflow', {
      prNumber: payload.pull_request?.number,
      error: errorMessage,
    });

    res.status(500).json({
      error: 'Failed to start workflow',
      message: errorMessage,
    });
  }
}

/**
 * Health check endpoint
 */
export function handleHealthCheck(req: Request, res: Response): void {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'temporal-webhook-server',
  });
}
