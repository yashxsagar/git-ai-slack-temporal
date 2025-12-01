/**
 * Slack API Type Definitions
 */

export interface SlackMessageInput {
  channel: string;
  text?: string;
  blocks?: SlackBlock[];
  threadTs?: string;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text?: string;
    url?: string;
  }>;
  fields?: Array<{
    type: string;
    text: string;
  }>;
}

export interface SlackMessageResponse {
  ok: boolean;
  channel: string;
  ts: string;
  message: {
    text: string;
    user: string;
    ts: string;
  };
}

export interface PRSummarySlackMessage {
  prNumber: number;
  prTitle: string;
  prUrl: string;
  author: string;
  repository: string;
  baseBranch: string;
  headBranch: string;
  summary: string;
  commitCount: number;
}
