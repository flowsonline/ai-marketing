// pages/index.js
import { useRef, useState } from 'react';

export default function Home() {
  // ---- Step 0/1: inputs for /api/compose ----
  const [brandName, setBrandName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('awareness');
  const [tone, setTone] = useState('friendly');
  const [platform, setPlatform] = useState('instagram');
  const [format, setFormat] = useState('1:1');     // Static 1:1, Reel 9:16, Story 9:16, Wide 16:9
  const [includeVoiceover, setIncludeVoiceover] = useState(true);

  // ---- Existing “quick test” controls ----
  const [headline, setHeadline] = useState('Hello from Flows Alpha');
  const [ttsScript, setTtsScript] = useState('Hi there from Flows Alpha!');
  const [voice, setVoice] = useState('alloy');

  // ---- Status + log ----
  const [jobId, setJobId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const audioRef = useRef(null);
  const lastUrlRef = useRef(null);

  function pushLog(line) {
    setLog(l => [new Date().toLocaleTimeString() + ' — ' + line, ...l].slice(0, 120));
  }

  // ---- NEW: call /api/compose ----
  async function composeNow() {
    if (busy) return;
    if (!brandName.trim() || !description.trim()) {
      pushLog('Please fill Brand and Description before composing.');
      return;
    }
    setBusy(true);
    try {
      pushLog('Composing copy with /api/compose…');
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          website: website.trim(),
          description: description.trim(),
          industry: industry.trim(),
          goal,
          tone,
          platform,
          format,
          includeVoiceover
        })
      });
      const json = await res.json();
      if (!res.ok) {
        pushLog('Compose error: ' + (json?.error || res.statusText));
        return;
      }

      // Hydrate the quick-test fields with the composed results
      if (json.headline) setHeadline(json.headline);
      if (json.script) setTtsScript(json.script);

      pushLog('Compose OK. Headline & script updated.');
    } catch (e) {
      pushLog('Compose error: ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  // ---- Existing: render sample via Shotstack template ----
  async function renderSample() {
    if (busy) return;
    const text = headline.trim();
    if (!text) { pushLog('Please enter a headline first.'); return; }

    setBusy(true);
    setJobId(null);
    lastUrlRef.current = null;
    pushLog('Queuing render…');

    try {
      const queueRes = await fetch('/api/renderTemplate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: text })
      });
      const queued = await queueRes.json();
      const id = queued.id || queued.response?.id;
      if (!id) { pushLog('No job id returned: ' + JSON.stringify(queued)); return; }
      setJobId(id);
      pushLog('Queued with id: ' + id);

      let last = null;
      for (let i = 0; i < 40; i++) {
        await new Promise(s => setTimeout(s, 3000));
        const sRes = await fetch('/api/status?id=' + id);
        const sJson = await sRes.json();
        last = sJson;
        const st = sJson.status || sJson.response?.status || sJson.message;
        pushLog('Status tick: ' + (st ?? JSON.stringify(sJson)));
        if (['done', 'failed', 'cancelled'].includes(st)) break;
      }

      const url =
        last?.url || last?.response?.url || last?.output?.url || last?.response?.output?.url;

      if (url) {
        lastUrlRef.current = url;
        pushLog('Opening result: ' + url);
        window.open(url, '_blank');
      } else {
        pushLog('Finished (or timed out) with no URL. Last: ' + JSON.stringify(last));
      }
    } catch (e) {
      pushLog('Error: ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  // ---- Existing: TTS quick test ----
  async function ttsTest() {
    if (busy) return;
    const script = ttsScript.trim();
    if (!script) { pushLog('Please enter a TTS script first.'); return; }

    setBusy(true);
    pushLog('Generating TTS…');

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, voice })
      });
      const json = await res.json();
      const audioUrl = json.audio || json.url || json.dataUrl || json.audioUrl;

      if (!audioUrl) { pushLog('No audio returned: ' + JSON.stringify(json)); return; }

      pushLog('Playing TTS audio…');
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = audioUrl;
      await audioRef.current.play().catch(err =>
        pushLog('Audio play blocked: ' + (err?.message || String(err)))
      );
    } catch (e) {
      pushLog('TTS error: ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Orion — Social Media MVP</h1>
        <p style={styles.p}>Quick actions to prove the backend is wired and working.</p>

        {/* STEP 0/1: Compose */}
        <div style={styles.sectionTitle}>Step 0/1 — Compose</div>
        <div style={styles.inputs}>
          <label style={styles.label}>
            Brand / Product Name *
            <input
              style={styles.input}
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              placeholder="Acme Outdoors"
              maxLength={120}
            />
          </label>

          <label style={styles.label}>
            Website
            <input
              style={styles.input}
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </label>

          <label style={styles.label}>
            Description / Motive *
            <textarea
              style={styles.textarea}
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this campaign about?"
              maxLength={800}
            />
          </label>

          {/* Few optional selectors to seed the LLM */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10}}>
            <label style={styles.label}>
              Industry
              <input style={styles.input} value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="outdoor gear" />
            </label>

            <label style={styles.label}>
              Goal
              <select style={styles.input} value={goal} onChange={e=>setGoal(e.target.value)}>
                <option value="awareness">awareness</option>
                <option value="engagement">engagement</option>
                <option value="conversions">conversions</option>
                <option value="lead-gen">lead-gen</option>
              </select>
            </label>

            <label style={styles.label}>
              Tone
              <select style={styles.input} value={tone} onChange={e=>setTone(e.target.value)}>
                <option value="friendly">friendly</option>
                <option value="bold">bold</option>
                <option value="professional">professional</option>
                <option value="playful">playful</option>
              </select>
            </label>

            <label style={styles.label}>
              Platform
              <select style={styles.input} value={platform} onChange={e=>setPlatform(e.target.value)}>
                <option value="instagram">instagram</option>
                <option value="tiktok">tiktok</option>
                <option value="facebook">facebook</option>
                <option value="youtube">youtube</option>
                <option value="linkedin">linkedin</option>
              </select>
            </label>

            <label style={styles.label}>
              Format
              <select style={styles.input} value={format} onChange={e=>setFormat(e.target.value)}>
                <option value="1:1">Static 1:1</option>
                <option value="9:16">Reel 9:16</option>
                <option value="story">Story 9:16</option>
                <option value="16:9">Wide 16:9</option>
              </select>
            </label>

            <label style={styles.label}>
              Include Voiceover?
              <select style={styles.input} value={includeVoiceover ? 'yes' : 'no'} onChange={e=>setIncludeVoiceover(e.target.value==='yes')}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
        </div>

        <div style={styles.row}>
          <button style={styles.btn} disabled={busy} onClick={composeNow}>✨ Compose</button>
        </div>

        {/* Quick-test Inputs (what you already had) */}
        <div style={styles.sectionTitle}>Quick tests</div>
        <div style={styles.inputs}>
          <label style={styles.label}>
            Headline for video
            <input
              style={styles.input}
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="Enter headline text…"
              maxLength={120}
            />
          </label>

          <label style={styles.label}>
            TTS script
            <textarea
              style={styles.textarea}
              rows={3}
              value={ttsScript}
              onChange={e => setTtsScript(e.target.value)}
              placeholder="What should the voice say?"
              maxLength={800}
            />
          </label>

          <label style={styles.label}>
            Voice
            <select
              style={styles.input}
              value={voice}
              onChange={e => setVoice(e.target.value)}
            >
              <option value="alloy">alloy</option>
              <option value="verse">verse</option>
              <option value="aria">aria</option>
              <option value="sage">sage</option>
              <option value="amber">amber</option>
            </select>
          </label>
        </div>

        {/* Actions */}
        <div style={styles.row}>
          <button style={styles.btn} disabled={busy} onClick={renderSample}>
            ▶️ Render sample
          </button>
          <button style={styles.btn} disabled={busy} onClick={ttsTest}>
            🔊 TTS test
          </button>
          {lastUrlRef.current && (
            <a style={styles.linkBtn} href={lastUrlRef.current} target="_blank" rel="noreferrer">
              ↗ Open last result
            </a>
          )}
        </div>

        {/* Meta */}
        <div style={styles.meta}>
          <div><strong>Job ID:</strong> {jobId || '—'}</div>
          <div><strong>Status:</strong> {busy ? 'Working…' : 'Idle'}</div>
        </div>

        {/* Log */}
        <div style={styles.logWrap}>
          <div style={styles.logTitle}>Live Log</div>
          <pre style={styles.log}>{log.join('\n')}</pre>
        </div>

        <div style={styles.footer}>
          <div>
            Env needed (already set): <code>SHOTSTACK_API_KEY</code>,{' '}
            <code>SHOTSTACK_HOST=https://api.shotstack.io</code>,{' '}
            <code>SHOTSTACK_ENV=v1</code>, <code>OPENAI_API_KEY</code>.
          </div>
        </div>
      </div>
    </main>
  );
}

