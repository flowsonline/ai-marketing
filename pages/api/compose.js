// pages/api/compose.js
// POST: { brandName, website, description, industry, goal, tone, platform, format, includeVoiceover }
// -> { headline, caption, hashtags:[], script }

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
      brandName,
      website,
      description,
      industry,
      goal,
      tone,
      platform,
      format,
      includeVoiceover
    } = req.body || {};

    // Guardrails
    if (!brandName || !description) {
      return res.status(400).json({ error: 'brandName and description are required' });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
    }

    // Build a compact system+user prompt for reliable outputs
    const sys = `
You generate concise social content as JSON. 
Return strictly a JSON object with keys: headline, caption, hashtags (array of 3-8 items), script.
Tone must match the requested tone. Keep it brand-safe.
Headline: max 90 chars. Caption: 1–3 short sentences + a clear CTA.
Script: ~8–14s voiceover that matches the format/platform.
No extra commentary—ONLY JSON.
    `.trim();

    const user = `
Brand: ${brandName}
Website: ${website || 'N/A'}
Description: ${description}

Industry: ${industry || 'N/A'}
Goal: ${goal || 'N/A'}
Tone: ${tone || 'neutral'}
Platform: ${platform || 'generic'}
Format: ${format || '1:1'}
IncludeVoiceover: ${includeVoiceover ? 'Yes' : 'No'}

Constraints:
- Headline <= 90 chars
- Keep copy specific to the brand & goal
- Hashtags should be relevant, no more than 8, no numbers or punctuation except #.

Return JSON only.
    `.trim();

    // Use fetch so we don't need any extra npm packages
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user }
        ]
      })
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return res.status(500).json({ error: `OpenAI error: ${r.status} ${text}` });
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || '';
    // Attempt to parse JSON even if model wrapped it in code fences
    const jsonStr = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback shape if parsing fails
      parsed = {
        headline: 'Your headline',
        caption: 'Your caption.',
        hashtags: ['#brand', '#marketing', '#social'],
        script: 'This is a short voiceover script.'
      };
    }

    // Final shape & mild sanitation
    const result = {
      headline: String(parsed.headline || 'Your headline').slice(0, 90),
      caption: String(parsed.caption || 'Your caption.'),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 8) : ['#brand'],
      script: String(parsed.script || '')
    };

    return res.status(200).json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'Unexpected error' });
  }
}
