/**
 * Application Constants
 */

import dotenv from 'dotenv';
dotenv.config();

export const TASK_QUEUE_NAME = process.env.TASK_QUEUE_NAME || 'pr-summarizer-queue';

export const RETRY_POLICY = {
  initialInterval: '1s' as const,
  maximumInterval: '30s' as const,
  backoffCoefficient: 2,
  maximumAttempts: 5,
} as const;

export const ACTIVITY_TIMEOUT = {
  github: '30s',
  llm: '60s',
  slack: '20s',
};

export const WORKFLOW_EXECUTION_TIMEOUT = '10m';
export const WORKFLOW_TASK_TIMEOUT = '10s';

export const OPENAI_CONFIG = {
  model: 'gpt-4-turbo-preview',
  maxTokens: 1000,
  temperature: 0.3,
};

export const GITHUB_CONFIG = {
  userAgent: 'temporal-vibe-automator-poc',
  perPage: 100, // Max commits to fetch
};

export const SLACK_CONFIG = {
  defaultChannel: process.env.SLACK_CHANNEL_ID || 'C01234567',
};

export const WEBHOOK_CONFIG = {
  port: parseInt(process.env.WEBHOOK_PORT || '3000', 10),
  host: process.env.WEBHOOK_HOST || '0.0.0.0',
};
