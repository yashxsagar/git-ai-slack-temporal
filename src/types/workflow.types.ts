/**
 * Workflow Type Definitions
 */

import { PRDetails, CommitInfo } from './github.types';

/**
 * Input for PR Summarizer Workflow
 */
export interface PRSummarizerInput {
  repository: string;
  repositoryOwner: string;
  prNumber: number;
  slackChannel?: string; // Optional: override default Slack channel
}

/**
 * Output from PR Summarizer Workflow
 */
export interface PRSummarizerOutput {
  success: boolean;
  prDetails: PRDetails;
  summary: string;
  slackMessageTs: string;
  error?: string;
}

/**
 * Input for LLM Summarization Activity
 */
export interface SummarizationInput {
  prDetails: PRDetails;
  commits: CommitInfo[];
}

/**
 * Output from LLM Summarization Activity
 */
export interface SummarizationOutput {
  summary: string;
  model: string;
  tokensUsed?: number;
}

/**
 * Workflow execution metadata
 */
export interface WorkflowMetadata {
  workflowId: string;
  runId: string;
  timestamp: string;
}
