/**
 * Workflow-safe constants
 *
 * This file contains constants that can be safely imported in workflow code.
 * NO imports of Node.js built-in modules or dotenv allowed!
 */

export const RETRY_POLICY = {
  initialInterval: '1s',
  maximumInterval: '30s',
  backoffCoefficient: 2,
  maximumAttempts: 5,
};

export const SLACK_CONFIG = {
  // Default channel - will be overridden by workflow input if provided
  // Note: This is a fallback. The webhook handler should pass the real channel ID.
  defaultChannel: 'C0A1N53T9UG', // Updated to match .env default
};
