/**
 * Temporal Cloud Configuration
 */

import { NativeConnection } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

export interface TemporalConfig {
  address: string;
  namespace: string;
  apiKey: string;
}

export function getTemporalConfig(): TemporalConfig {
  const address = process.env.TEMPORAL_ADDRESS;
  const namespace = process.env.TEMPORAL_NAMESPACE;
  const apiKey = process.env.TEMPORAL_API_KEY;

  if (!address || !namespace || !apiKey) {
    throw new Error(
      'Missing required Temporal configuration. Please check your .env file for TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, and TEMPORAL_API_KEY'
    );
  }

  return { address, namespace, apiKey };
}

/**
 * Create Temporal Cloud connection for Workers
 */
export async function createWorkerConnection(): Promise<NativeConnection> {
  const config = getTemporalConfig();

  logger.info('Connecting to Temporal Cloud (Worker)', {
    address: config.address,
    namespace: config.namespace,
  });

  try {
    const connection = await NativeConnection.connect({
      address: config.address,
      tls: true,
      apiKey: config.apiKey,
    });

    logger.info('Successfully connected to Temporal Cloud (Worker)');
    return connection;
  } catch (error) {
    logger.error('Failed to connect to Temporal Cloud (Worker)', { error });
    throw error;
  }
}

/**
 * Create Temporal Cloud connection for Clients
 */
export async function createClientConnection(): Promise<Connection> {
  const config = getTemporalConfig();

  logger.info('Connecting to Temporal Cloud (Client)', {
    address: config.address,
    namespace: config.namespace,
  });

  try {
    const connection = await Connection.connect({
      address: config.address,
      tls: true,
      apiKey: config.apiKey,
    });

    logger.info('Successfully connected to Temporal Cloud (Client)');
    return connection;
  } catch (error) {
    logger.error('Failed to connect to Temporal Cloud (Client)', { error });
    throw error;
  }
}
