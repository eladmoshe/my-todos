import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/slack-preview-service', async (req, res) => {
  console.log('Received request for Slack preview');
  const { url } = req.query;
  
  console.log('Request URL:', req.url);
  console.log('Query parameters:', req.query);

  if (!url) {
    console.log('URL parameter is missing');
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  console.log('Fetching preview for URL:', url);

  try {
    // Extract necessary information from the Slack URL
    const urlParts = url.split('/');
    console.log('URL parts:', urlParts);
    if (urlParts.length < 5) {
      console.log('Invalid Slack URL format');
      return res.status(400).json({ error: 'Invalid Slack URL format' });
    }
    const channel = urlParts[urlParts.length - 2];
    const messageTs = urlParts[urlParts.length - 1];
    
    console.log('Channel:', channel);
    console.log('Message TS:', messageTs);

    if (!process.env.SLACK_BOT_TOKEN) {
      console.log('SLACK_BOT_TOKEN is not set');
      return res.status(500).json({ error: 'SLACK_BOT_TOKEN is not set' });
    }

    console.log('Making request to Slack API');
    // Make a request to the Slack API
    const response = await axios.get('https://slack.com/api/conversations.history', {
      params: {
        channel,
        latest: messageTs,
        limit: 1,
        inclusive: true,
      },
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
    });

    console.log('Slack API response:', response.data);

    if (!response.data.ok) {
      console.log('Slack API error:', response.data.error);
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    const message = response.data.messages[0];
    if (!message) {
      console.log('Message not found');
      return res.status(404).json({ error: 'Message not found' });
    }
    
    console.log('Sending preview:', message.text);
    res.json({ preview: message.text });
  } catch (error) {
    console.error('Error fetching Slack preview:', error);
    res.status(500).json({ error: 'Failed to fetch Slack preview', details: error.message });
  }
});

export default router;