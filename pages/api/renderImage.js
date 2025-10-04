// pages/api/renderImage.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // Prevent the “405 noise” from GETs by returning a simple message
    return res.status(200).json({ ok: true, hint: 'POST a JSON body to render an image.' });
  }

  try {
    const { buildImageTemplate } = await import('../../lib/templates.js');

    const host = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io';
    const env = process.env.SHOTSTACK_ENV || 'v1';
    const apiKey = process.env.SHOTSTACK_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'SHOTSTACK_API_KEY missing' });

    // Inputs coming from the wizard
    const {
      headline = '',
      logoUrl = '',
      tone = 'friendly',
      format = '1:1',
    } = req.body || {};

    const payload = buildImageTemplate({ headline, logoUrl, tone, format });

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
      // Read text when error to avoid “Unexpected end of JSON input”
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
