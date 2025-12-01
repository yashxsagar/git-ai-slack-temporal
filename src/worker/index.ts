/**
 * Temporal Worker
 *
 * The Worker polls the Task Queue and executes Workflows and Activities.
 * This connects to Temporal Cloud using the credentials from .env
 */

import { Worker, Runtime } from '@temporalio/worker';
import { createWorkerConnection } from '../config/temporal.config';
import { TASK_QUEUE_NAME } from '../config/constants';
import * as activities from '../activities';
import logger from '../config/logger';
import path from 'path';

/**
 * Create and run the Temporal Worker
 */
async function runWorker(): Promise<void> {
  logger.info('Starting Temporal Worker...');

  try {
    // Configure Temporal Runtime (optional - for advanced settings)
    Runtime.install({
      logger: {
        log: (level, message, meta) => {
          const logFn = logger[level as keyof typeof logger] || logger.info;
          if (typeof logFn === 'function') {
            logFn(message, meta);
          }
        },
      },
    });

    // Create Temporal Cloud connection
    const connection = await createWorkerConnection();

    // Resolve workflows path
    const workflowsPath = path.join(__dirname, '../workflows');

    logger.info('Creating worker', {
      taskQueue: TASK_QUEUE_NAME,
      workflowsPath,
    });

    // Create Worker
    const worker = await Worker.create({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE!,
      taskQueue: TASK_QUEUE_NAME,
      workflowsPath,
      activities,
      // Worker options
      maxConcurrentActivityTaskExecutions: 10,
      maxConcurrentWorkflowTaskExecutions: 10,
      // Enable logging
      enableNonLocalActivities: true,
    });

    logger.info('Worker created successfully', {
      identity: worker.options.identity,
      taskQueue: TASK_QUEUE_NAME,
    });

    // Run the worker
    logger.info('Worker starting to poll for tasks...');
    await worker.run();

    logger.warn('Worker stopped');
  } catch (error) {
    logger.error('Fatal error in worker', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
let isShuttingDown = false;

async function shutdown(): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info('Shutting down worker gracefully...');

  // Give running activities time to complete
  setTimeout(() => {
    logger.info('Worker shutdown complete');
    process.exit(0);
  }, 5000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    promise,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start the worker
if (require.main === module) {
  logger.info('Worker process starting...');
  runWorker().catch((error) => {
    logger.error('Failed to start worker', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}

export { runWorker };
