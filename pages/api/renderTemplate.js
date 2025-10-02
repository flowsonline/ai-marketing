// pages/api/renderTemplate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const headline = (req.body?.headline || 'Hello from Flows Alpha').toString().slice(0, 60);

    // Hardcode the exact URL so we remove any risk of double "edit" or bad string replace
    const url = 'https://api.shotstack.io/edit/v1/render';

    // Minimal valid edit payload that Shotstack accepts right away
    const edit = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: { type: 'title', text: headline },
                start: 0,
                length: 2
              }
            ]
          }
        ]
      },
      output: { format: 'mp4', resolution: 'hd' }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Your production key must be set in Vercel as SHOTSTACK_API_KEY (you already have this)
        'x-api-key': process.env.SHOTSTACK_API_KEY || ''
      },
      body: JSON.stringify(edit)
    });

    const text = await r.text(); // capture raw in case JSON parsing fails
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok) {
      // Surface everything so we can see *exactly* what Shotstack said
      return res.status(r.status).json({
        error: `Shotstack ${r.status} ${r.statusText}`,
        url,
        request: edit,
        response: data
      });
    }

    // Success path – Shotstack returns { success, message, response: { id } }
    const id = data?.response?.id;
    return res.status(200).json({ id, shotstack: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Unexpected error' });
  }
}
