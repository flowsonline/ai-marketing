// pages/api/renderTemplate.js
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { staticTemplate } = await import('../../lib/templates.js');
    const { ssPost } = await import('../../lib/shotstack.js');
    const { headline='Your Headline', paletteColor='#8A5BFF' } = req.body || {};
    const edit = staticTemplate({ headline:String(headline).slice(0,60), paletteColor });
    const path = `/edit/${process.env.SHOTSTACK_ENV || 'v1'}/render`;
    const data = await ssPost(path, edit);
    const id = data?.response?.id || data?.id || null;
    return res.status(200).json({ id, response:data });
  }catch(e){ console.error('renderTemplate error:', e); return res.status(500).json({ error:e.message || 'Unexpected error' }); }
}
