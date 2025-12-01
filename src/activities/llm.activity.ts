/**
 * LLM Activities
 *
 * These activities use OpenAI's GPT-4 to summarize PR changes.
 * All non-deterministic operations (like LLM calls) must be in Activities.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import logger from '../config/logger';
import { OPENAI_CONFIG } from '../config/constants';
import { SummarizationInput, SummarizationOutput } from '../types';

dotenv.config();

// Initialize OpenAI client
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return new OpenAI({ apiKey });
}

/**
 * Activity: Summarize PR changes using GPT-4
 */
export async function summarizeChanges(
  input: SummarizationInput
): Promise<SummarizationOutput> {
  const openai = getOpenAI();
  const { prDetails, commits } = input;

  logger.info('Summarizing PR changes', {
    prNumber: prDetails.number,
    commitCount: commits.length,
  });

  try {
    // Build the prompt for GPT-4
    const commitMessages = commits
      .map((commit, idx) => `${idx + 1}. ${commit.message} (by ${commit.author})`)
      .join('\n');

    const prompt = `You are a technical summarizer for GitHub pull requests.

**Pull Request Information:**
- Repository: ${prDetails.repository}
- PR #${prDetails.number}: ${prDetails.title}
- Author: ${prDetails.author}
- Base Branch: ${prDetails.baseBranch} ← Head Branch: ${prDetails.headBranch}
- Description: ${prDetails.body || 'No description provided'}

**Commits (${commits.length} total):**
${commitMessages}

**Task:**
Provide a clear, concise summary of this PR for the repository owner. Focus on:
1. What changes were made (high-level overview)
2. Why these changes matter (business/technical value)
3. Any potential concerns or notable aspects

Keep the summary professional, actionable, and under 200 words.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes GitHub pull requests clearly and concisely.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: OPENAI_CONFIG.maxTokens,
      temperature: OPENAI_CONFIG.temperature,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || 'No summary generated';
    const tokensUsed = completion.usage?.total_tokens;

    logger.info('Successfully generated PR summary', {
      prNumber: prDetails.number,
      tokensUsed,
      summaryLength: summary.length,
    });

    return {
      summary,
      model: OPENAI_CONFIG.model,
      tokensUsed,
    };
  } catch (error) {
    logger.error('Failed to summarize PR changes', {
      prNumber: prDetails.number,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
