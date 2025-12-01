/**
 * GitHub Webhook Signature Verification Middleware
 *
 * Verifies that incoming webhooks are genuinely from GitHub by checking
 * the X-Hub-Signature-256 header against our webhook secret.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../../config/logger';

/**
 * Verify GitHub webhook signature
 */
export function verifyGitHubSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const signature = req.headers['x-hub-signature-256'] as string;
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // Skip verification in development if no secret is set
  if (!secret) {
    logger.warn('GITHUB_WEBHOOK_SECRET not set - skipping signature verification');
    return next();
  }

  if (!signature) {
    logger.error('No signature provided in webhook request');
    res.status(401).json({ error: 'No signature provided' });
    return;
  }

  try {
    // Get raw body (must be preserved by body parser)
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Calculate expected signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    // Compare signatures (timing-safe comparison)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      logger.error('Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    logger.debug('Webhook signature verified successfully');
    next();
  } catch (error) {
    logger.error('Error verifying webhook signature', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Signature verification failed' });
  }
}
