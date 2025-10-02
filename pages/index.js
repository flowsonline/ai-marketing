// pages/index.js
import { useRef, useState } from 'react';

export default function Home() {
  const [jobId, setJobId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const audioRef = useRef(null);

  function pushLog(line) {
    setLog(l => [new Date().toLocaleTimeString() + ' — ' + line, ...l].slice(0, 80));
  }

  async function renderSample() {
    if (busy) return;
    setBusy(true);
    setJobId(null);
    pushLog('Queuing render…');

    try {
      // 1) queue render
      const queueRes = await fetch('/api/renderTemplate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: 'Hello from Flows Alpha' }) // change if you want
      });
      const queued = await queueRes.json();
      const id = queued.id || queued.response?.id;
      if (!id) {
        pushLog('No job id returned: ' + JSON.stringify(queued));
        setBusy(false);
        return;
      }
      setJobId(id);
      pushLog('Queued with id: ' + id);

      // 2) poll status
      let last = null;
      for (let i = 0; i < 40; i++) {        // ~2 minutes max
        await new Promise(s => setTimeout(s, 3000));
        const sRes = await fetch('/api/status?id=' + id);
        const sJson = await sRes.json();
        last = sJson;
        const st = sJson.status || sJson.response?.status || sJson.message;
        pushLog('Status tick: ' + (st ?? JSON.stringify(sJson)));

        if (['done', 'failed', 'cancelled'].includes(st)) break;
      }

      // 3) open result
      const url =
        last?.url ||
        last?.response?.url ||
        last?.output?.url ||
        last?.response?.output?.url;

      if (url) {
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

  async function ttsTest() {
    if (busy) return;
    setBusy(true);
    pushLog('Generating TTS…');

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: 'Hi there from Flows Alpha!',
          voice: 'alloy'
        })
      });
      const json = await res.json();
      const audioUrl = json.audio || json.url || json.dataUrl;

      if (!audioUrl) {
        pushLog('No audio returned: ' + JSON.stringify(json));
        return;
      }

      pushLog('Playing TTS audio…');
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = audioUrl;
      await audioRef.current.play().catch(err => pushLog('Audio play blocked: ' + err?.message));
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

        <div style={styles.row}>
          <button style={styles.btn} disabled={busy} onClick={renderSample}>
            ▶️ Render sample
          </button>
          <button style={styles.btn} disabled={busy} onClick={ttsTest}>
            🔊 TTS test
          </button>
        </div>

        <div style={styles.meta}>
          <div><strong>Job ID:</strong> {jobId || '—'}</div>
          <div><strong>Status:</strong> {busy ? 'Working…' : 'Idle'}</div>
        </div>

        <div style={styles.logWrap}>
          <div style={styles.logTitle}>Live Log</div>
          <pre style={styles.log}>
            {log.join('\n')}
          </pre>
        </div>

        <div style={styles.footer}>
          <div>Env needed (already set): <code>SHOTSTACK_API_KEY</code>, <code>SHOTSTACK_HOST=https://api.shotstack.io</code>, <code>SHOTSTACK_ENV=v1</code>, <code>OPENAI_API_KEY</code>.</div>
        </div>
      </div>
    </main>
  );
}

const styles = {
  wrap: { minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#0b1220', color: '#e6eefb', padding: 24 },
  card: { width: 'min(900px, 94vw)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  title: { margin: '6px 0 16px', fontSize: 32, fontWeight: 800, letterSpacing: 0.5 },
  p: { margin: '0 0 18px', opacity: 0.9 },
  row: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  btn: { padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: '#182238', color: '#e6eefb', cursor: 'pointer' },
  meta: { display: 'flex', gap: 18, margin: '6px 0 12px', fontSize: 14, opacity: 0.9, flexWrap: 'wrap' },
  logWrap: { marginTop: 12 },
  logTitle: { fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 },
  log: { maxHeight: 260, overflow: 'auto', background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: 12, fontSize: 12, lineHeight: 1.4 },
  footer: { marginTop: 16, fontSize: 12, opacity: 0.7 }
};
