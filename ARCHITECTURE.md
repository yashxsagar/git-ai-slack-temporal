# Temporal Vibe Automator - Architecture Documentation

## System Overview

This POC demonstrates a production-grade event-driven architecture using Temporal Cloud for workflow orchestration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GitHub Repository                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ PR Event (webhook)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ngrok (Local Dev)                           │
│                    https://abc123.ngrok.io                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Express Webhook Server                          │
│                                                                     │
│  ┌──────────────┐     ┌──────────────────┐    ┌───────────────┐  │
│  │   Verify     │────▶│  GitHub Handler  │───▶│ Temporal      │  │
│  │  Signature   │     │                  │    │ Client        │  │
│  └──────────────┘     └──────────────────┘    └───────┬───────┘  │
└────────────────────────────────────────────────────────┼───────────┘
                                                          │
                             ┌────────────────────────────┘
                             │ Start Workflow
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Temporal Cloud                               │
│                  (us-east-1.aws.api.temporal.io)                   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                     Workflow Engine                           │ │
│  │                                                               │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │        prSummarizerWorkflow                         │   │ │
│  │  │                                                      │   │ │
│  │  │  1. Fetch PR Details      (GitHub Activity)         │   │ │
│  │  │  2. Fetch Commit History  (GitHub Activity)         │   │ │
│  │  │  3. Summarize Changes     (LLM Activity)            │   │ │
│  │  │  4. Send Slack Message    (Slack Activity)          │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  │                                                               │ │
│  │  Task Queue: pr-summarizer-queue                             │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   Workflow History                            │ │
│  │  • State persistence                                          │ │
│  │  • Event replay capability                                    │ │
│  │  • Audit trail                                                │ │
│  └───────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Task assignment
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Temporal Worker                              │
│                      (Local/Container)                              │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐    │
│  │   GitHub     │    │     LLM      │    │     Slack        │    │
│  │  Activities  │    │  Activities  │    │   Activities     │    │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────────┘    │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │                  │                  │
          ▼                  ▼                  ▼
    ┌──────────┐      ┌────────────┐     ┌──────────┐
    │  GitHub  │      │   OpenAI   │     │  Slack   │
    │   API    │      │  GPT-4 API │     │   API    │
    └──────────┘      └────────────┘     └──────────┘
```

## Component Breakdown

### 1. Webhook Server (Express)

**Purpose:** Receive and validate GitHub webhook events, start Temporal workflows.

**Key Components:**
- **Signature Verification Middleware:** Validates HMAC SHA-256 signature
- **GitHub Handler:** Processes PR events, generates workflow IDs
- **Temporal Client:** Starts workflows asynchronously

**Technology:** Express.js, Node.js 18+

**Port:** 3000 (configurable)

### 2. Temporal Cloud

**Purpose:** Workflow orchestration, state management, and execution coordination.

**Key Features:**
- **Durable Execution:** Workflows survive crashes and restarts
- **Task Queues:** Distribute work across workers
- **Event History:** Complete audit trail of all workflow events
- **Retry Policies:** Automatic retry with exponential backoff
- **Idempotency:** Prevent duplicate workflows

**Connection:** mTLS with API key authentication

**Namespace:** `quickstart-zeak.q4oex`

### 3. Temporal Worker

**Purpose:** Execute workflows and activities by polling task queues.

**Responsibilities:**
- Poll Temporal Cloud for workflow tasks
- Execute workflow orchestration logic
- Execute activities (external API calls)
- Report results back to Temporal

**Scalability:** Can run multiple workers for horizontal scaling

### 4. Workflows

**prSummarizerWorkflow:**
- **Deterministic orchestration** of 4-step process
- **Sequential execution** with error handling
- **Activity proxies** with retry policies
- **Structured logging** for observability

**Constraints:**
- Must be deterministic (no direct I/O)
- No random number generation
- No Date.now() calls
- All external interaction via Activities

### 5. Activities

Activities encapsulate all non-deterministic operations:

#### GitHub Activities
- `fetchPRDetails`: Get PR metadata
- `fetchCommitHistory`: Retrieve commit list
- `fetchRepositoryOwner`: Get owner details

**Technology:** Octokit REST API

**Timeout:** 30 seconds

#### LLM Activities
- `summarizeChanges`: Generate PR summary using GPT-4

**Technology:** OpenAI API

**Model:** gpt-4-turbo-preview

**Timeout:** 60 seconds

**Prompt Engineering:**
- Context about PR and repository
- Commit messages with authors
- Structured output format

#### Slack Activities
- `sendPRSummaryToSlack`: Send rich message with blocks
- `sendSlackMessage`: Simple text message

**Technology:** Slack Web API

**Format:** Block Kit for rich formatting

**Timeout:** 20 seconds

## Data Flow

### 1. Webhook Reception

```typescript
GitHub → ngrok → Express → verifySignature() → handleGitHubPRWebhook()
```

**Validation:**
- Event type check (only `pull_request`)
- Action filter (`opened`, `reopened`, `synchronize`)
- Signature verification

### 2. Workflow Initiation

```typescript
generatePRWorkflowId() → startPRSummarizerWorkflow() → Temporal Cloud
```

**Workflow ID Format:** `pr-{owner-repo}-{prNumber}-{action}`

**Example:** `pr-vibe-automator-backend-123-opened`

### 3. Workflow Execution

```typescript
Step 1: fetchPRDetails()
  ↓
Step 2: fetchCommitHistory()
  ↓
Step 3: summarizeChanges()
  ↓
