/**
 * Utility script to list Slack channels
 *
 * Run: npx ts-node src/utils/get-slack-channels.ts
 *
 * This will help you find the correct channel ID to use in your .env file
 */

import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';

dotenv.config();

async function listSlackChannels() {
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    console.error('❌ SLACK_BOT_TOKEN not found in .env file');
    process.exit(1);
  }

  const slack = new WebClient(token);

  try {
    console.log('🔍 Fetching Slack channels...\n');

    // Get all public channels
    const publicChannels = await slack.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
    });

    if (!publicChannels.channels || publicChannels.channels.length === 0) {
      console.log('⚠️  No channels found. Make sure your bot has access to channels.');
      return;
    }

    console.log('📋 Available Slack Channels:\n');
    console.log('Channel Name'.padEnd(30), 'Channel ID'.padEnd(20), 'Type');
    console.log('-'.repeat(70));

    publicChannels.channels.forEach((channel: any) => {
      const name = channel.name || '(unnamed)';
      const id = channel.id || 'N/A';
      const type = channel.is_private ? 'Private' : 'Public';
      console.log(name.padEnd(30), id.padEnd(20), type);
    });

    console.log(
      '\n✅ Copy the Channel ID you want to use and update SLACK_CHANNEL_ID in your .env file'
    );
    console.log('   Example: SLACK_CHANNEL_ID=C1234567890\n');
  } catch (error: any) {
    console.error('❌ Error fetching channels:', error.message);

    if (error.data?.error === 'missing_scope') {
      console.error('\n⚠️  Your bot token needs the "channels:read" scope.');
      console.error('   Go to: https://api.slack.com/apps -> Your App -> OAuth & Permissions');
      console.error('   Add "channels:read" to Bot Token Scopes and reinstall the app.\n');
    }

    process.exit(1);
  }
}

listSlackChannels();
