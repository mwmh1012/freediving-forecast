import { Redis } from '@upstash/redis';
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

const ALLOWED_ORIGINS = ['https://mwmh1012.github.io', 'https://freediving-forecast.vercel.app'];
function isAllowed(req){
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  return ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if(req.method === 'POST'){
    if(!isAllowed(req)) return res.status(403).json({ error: 'Forbidden' });
    try{
      const { anonId, loc, message } = req.body || {};
      if(!message || !message.trim()) return res.status(400).json({ error: 'empty message' });
      const item = { ts: Date.now(), anonId: anonId||null, loc: loc||null, message: message.trim().slice(0,1000) };
      await redis.lpush('feedback_list', JSON.stringify(item));
      await redis.ltrim('feedback_list', 0, 499);
      return res.status(200).json({ ok: true });
    }catch(e){
      return res.status(500).json({ error: String(e) });
    }
  }

  if(req.method === 'GET'){
    const { key } = req.query;
    if(!key || key !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });
    try{
      const raw = await redis.lrange('feedback_list', 0, 199);
      const items = raw.map(function(r){ try{ return typeof r==='string'?JSON.parse(r):r; }catch(e){ return null; } }).filter(Boolean);
      return res.status(200).json({ items: items });
    }catch(e){
      return res.status(500).json({ error: String(e) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
