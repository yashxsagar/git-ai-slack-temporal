# Temporal Vibe Automator POC

A production-grade proof-of-concept demonstrating Temporal Cloud orchestration for automated GitHub PR summarization with Slack notifications.

## 🎯 Use Case

**Automated PR Review Notifications:**
When a Pull Request is opened on GitHub → Fetch PR details & commits → Summarize changes using GPT-4 → Send formatted Slack notification to repository owner

## 🏗️ Architecture

```
GitHub Webhook → Express Server → Temporal Client → Temporal Cloud
                                                    ↓
                                                Workflow
                                                    ↓
                                    ┌──────────────┼──────────────┐
                                    ↓              ↓              ↓
                            GitHub Activity   LLM Activity   Slack Activity
                                    ↓              ↓              ↓
                            Fetch PR & Commits  Summarize    Send Message
```

## 📁 Project Structure

```
temporal/
├── src/
│   ├── activities/          # External API calls (GitHub, OpenAI, Slack)
│   ├── workflows/           # Orchestration logic
│   ├── webhook/             # Express server for GitHub webhooks
│   ├── worker/              # Temporal worker process
│   ├── client/              # Temporal client for starting workflows
│   ├── config/              # Configuration and constants
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── tests/                   # Unit tests
├── .env                     # Environment variables
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (required by Temporal TypeScript SDK)
- **Temporal Cloud Account** (or local Temporal server)
- **GitHub Personal Access Token**
- **OpenAI API Key**
- **Slack Bot Token**
- **ngrok** (for local webhook testing)

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

The `.env` file already contains your Temporal Cloud credentials. Update the following:

```bash
# GitHub Configuration
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=C01234567  # Your Slack channel ID
```

### Getting API Keys

#### GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes: `repo`, `read:org`, `read:user`
3. Copy token to `GITHUB_TOKEN` in `.env`

#### OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `OPENAI_API_KEY` in `.env`

#### Slack Bot Token

1. Go to https://api.slack.com/apps
2. Create new app → From scratch
3. Add OAuth scopes: `chat:write`, `chat:write.public`
4. Install app to workspace
5. Copy "Bot User OAuth Token" to `SLACK_BOT_TOKEN` in `.env`
6. Get channel ID by right-clicking channel → View channel details

### Build the Project

```bash
npm run build
```

## 🎬 Running the POC

You need to run **two processes**:

### 1. Start the Temporal Worker

The worker connects to Temporal Cloud and executes workflows/activities:

```bash
npm run start:worker
```

**Expected output:**
```
[info]: Starting Temporal Worker...
[info]: Connecting to Temporal Cloud (Worker)
[info]: Successfully connected to Temporal Cloud (Worker)
[info]: Worker starting to poll for tasks...
```

### 2. Start the Webhook Server

The Express server receives GitHub webhooks and starts workflows:

```bash
npm run start:webhook
```

**Expected output:**
```
[info]: Webhook server started
[info]: Server ready to receive GitHub webhooks
[info]: Endpoint: http://0.0.0.0:3000/webhooks/github
```

### 3. Expose Webhook Server with ngrok

In a **third terminal**, expose your local server to the internet:

```bash
ngrok http 3000
```

**Copy the HTTPS forwarding URL** (e.g., `https://abc123.ngrok.io`)

### 4. Configure GitHub Webhook

1. Go to your GitHub repository → Settings → Webhooks → Add webhook
2. **Payload URL:** `https://abc123.ngrok.io/webhooks/github`
3. **Content type:** `application/json`
4. **Secret:** Use the value from `GITHUB_WEBHOOK_SECRET` in `.env`
5. **Events:** Select "Pull requests"
6. **Active:** ✓
7. Click "Add webhook"

## 🧪 Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Manual Testing

1. Create a new branch in your GitHub repository:
   ```bash
   git checkout -b test/temporal-poc
   ```

2. Make some changes and commit:
   ```bash
   echo "# Test" >> test.md
   git add test.md
   git commit -m "feat: add test file"
   ```

3. Push and create a Pull Request:
   ```bash
   git push origin test/temporal-poc
   ```

4. Go to GitHub and open a PR from `test/temporal-poc` to `main`

5. **Expected Flow:**
   - GitHub sends webhook to your ngrok URL
   - Express server receives webhook
   - Temporal workflow starts
   - Worker logs show workflow execution:
     ```
     [info]: Fetching PR details
     [info]: Fetching commit history
     [info]: Summarizing changes with GPT-4
     [info]: Sending summary to Slack
     [info]: Workflow completed successfully
     ```
   - Slack channel receives formatted notification with PR summary

## 🔍 Monitoring

### View Workflow Execution

1. Go to Temporal Cloud Web UI: https://cloud.temporal.io
2. Navigate to your namespace: `quickstart-zeak.q4oex`
3. Search for workflows by:
   - Workflow ID: `pr-{owner-repo}-{prNumber}-opened`
   - Status: Running/Completed/Failed

