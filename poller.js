const axios = require('axios');

async function startPolling(botToken, handleUpdate) {
  let offset = 0;
  console.log('Polling for Telegram updates...');

  while (true) {
    try {
      const res = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`, {
        params: { offset, timeout: 30, allowed_updates: ['message', 'callback_query'] }
      });

      const updates = res.data.result;
      if (updates && updates.length > 0) {
        for (const update of updates) {
          offset = update.update_id + 1;
          try {
            await handleUpdate(update, 'http://localhost:3000/app');
          } catch (err) {
            console.error('Update handler error:', err.message);
          }
        }
      }
    } catch (err) {
      if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        // Timeout is expected with long polling — just retry
        continue;
      }
      console.error('Polling error:', err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

module.exports = { startPolling };
