// pages/index.js
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  // Wizard step
  const [step, setStep] = useState(0);

  // Step 0
  const [brandName, setBrandName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  // Step 1
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');
  const [tone, setTone] = useState('friendly');
  const [platform, setPlatform] = useState('instagram');
  const [format, setFormat] = useState('1:1'); // 1:1, 9:16, 16:9
  const [includeVoiceover, setIncludeVoiceover] = useState(true);

  // Global
  const [voice, setVoice] = useState('alloy');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const audioRef = useRef(null);

  // Compose result
  const [headline, setHeadline] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  // Render status
  const [jobId, setJobId] = useState(null);
  const lastUrlRef = useRef(null);

  // util: log
  function pushLog(line) {
    setLog(l => [new Date().toLocaleTimeString() + ' — ' + line, ...l].slice(0, 200));
  }

  // Persist basic inputs so your session resumes nicely
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('orion-wizard') || '{}');
    if (saved.brandName) setBrandName(saved.brandName);
    if (saved.website) setWebsite(saved.website);
    if (saved.description) setDescription(saved.description);
    if (saved.industry) setIndustry(saved.industry);
    if (saved.goal) setGoal(saved.goal);
    if (saved.tone) setTone(saved.tone);
    if (saved.platform) setPlatform(saved.platform);
    if (saved.format) setFormat(saved.format);
    if (typeof saved.includeVoiceover === 'boolean') setIncludeVoiceover(saved.includeVoiceover);
    if (saved.voice) setVoice(saved.voice);
  }, []);
  useEffect(() => {
    const payload = { brandName, website, description, industry, goal, tone, platform, format, includeVoiceover, voice };
    localStorage.setItem('orion-wizard', JSON.stringify(payload));
  }, [brandName, website, description, industry, goal, tone, platform, format, includeVoiceover, voice]);

  // Step 0 → Step 1
  function goStep1() {
    if (!brandName.trim() || !description.trim()) {
      pushLog('Step 0: brand & description are required.');
      return;
    }
    setStep(1);
  }

  // Step 1 → Compose (Step 2)
  async function compose() {
    if (busy) return;
    setBusy(true);
    pushLog('Composing campaign copy…');

    try {
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName, website, description,
          industry, goal, tone, platform, format,
          includeVoiceover
        })
      });
      const json = await res.json();
      if (json.error) {
        pushLog('Compose error: ' + json.error);
        return;
      }

      setHeadline(json.headline || '');
      setCaption(json.caption || '');
      setHashtags(Array.isArray(json.hashtags) ? json.hashtags : []);
      setScript(json.script || '');
      setAudioUrl('');
      pushLog('Compose done.');
      setStep(2);
    } catch (e) {
      pushLog('Compose failed: ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  // Step 2: optional voiceover
  async function makeVoiceover() {
    if (busy) return;
    if (!script.trim()) { pushLog('No script to voice.'); return; }
    setBusy(true);
    pushLog('Generating TTS…');

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, voice })
      });
      const json = await res.json();
      const url = json.audio || json.url || json.dataUrl || json.audioUrl;
      if (!url) {
        pushLog('No audio returned: ' + JSON.stringify(json));
        return;
      }
      setAudioUrl(url);
      pushLog('Playing TTS audio…');
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      await audioRef.current.play().catch(err =>
        pushLog('Audio play blocked: ' + (err?.message || String(err)))
      );
    } catch (e) {
      pushLog('TTS error: ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  // Render with Shotstack using generated headline
  async function renderSample() {
    if (busy) return;
    const text = (headline || '').trim();
    if (!text) { pushLog('Please compose first — need a headline.'); return; }

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
      pushLog('Render error: ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Orion — Social Media MVP</h1>
        <p style={styles.p}>Brand → Compose → (Voiceover) → Render.</p>

        {/* Wizard stepper */}
        <div style={styles.steps}>
          <span style={{...styles.step, ...(step===0?styles.stepActive:{})}}>0</span>
          <span style={{...styles.step, ...(step===1?styles.stepActive:{})}}>1</span>
          <span style={{...styles.step, ...(step===2?styles.stepActive:{})}}>2</span>
        </div>

        {/* STEP 0 */}
        {step === 0 && (
          <section style={styles.section}>
            <h3 style={styles.h3}>Step 0 — Start</h3>
            <div style={styles.inputs}>
              <label style={styles.label}>
                Brand / Product Name *
                <input style={styles.input} value={brandName} onChange={e=>setBrandName(e.target.value)} placeholder="Acme Tea" />
              </label>
              <label style={styles.label}>
                Website (optional)
                <input style={styles.input} value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://example.com" />
              </label>
              <label style={styles.label}>
                Description / Motive *
                <textarea style={styles.textarea} rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="What are we promoting?" />
              </label>
            </div>

            <div style={styles.row}>
              <button style={styles.btn} disabled={busy} onClick={goStep1}>Next → Tell Us</button>
            </div>
          </section>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <section style={styles.section}>
            <h3 style={styles.h3}>Step 1 — Tell Us</h3>
            <div style={styles.inputs}>
              <label style={styles.label}>
                Industry
                <input style={styles.input} value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="Food & Beverage" />
              </label>
              <label style={styles.label}>
                Goal
                <input style={styles.input} value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Drive product trials" />
              </label>
              <label style={styles.label}>
                Tone
                <input style={styles.input} value={tone} onChange={e=>setTone(e.target.value)} placeholder="Friendly, upbeat" />
              </label>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <label style={styles.label}>
                  Platform
                  <select style={styles.input} value={platform} onChange={e=>setPlatform(e.target.value)}>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="x">X (Twitter)</option>
                  </select>
                </label>
                <label style={styles.label}>
                  Format
                  <select style={styles.input} value={format} onChange={e=>setFormat(e.target.value)}>
                    <option value="1:1">Static 1:1</option>
                    <option value="9:16">Reel/Story 9:16</option>
                    <option value="16:9">Wide 16:9</option>
                  </select>
                </label>
              </div>

              <label style={{...styles.label, alignItems:'center', gridTemplateColumns:'auto 1fr', display:'grid', gap:10}}>
                <input type="checkbox" checked={includeVoiceover} onChange={e=>setIncludeVoiceover(e.target.checked)} />
                Include Voiceover
              </label>

              <label style={styles.label}>
                Voice
                <select style={styles.input} value={voice} onChange={e=>setVoice(e.target.value)}>
                  <option value="alloy">alloy</option>
                  <option value="verse">verse</option>
                  <option value="aria">aria</option>
                  <option value="sage">sage</option>
                  <option value="amber">amber</option>
                </select>
              </label>
            </div>

            <div style={styles.row}>
              <button style={styles.btn} disabled={busy} onClick={()=>setStep(0)}>← Back</button>
              <button style={styles.btn} disabled={busy} onClick={compose}>Compose</button>
            </div>
          </section>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <section style={styles.section}>
            <h3 style={styles.h3}>Step 2 — Results</h3>

            <div style={styles.resultBox}>
              <div><strong>Headline</strong>: {headline || <em style={{opacity:.7}}>n/a</em>}</div>
              <div><strong>Caption</strong>: {caption || <em style={{opacity:.7}}>n/a</em>}</div>
              <div><strong>Hashtags</strong>: {hashtags?.length ? hashtags.join(' ') : <em style={{opacity:.7}}>n/a</em>}</div>
              <div><strong>Script</strong>: {script || <em style={{opacity:.7}}>n/a</em>}</div>
              {audioUrl && <div><strong>Audio</strong>: <a style={styles.linkBtn} href={audioUrl} target="_blank" rel="noreferrer">Open audio</a></div>}
            </div>

            <div style={styles.row}>
              <button style={styles.btn} disabled={busy} onClick={()=>setStep(1)}>← Edit inputs</button>
              {includeVoiceover && (
                <button style={styles.btn} disabled={busy} onClick={makeVoiceover}>🔊 Make voiceover</button>
              )}
              <button style={styles.btn} disabled={busy} onClick={renderSample}>▶️ Render sample</button>
              {lastUrlRef.current && (
                <a style={styles.linkBtn} href={lastUrlRef.current} target="_blank" rel="noreferrer">↗ Open last result</a>
              )}
            </div>
          </section>
        )}

        {/* Meta + logs */}
        <div style={styles.meta}>
          <div><strong>Job ID:</strong> {jobId || '—'}</div>
          <div><strong>Status:</strong> {busy ? 'Working…' : 'Idle'}</div>
        </div>

        <div style={styles.logWrap}>
          <div style={styles.logTitle}>Live Log</div>
          <pre style={styles.log}>{log.join('\n')}</pre>
        </div>

        <div style={styles.footer}>
          Env needed (already set): <code>SHOTSTACK_API_KEY</code>, <code>SHOTSTACK_HOST=https://api.shotstack.io</code>, <code>SHOTSTACK_ENV=v1</code>, <code>OPENAI_API_KEY</code>.
        </div>
      </div>
    </main>
  );
}

const styles = {
  wrap: { minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#0b1220', color: '#e6eefb', padding: 24 },
  card: { width: 'min(1100px, 96vw)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  title: { margin: '6px 0 16px', fontSize: 32, fontWeight: 800, letterSpacing: 0.5 },
  p: { margin: '0 0 18px', opacity: 0.9 },
  steps: { display:'flex', gap:8, margin:'8px 0 16px' },
  step: { width:28, height:28, borderRadius:999, border:'1px solid rgba(255,255,255,0.2)', display:'grid', placeItems:'center', opacity:.5 },
  stepActive: { background:'#1b2a4a', opacity:1 },

  section: { marginTop: 8, marginBottom: 10 },
  h3: { margin: '4px 0 12px', fontSize: 18, fontWeight: 700 },

  inputs: { display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 12 },
  label: { display: 'grid', gap: 6, fontSize: 12, opacity: 0.9 },
  input: { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: '#0f1a2c', color: '#e6eefb', outline: 'none' },
  textarea: { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: '#0f1a2c', color: '#e6eefb', outline: 'none', resize: 'vertical' },

  row: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  btn: { padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: '#182238', color: '#e6eefb', cursor: 'pointer' },
  linkBtn: { padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#9ecbff', textDecoration: 'none' },

  resultBox: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:12, display:'grid', gap:8, marginBottom:8 },

  meta: { display: 'flex', gap: 18, margin: '6px 0 12px', fontSize: 14, opacity: 0.9, flexWrap: 'wrap' },
  logWrap: { marginTop: 12 },
  logTitle: { fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 },
  log: { maxHeight: 260, overflow: 'auto', background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: 12, fontSize: 12, lineHeight: 1.4 },
  footer: { marginTop: 16, fontSize: 12, opacity: 0.7 }
};
