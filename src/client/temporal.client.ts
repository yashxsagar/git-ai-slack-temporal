/**
 * Temporal Client
 *
 * This client is used to start workflows from external triggers (webhook server).
 */

import { Client, WorkflowHandle } from '@temporalio/client';
import { createClientConnection, getTemporalConfig } from '../config/temporal.config';
import { TASK_QUEUE_NAME, WORKFLOW_EXECUTION_TIMEOUT } from '../config/constants';
import { prSummarizerWorkflow } from '../workflows';
import { PRSummarizerInput, PRSummarizerOutput } from '../types';
import logger from '../config/logger';

let clientInstance: Client | null = null;

/**
 * Get or create Temporal client (singleton)
 */
export async function getTemporalClient(): Promise<Client> {
  if (clientInstance) {
    return clientInstance;
  }

  const connection = await createClientConnection();
  const config = getTemporalConfig();

  clientInstance = new Client({
    connection,
    namespace: config.namespace,
  });

  logger.info('Temporal client initialized');

  return clientInstance;
}

/**
 * Start PR Summarizer Workflow
 */
export async function startPRSummarizerWorkflow(
  input: PRSummarizerInput,
  workflowId: string
): Promise<WorkflowHandle<typeof prSummarizerWorkflow>> {
  const client = await getTemporalClient();

  logger.info('Starting PR Summarizer Workflow', {
    workflowId,
    repository: input.repository,
    prNumber: input.prNumber,
  });

  try {
    const handle = await client.workflow.start(prSummarizerWorkflow, {
      taskQueue: TASK_QUEUE_NAME,
      args: [input],
      workflowId,
      workflowExecutionTimeout: WORKFLOW_EXECUTION_TIMEOUT,
      // Workflow ID reuse policy: reject duplicate workflows
      workflowIdReusePolicy: 'WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE',
    });

    logger.info('Workflow started successfully', {
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
    });

    return handle;
  } catch (error) {
    logger.error('Failed to start workflow', {
      workflowId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get workflow result (blocking)
 */
export async function getWorkflowResult(
  workflowId: string
): Promise<PRSummarizerOutput> {
  const client = await getTemporalClient();

  logger.info('Getting workflow result', { workflowId });

  try {
    const handle = client.workflow.getHandle(workflowId);
    const result = await handle.result();

    logger.info('Workflow result retrieved', { workflowId, success: result.success });

    return result;
  } catch (error) {
    logger.error('Failed to get workflow result', {
      workflowId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Query workflow status (non-blocking)
 */
export async function describeWorkflow(workflowId: string) {
  const client = await getTemporalClient();

  try {
    const handle = client.workflow.getHandle(workflowId);
    const description = await handle.describe();

    return description;
  } catch (error) {
    logger.error('Failed to describe workflow', {
      workflowId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