Step 4: sendPRSummaryToSlack()
  ↓
Return Result
```

**Each step:**
- Automatic retry on failure
- Timeout protection
- State persisted after completion

### 4. Activity Execution

```typescript
Worker polls task queue
  ↓
Receives activity task
  ↓
Executes activity function
  ↓
Returns result to Temporal
  ↓
Temporal persists event
  ↓
Workflow continues
```

## Error Handling Strategy

### Workflow Level

```typescript
try {
  // Execute steps
  return success result
} catch (error) {
  // Log error
  return failure result (don't throw)
}
```

**Rationale:** Graceful degradation, avoid workflow failure state

### Activity Level

```typescript
Automatic retry with exponential backoff:
- Attempt 1: immediate
- Attempt 2: +1s
- Attempt 3: +2s
- Attempt 4: +4s
- Attempt 5: +8s (max 30s)
```

**After 5 attempts:** Activity fails, workflow catches error

### Network Failures

- **Transient errors:** Automatic retry
- **Permanent errors:** Fail fast
- **Timeouts:** Circuit breaker pattern

## Idempotency Guarantees

### Workflow Level

**Problem:** Same PR event arrives twice (webhook retry)

**Solution:**
- Deterministic workflow ID
- Temporal rejects duplicate workflow start
- Handler returns 200 OK (idempotent response)

### Activity Level

**Problem:** Activity executed multiple times on retry

**Solution:**
- Activities designed to be idempotent
- External APIs handle duplicate requests
- State checks before mutations

## Security Model

### 1. Authentication

**Temporal Cloud:**
- mTLS with client certificates
- API key in authorization header

**GitHub API:**
- Personal Access Token (PAT)
- Fine-grained permissions

**OpenAI API:**
- API key authentication
- Organization-scoped

**Slack API:**
- Bot User OAuth Token
- Workspace-scoped

### 2. Authorization

**GitHub:**
- Read access to repositories
- No write permissions required

**Slack:**
- `chat:write` scope only
- Channel-specific posting

### 3. Secret Management

**Environment Variables:**
- All secrets in `.env` (gitignored)
- No secrets in code or version control
- Separate dev/staging/prod environments

**Webhook Verification:**
- HMAC SHA-256 signature
- Shared secret (GITHUB_WEBHOOK_SECRET)
- Timing-safe comparison

## Scalability Considerations

### Horizontal Scaling

**Workers:**
- Stateless processes
- Can run multiple instances
- Task queue distributes work
- No coordination required

**Webhook Servers:**
- Stateless HTTP servers
- Can run behind load balancer
- Each server can start workflows

### Vertical Scaling

**Worker Configuration:**
- `maxConcurrentActivityTaskExecutions: 10`
- `maxConcurrentWorkflowTaskExecutions: 10`
- Adjust based on resource limits

### Rate Limiting

**GitHub API:**
- 5000 requests/hour with token
- Activities handle rate limit errors

**OpenAI API:**
- Tier-based limits
- Automatic retry on 429 errors

**Temporal Cloud:**
- Actions-based pricing
- No hard rate limits on workflows

## Monitoring & Observability

### Logs

**Structured JSON Logging:**
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "message": "Workflow started",
  "workflowId": "pr-repo-123-opened",
  "runId": "abc-123-def"
}
```

**Log Levels:**
- `error`: Failures, exceptions
- `warn`: Retries, degraded performance
- `info`: Normal operations, workflow steps
- `debug`: Detailed activity data

### Metrics

**Key Metrics to Track:**
- Workflow start rate
- Workflow completion rate
- Workflow failure rate
- Activity execution time
- Activity retry rate
- API rate limit hits

**Implementation:** Prometheus + Grafana (future enhancement)

### Tracing

**Distributed Tracing:**
- Workflow ID propagated through all operations
- Activity execution traced
- API calls tracked

**Implementation:** OpenTelemetry (future enhancement)

## Deployment

### Development

```bash
# Terminal 1: Worker
npm run dev:worker

# Terminal 2: Webhook server
npm run dev:webhook

# Terminal 3: ngrok
ngrok http 3000
```

### Production

**Recommended Architecture:**

```
Load Balancer (ALB)
  ↓
Webhook Servers (ECS/K8s)
  ↓
Temporal Cloud
  ↓
Workers (ECS/K8s)
```

**Infrastructure:**
- Container-based deployment (Docker)
- Auto-scaling based on task queue depth
- Health checks on `/health` endpoint
- Zero-downtime deployments

## Testing Strategy

### Unit Tests

**Workflows:**
- Test with mocked activities
- Temporal TestWorkflowEnvironment
- Verify step execution order

**Activities:**
- Mock external APIs
- Test retry logic
- Validate input/output

### Integration Tests

**End-to-End:**
- Webhook → Workflow → Activities
- Real Temporal connection (test namespace)
- Stubbed external APIs

### Load Tests

**Scenarios:**
- Concurrent PR events
- High webhook throughput
- Worker capacity testing

## Future Enhancements

1. **Multi-region deployment** for high availability
2. **Workflow versioning** for backward compatibility
3. **Saga pattern** for compensating transactions
4. **Child workflows** for complex orchestration
5. **Signals and Queries** for interactive workflows
6. **Scheduled workflows** for periodic tasks
7. **Search attributes** for advanced querying
8. **Metrics export** to Prometheus/Datadog
9. **Distributed tracing** with OpenTelemetry
10. **Database persistence** for workflow metadata

---

This architecture provides a solid foundation for building production-grade automation workflows with Temporal.
