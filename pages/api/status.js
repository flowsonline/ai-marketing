// pages/api/status.js
export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    const host = process.env.SHOTSTACK_HOST || 'https://api.shotstack.io';
    const env  = process.env.SHOTSTACK_ENV  || 'v1';
    const key  = process.env.SHOTSTACK_API_KEY;
    const url  = `${host}/edit/${env}/render/${id}`;

    let last = null;
    let statusCode = 0;

    // Retry a few times to smooth over Shotstack's propagation window
    for (let attempt = 0; attempt < 6; attempt++) {
      const r = await fetch(url, { headers: { 'x-api-key': key } });
      statusCode = r.status;

      if (statusCode === 200) {
        last = await r.json();
        break;
      }

      // 404 = job not visible yet — keep trying
      if (statusCode === 404) {
        await new Promise(s => setTimeout(s, 1500)); // 1.5s backoff
        continue;
      }

      // Other error — capture response and stop
      last = await r.json().catch(() => ({}));
      break;
      }

    // If still 404 after retries, report as "queued" (not an error)
    if (statusCode === 404) {
      return res.status(200).json({
        status: 'queued',
        note: 'Job not visible yet, keep polling',
      });
    }

    // Normal response (200 or other payload we captured)
    return res.status(200).json(last ?? { status: 'unknown' });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(200).json({ error: e?.message || 'Unexpected error' });
    }
  }
}
