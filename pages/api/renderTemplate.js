// pages/api/renderTemplate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const headline = (req.body?.headline || 'Hello from Flows Alpha').toString().slice(0, 60);

    // 🟢 Use env vars so we can switch prod/stage from Vercel
    const host = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io';
    const env  = process.env.SHOTSTACK_ENV  || 'v1'; // set to "stage" in Vercel
    const key  = process.env.SHOTSTACK_API_KEY;

    const url = `${host}/edit/${env}/render`;

    // Minimal valid edit payload
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
      output: { format: 'mp4', resolution: 'sd' }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key
      },
      body: JSON.stringify({ timeline: edit.timeline, output: edit.output })
    });

    const body = await r.json().catch(() => ({}));

    if (!r.ok) {
      // Helpful error echo
      return res.status(r.status).json({
        error: `Shotstack ${r.status} ${r.statusText}`,
        url,
        request: { timeline: edit.timeline, output: edit.output },
        response: body
      });
    }

    // Success returns { success:true, response:{ id, ... } } on stage/prod
    return res.status(200).json(body);
  } catch (e) {
    console.error('renderTemplate error:', e);
    return res.status(500).json({ error: e?.message || 'Unexpected error' });
  }
}
