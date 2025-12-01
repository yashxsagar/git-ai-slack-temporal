/**
 * Idempotency utilities for workflow execution
 */

import { nanoid } from 'nanoid';

/**
 * Generate a deterministic workflow ID for a GitHub PR event
 * This ensures that the same PR event doesn't trigger duplicate workflows
 */
export function generatePRWorkflowId(
  repository: string,
  prNumber: number,
  action: string = 'opened'
): string {
  // Format: pr-{owner-repo}-{prNumber}-{action}
  const sanitizedRepo = repository.replace(/[^a-zA-Z0-9-]/g, '-');
  return `pr-${sanitizedRepo}-${prNumber}-${action}`;
}

/**
 * Generate a unique workflow ID with a random component
 */
export function generateUniqueWorkflowId(prefix: string = 'workflow'): string {
  const timestamp = Date.now();
  const randomId = nanoid(8);
  return `${prefix}-${timestamp}-${randomId}`;
}

/**
 * Validate workflow ID format
 */
export function isValidWorkflowId(workflowId: string): boolean {
  // Workflow IDs must be non-empty strings
  // Temporal recommends IDs be between 1 and 255 characters
  return workflowId.length > 0 && workflowId.length <= 255;
}
