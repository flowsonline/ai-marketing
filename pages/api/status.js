// pages/api/status.js
export default async function handler(req,res){
  try{
    const { id } = req.query; if(!id) return res.status(400).json({error:'id required'});
    const { ssGet } = await import('../../lib/shotstack.js');
    const path = `/edit/${process.env.SHOTSTACK_ENV || 'v1'}/render/${id}`;
    const data = await ssGet(path);
    const status = data?.response?.status || data?.status || 'unknown';
    const url = data?.response?.url || data?.url || null;
    return res.status(200).json({ status, url, raw:data });
  }catch(e){ console.error('status error:', e); return res.status(500).json({ error:e.message || 'Unexpected error' }); }
}
