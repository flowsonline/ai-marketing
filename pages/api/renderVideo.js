// pages/api/renderVideo.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, hint: 'POST a JSON body to render a video.' });
  }

  try {
    const { buildVideoTemplate } = await import('../../lib/templates.js');

    const host = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io';
    const env = process.env.SHOTSTACK_ENV || 'v1';
    const apiKey = process.env.SHOTSTACK_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'SHOTSTACK_API_KEY missing' });

    // Inputs from wizard
    const {
      imageUrl,
      headline = '',
      audioUrl = '',
      tone = 'friendly',
      format = '1:1',
    } = req.body || {};

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl required' });
    }

    const payload = buildVideoTemplate({ imageUrl, headline, audioUrl, tone, format });

    const url = `${host}/edit/${env}/render`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const msg = await r.text();
      return res.status(r.status).json({
        error: `Shotstack POST /edit/${env}/render failed`,
        message: msg || r.statusText,
      });
    }

    const json = await r.json();
    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