const styles = {
  wrap: { minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#0b1220', color: '#e6eefb', padding: 24 },
  card: { width: 'min(1000px, 94vw)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  title: { margin: '6px 0 16px', fontSize: 32, fontWeight: 800, letterSpacing: 0.5 },
  p: { margin: '0 0 18px', opacity: 0.9 },

  sectionTitle: { margin: '12px 0 8px', fontSize: 14, opacity: 0.8, letterSpacing: 0.3 },
  inputs: { display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 12 },
  label: { display: 'grid', gap: 6, fontSize: 12, opacity: 0.9 },
  input: {
    padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
    background: '#0f1a2c', color: '#e6eefb', outline: 'none'
  },
  textarea: {
    padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
    background: '#0f1a2c', color: '#e6eefb', outline: 'none', resize: 'vertical'
  },

  row: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  btn: { padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: '#182238', color: '#e6eefb', cursor: 'pointer' },
  linkBtn: { padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#9ecbff', textDecoration: 'none' },

  meta: { display: 'flex', gap: 18, margin: '6px 0 12px', fontSize: 14, opacity: 0.9, flexWrap: 'wrap' },
  logWrap: { marginTop: 12 },
  logTitle: { fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 },
  log: { maxHeight: 260, overflow: 'auto', background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: 12, fontSize: 12, lineHeight: 1.4 },
  footer: { marginTop: 16, fontSize: 12, opacity: 0.7 }
};
