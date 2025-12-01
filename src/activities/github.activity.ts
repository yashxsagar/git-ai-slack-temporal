/**
 * GitHub Activities
 *
 * These activities interact with the GitHub API to fetch PR details and commit history.
 * All external API calls must be in Activities (not Workflows) per Temporal best practices.
 */

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import logger from '../config/logger';
import { GITHUB_CONFIG } from '../config/constants';
import { PRDetails, CommitInfo } from '../types';

dotenv.config();

// Initialize Octokit client
function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  return new Octokit({
    auth: token,
    userAgent: GITHUB_CONFIG.userAgent,
  });
}

/**
 * Activity: Fetch Pull Request Details
 */
export async function fetchPRDetails(
  owner: string,
  repo: string,
  prNumber: number
): Promise<PRDetails> {
  const octokit = getOctokit();

  logger.info('Fetching PR details', { owner, repo, prNumber });

  try {
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    const prDetails: PRDetails = {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      author: pr.user?.login || 'unknown',
      url: pr.html_url,
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      repository: `${owner}/${repo}`,
      repositoryOwner: owner,
    };

    logger.info('Successfully fetched PR details', {
      prNumber,
      title: prDetails.title,
      author: prDetails.author,
    });

    return prDetails;
  } catch (error) {
    logger.error('Failed to fetch PR details', {
      owner,
      repo,
      prNumber,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Activity: Fetch Commit History for a PR
 */
export async function fetchCommitHistory(
  owner: string,
  repo: string,
  prNumber: number
): Promise<CommitInfo[]> {
  const octokit = getOctokit();

  logger.info('Fetching commit history', { owner, repo, prNumber });

  try {
    const { data: commits } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: prNumber,
      per_page: GITHUB_CONFIG.perPage,
    });

    const commitInfo: CommitInfo[] = commits.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name || 'unknown',
      date: commit.commit.author?.date || new Date().toISOString(),
      url: commit.html_url,
    }));

    logger.info('Successfully fetched commit history', {
      prNumber,
      commitCount: commitInfo.length,
    });

    return commitInfo;
  } catch (error) {
    logger.error('Failed to fetch commit history', {
      owner,
      repo,
      prNumber,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Activity: Fetch repository owner details for Slack notification
 */
export async function fetchRepositoryOwner(
  owner: string,
  repo: string
): Promise<{ login: string; email: string | null }> {
  const octokit = getOctokit();

  logger.info('Fetching repository owner details', { owner, repo });

  try {
    const { data: user } = await octokit.users.getByUsername({
      username: owner,
    });

    const ownerDetails = {
      login: user.login,
      email: user.email,
    };

    logger.info('Successfully fetched repository owner', { owner: ownerDetails.login });

    return ownerDetails;
  } catch (error) {
    logger.error('Failed to fetch repository owner', {
      owner,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
