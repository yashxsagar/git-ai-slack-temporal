/**
 * GitHub API Type Definitions
 */

export interface GitHubWebhookPayload {
  action: string;
  pull_request: PullRequest;
  repository: Repository;
  sender: User;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: User;
  head: Branch;
  base: Branch;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft: boolean;
}

export interface Branch {
  ref: string;
  sha: string;
  repo: Repository;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: User;
  html_url: string;
  description: string | null;
  private: boolean;
}

export interface User {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
  author: User | null;
}

export interface PRDetails {
  number: number;
  title: string;
  body: string | null;
  author: string;
  url: string;
  baseBranch: string;
  headBranch: string;
  repository: string;
  repositoryOwner: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}