### Check Logs

**Worker logs:**
```bash
tail -f logs/combined.log
```

**Webhook server logs:**
Watch the terminal where webhook server is running

### Health Check

```bash
curl http://localhost:3000/health
```

## 🛠️ Development

### Run in Development Mode (with auto-reload)

**Worker:**
```bash
npm run dev:worker
```

**Webhook Server:**
```bash
npm run dev:webhook
```

### Linting

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## 📊 Features Implemented

### ✅ Core Features
- ✓ Temporal Cloud integration with mTLS authentication
- ✓ Type-safe workflows and activities
- ✓ GitHub webhook signature verification
- ✓ Idempotent workflow execution (prevents duplicates)
- ✓ Comprehensive error handling and retry policies
- ✓ Structured logging with Winston
- ✓ Rich Slack message formatting

### ✅ Production-Ready
- ✓ Exponential backoff retry policies
- ✓ Activity timeouts and circuit breakers
- ✓ Graceful shutdown handling
- ✓ Unit tests with >70% coverage
- ✓ Environment-based configuration
- ✓ Secure credential management

### ✅ Observability
- ✓ Structured JSON logging
- ✓ Workflow execution tracking
- ✓ Activity timing and metrics
- ✓ Error tracking with stack traces

## 🎯 Workflow Configuration

### Retry Policy

Activities automatically retry with exponential backoff:
- Initial interval: 1 second
- Maximum interval: 30 seconds
- Backoff coefficient: 2x
- Maximum attempts: 5

### Timeouts

- **Workflow execution timeout:** 10 minutes
- **GitHub activities:** 30 seconds
- **LLM activities:** 60 seconds
- **Slack activities:** 20 seconds

### Idempotency

Workflow IDs follow the pattern: `pr-{owner-repo}-{prNumber}-{action}`

This ensures:
- Same PR event doesn't trigger duplicate workflows
- Workflows can be safely retried
- Temporal handles `ALREADY_EXISTS` errors gracefully

## 🔐 Security

- ✅ GitHub webhook signature verification (HMAC SHA-256)
- ✅ Environment variable-based secrets (never committed)
- ✅ Temporal Cloud mTLS authentication
- ✅ API tokens stored in `.env` (gitignored)

## 🐛 Troubleshooting

### Worker Can't Connect to Temporal Cloud

**Error:** `Failed to connect to Temporal Cloud (Worker)`

**Solution:**
- Verify `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_API_KEY` in `.env`
- Check API key expiration (current key expires: 2026-11-29)
- Ensure internet connectivity

### Webhook Server Not Receiving Events

**Problem:** GitHub shows webhook delivery as failed

**Solutions:**
1. Verify ngrok is running: `ngrok http 3000`
2. Check webhook URL in GitHub settings
3. Verify webhook secret matches `.env`
4. Check webhook server logs for errors

### GitHub API Rate Limit

**Error:** `API rate limit exceeded`

**Solution:**
- Use authenticated requests (requires `GITHUB_TOKEN`)
- Current limit: 5000 requests/hour with token

### OpenAI API Errors

**Error:** `Insufficient quota` or `Rate limit exceeded`

**Solutions:**
- Check OpenAI account credits
- Reduce `OPENAI_CONFIG.maxTokens` in `src/config/constants.ts`
- Implement retry with backoff (already configured)

### Slack Message Not Sent

**Error:** `channel_not_found` or `not_in_channel`

**Solutions:**
- Verify `SLACK_CHANNEL_ID` in `.env`
- Invite bot to channel: `/invite @YourBotName`
- Check bot has `chat:write` scope

## 📚 Resources

- [Temporal TypeScript SDK Docs](https://docs.temporal.io/develop/typescript)
- [Temporal Cloud](https://cloud.temporal.io)
- [GitHub Webhooks Guide](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Slack API Documentation](https://api.slack.com/docs)

## 🎓 Next Steps

### Enhance the POC

1. **Add more workflow patterns:**
   - Scheduled PR review reminders
   - Automatic PR merging based on criteria
   - Multi-step approval workflows

2. **Improve summarization:**
   - Analyze code diffs (not just commits)
   - Detect breaking changes
   - Security vulnerability scanning

3. **Extend integrations:**
   - Microsoft Teams notifications
   - Jira ticket creation
   - Email notifications

4. **Production hardening:**
   - Add metrics (Prometheus/Grafana)
   - Implement distributed tracing
   - Set up alerting for workflow failures
   - Database for workflow metadata storage

## 📄 License

MIT

## 👥 Support

For issues or questions about this POC:
- Review Temporal docs: https://docs.temporal.io
- Temporal community: https://temporal.io/slack
- Vibe Automator team: [internal contact]

---

**Built with ❤️ using Temporal Cloud**
