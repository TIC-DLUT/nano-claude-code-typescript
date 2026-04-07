import 'dotenv/config';

const body = JSON.stringify({
  model: 'claude-3-opus-20240229',
  messages: [{ role: 'user', content: 'ping' }],
  max_tokens: 16,
});

const res = await fetch(process.env.CLAUDE_BASE_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'x-api-key': process.env.CLAUDE_API_KEY,
    Authorization: 'Bearer ' + process.env.CLAUDE_API_KEY,
  },
  body,
});

const text = await res.text();
console.log('status=', res.status);
console.log('body=', text);
