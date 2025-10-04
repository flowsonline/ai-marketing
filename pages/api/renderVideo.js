// pages/api/renderVideo.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { buildVideoTemplate } = await import('../../lib/templates.js');

    const host = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io';
    const env  = process.env.SHOTSTACK_ENV || 'v1';
    const key  = process.env.SHOTSTACK_API_KEY;
    if (!key) return res.status(500).json({ error: 'Missing SHOTSTACK_API_KEY' });

    const {
      imageUrl,
      headline = '',
      audioUrl = '',
      format = '1:1',
    } = req.body || {};

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl required' });
    }

    const payload = buildVideoTemplate({ imageUrl, headline, audioUrl, format });

    const url = `${host}/edit/${env}/render`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch {}

    if (!r.ok) {
      return res.status(r.status).json({
        error: `Shotstack POST /edit/${env}/render failed: ${json?.message || r.statusText}`,
        url, request: payload, response: json
      });
    }

    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}
