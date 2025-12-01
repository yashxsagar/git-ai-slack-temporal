# Quick Setup Guide

## Step-by-Step Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Edit `.env` file and add your credentials:

```bash
# Required: GitHub
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_WEBHOOK_SECRET=your_random_secret_here

# Required: OpenAI
OPENAI_API_KEY=sk-your_openai_key_here

# Required: Slack
SLACK_BOT_TOKEN=xoxb-your_slack_bot_token_here
SLACK_CHANNEL_ID=your_slack_channel_id_here
```

**Quick Secret Generation:**
```bash
# Generate GitHub webhook secret
openssl rand -hex 32
```

### 3. Build the Project

```bash
npm run build
```

### 4. Test the Build

```bash
npm test
```

### 5. Start Services

**Terminal 1 - Worker:**
```bash
npm run start:worker
```

**Terminal 2 - Webhook Server:**
```bash
npm run start:webhook
```

**Terminal 3 - ngrok:**
```bash
ngrok http 3000
```

### 6. Configure GitHub Webhook

1. Copy ngrok HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
2. Go to: GitHub Repo → Settings → Webhooks → Add webhook
3. Paste: `https://abc123.ngrok-free.app/webhooks/github`
4. Secret: Use value from `GITHUB_WEBHOOK_SECRET` in `.env`
5. Events: Select "Pull requests"
6. Save

### 7. Test with a PR

```bash
git checkout -b test/temporal-demo
echo "# Test" >> test.md
git add test.md
git commit -m "test: temporal integration"
git push origin test/temporal-demo
```

Then create a PR on GitHub!

## Troubleshooting

### Can't connect to Temporal Cloud?
- Check `.env` has correct `TEMPORAL_API_KEY`
- Verify internet connection
- Check Temporal Cloud status

### Worker not starting?
```bash
# Check logs
npm run start:worker 2>&1 | tee worker.log
```

### Webhook not working?
```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/health

# Check ngrok status
curl http://127.0.0.1:4040/api/tunnels
```

### Tests failing?
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
npm test
```

## Quick Commands

```bash
# Development with auto-reload
npm run dev:worker      # Terminal 1
npm run dev:webhook     # Terminal 2

# Production build
npm run build
npm run start:worker
npm run start:webhook

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Code quality
npm run lint            # Check linting
npm run format          # Format code
```

## Next Steps

1. ✅ Complete setup
2. ✅ Test with demo PR
3. 📖 Read [ARCHITECTURE.md](./ARCHITECTURE.md)
4. 🚀 Extend with your own workflows
5. 📊 Add monitoring and metrics

---

**Need help?** Check [README.md](./README.md) for detailed documentation.
