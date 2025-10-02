// pages/index.js
export default function Home(){
  return(<main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0B0F1A',color:'#E8EEFF',fontFamily:'ui-sans-serif,system-ui'}}>
    <div style={{maxWidth:780,width:'100%',padding:24}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}><img src="/orion.svg" width="40" height="40" alt="Orion"/><h1 style={{margin:0}}>Orion — Social Media MVP</h1></div>
      <p>Endpoints to test after deploy:</p>
      <ul>
        <li><code>/api/health</code> & <code>/api/version</code></li>
        <li><code>POST /api/renderTemplate</code> with {"{"}"headline":"Hello"{"}"}</li>
        <li><code>GET /api/status?id=&lt;jobId&gt;</code></li>
        <li><code>POST /api/tts</code> with {"{"}"script":"Hi","voice":"alloy"{"}"}</li>
      </ul>
      <p style={{opacity:.7}}>Set env vars in Vercel: SHOTSTACK_API_KEY, SHOTSTACK_HOST=https://api.shotstack.io, SHOTSTACK_ENV=v1, OPENAI_API_KEY.</p>
    </div></main>);
}
