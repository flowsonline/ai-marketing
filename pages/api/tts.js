// pages/api/tts.js
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const apiKey = process.env.OPENAI_API_KEY; if(!apiKey) return res.status(500).json({error:'OPENAI_API_KEY missing'});
    const { script='Hello from Orion.', voice='alloy' } = req.body || {};
    const r = await fetch('https://api.openai.com/v1/audio/speech',{
      method:'POST',
      headers:{ 'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json' },
      body: JSON.stringify({ model:'gpt-4o-mini-tts', voice, input:String(script).slice(0,800) })
    });
    if(!r.ok){ const txt = await r.text(); return res.status(500).json({error:`OpenAI TTS failed: ${txt}`}); }
    const buf = Buffer.from(await r.arrayBuffer()); const b64 = buf.toString('base64');
    return res.status(200).json({ audioUrl:`data:audio/mpeg;base64,${b64}` });
  }catch(e){ console.error('tts error:', e); return res.status(500).json({ error:e.message || 'Unexpected error' }); }
}
