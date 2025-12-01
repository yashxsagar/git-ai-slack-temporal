/**
 * Express Webhook Server
 *
 * Receives GitHub webhook events and triggers Temporal workflows.
 */

import express, { Express } from 'express';
import dotenv from 'dotenv';
import logger from '../config/logger';
import { WEBHOOK_CONFIG } from '../config/constants';
import { verifyGitHubSignature } from './middleware/verify-signature';
import { handleGitHubPRWebhook, handleHealthCheck } from './handlers/github.handler';

dotenv.config();

const app: Express = express();

// Middleware to preserve raw body for signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Routes
app.get('/health', handleHealthCheck);

app.post(
  '/webhooks/github',
  verifyGitHubSignature,
  handleGitHubPRWebhook
);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error in webhook server', {
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
function startServer(): void {
  app.listen(WEBHOOK_CONFIG.port, WEBHOOK_CONFIG.host, () => {
    logger.info('Webhook server started', {
      host: WEBHOOK_CONFIG.host,
      port: WEBHOOK_CONFIG.port,
      endpoint: `http://${WEBHOOK_CONFIG.host}:${WEBHOOK_CONFIG.port}/webhooks/github`,
    });

    logger.info('Server ready to receive GitHub webhooks');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { app, startServer };
