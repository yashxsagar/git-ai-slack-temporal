/**
 * Workflow-safe constants
 *
 * This file contains constants that can be safely imported in workflow code.
 * NO imports of Node.js built-in modules or dotenv allowed!
 */

export const RETRY_POLICY = {
  initialInterval: '1s' as const,
  maximumInterval: '30s' as const,
  backoffCoefficient: 2,
  maximumAttempts: 5,
} as const;

export const SLACK_CONFIG = {
  // Default channel - will be overridden by workflow input if provided
  defaultChannel: process.env.SLACK_CHANNEL_ID || 'C01234567',
} as const;
