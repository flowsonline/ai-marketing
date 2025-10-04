// pages/api/renderImage.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { buildImageTemplate } = await import('../../lib/templates.js');

    const host = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io';
    const env  = process.env.SHOTSTACK_ENV || 'v1';
    const key  = process.env.SHOTSTACK_API_KEY;
    if (!key) return res.status(500).json({ error: 'SHOTSTACK_API_KEY missing' });

    const {
      headline = 'Hello from Flows Alpha',
      format = '1:1',
      logoUrl = '',
      paletteColor = '#111827',
    } = req.body || {};

    const edit = buildImageTemplate({
      headline: String(headline).slice(0, 80),
      logoUrl,
      paletteColor,
      format
    });

    const url = `${host}/edit/${env}/render`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify(edit),
    });

    const text = await r.text(); // guard empty body
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch {}

    if (!r.ok) {
      return res.status(r.status).json({
        error: `Shotstack POST /edit/${env}/render failed: ${json?.message || r.statusText}`,
        url, request: edit, response: json
      });
    }

    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}
