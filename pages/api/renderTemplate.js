// pages/api/renderTemplate.js

export default async function handler(req, res) {
  // Friendly response for GET so the UI console doesn't spam 405s
  if (req.method !== 'POST') {
    return res.status(200).json({
      ok: true,
      hint: 'POST a JSON body like { "headline": "Your text", "format": "1:1|9:16|16:9" } to queue a sample render.',
    });
  }

  try {
    const host = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io';
    const env = process.env.SHOTSTACK_ENV || 'v1';
    const apiKey = process.env.SHOTSTACK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'SHOTSTACK_API_KEY missing' });
    }

    // Inputs
    const {
      headline: rawHeadline = 'Hello from Flows Alpha',
      format = '1:1', // optional: "1:1" | "9:16" | "16:9"
    } = req.body || {};

    const headline = String(rawHeadline).slice(0, 80);
    const aspectRatio = format === '9:16' ? '9:16' : format === '16:9' ? '16:9' : '1:1';
    const resolution = aspectRatio === '1:1' ? 'sd' : 'hd';

    // Minimal demo payload — a 2s title card
    const edit = {
      timeline: {
        background: '#111827',
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: 'title',
                  text: headline,
                  style: 'minimal',
                  size: 'small',
                  color: '#ffffff',
                },
                start: 0,
                length: 2,
                transition: { in: 'fade', out: 'fade' },
                position: 'center',
              },
            ],
          },
        ],
      },
      output: {
        format: 'mp4',
        resolution,   // "sd" for 1:1 demo, "hd" for 9:16 / 16:9
        aspectRatio,  // "1:1" | "9:16" | "16:9"
        fps: 30,
      },
    };

    const url = `${host}/edit/${env}/render`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(edit),
    });

    // If Shotstack returns error, read text (not JSON) to avoid "Unexpected end of JSON input"
    if (!r.ok) {
      const msg = await r.text();
      return res.status(r.status).json({
        error: `Shotstack POST /edit/${env}/render failed`,
        message: msg || r.statusText,
      });
    }

    const json = await r.json();
    // Example success shape: { success:true, response:{ id: '...', message:'...' } }
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
