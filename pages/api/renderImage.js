// pages/api/renderImage.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { headline = 'Hello from Flows Alpha' } = req.body || {};

    const host = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io';
    const env  = process.env.SHOTSTACK_ENV || 'v1';
    const apiKey = process.env.SHOTSTACK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SHOTSTACK_API_KEY missing' });
    }

    const url = `${host}/edit/${env}/render`;

    // Minimal still-image job (PNG) – simple title text
    const edit = {
      timeline: {
        tracks: [
          { clips: [
            { asset: { type: 'title', text: String(headline).slice(0, 60) }, start: 0, length: 2 }
          ] }
        ]
      },
      output: { format: 'png', resolution: 'sd' }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(edit)
    });

    const bodyText = await r.text();             // <-- always read text first
    const maybeJson = safeParse(bodyText);

    if (!r.ok) {
      return res.status(r.status).json({
        error: `Shotstack ${r.status} ${r.statusText}`,
        url,
        request: edit,
        response: maybeJson
      });
    }

    // Shotstack queue responses include { id, message, response: { id } }
    return res.status(200).json(maybeJson);
  } catch (e) {
    console.error('renderImage error:', e);
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}

function safeParse(t) {
  try { return JSON.parse(t); } catch { return t; }
}
