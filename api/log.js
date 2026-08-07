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
  if(!isAllowed(req)) return res.status(403).json({ error: 'Forbidden' });
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { anonId, loc, type } = req.body || {};
    if(!anonId) return res.status(400).json({ error: 'missing anonId' });
    const now = new Date();
    const dateKey = now.toISOString().slice(0,10);
    const ts = now.getTime();

    await Promise.all([
      redis.incr(`events:${dateKey}`),
      redis.sadd(`visitors:${dateKey}`, anonId),
      redis.lpush('recent_events', JSON.stringify({ ts, anonId, loc: loc||null, type: type||'view' }))
    ]);
    await redis.ltrim('recent_events', 0, 4999);

    res.status(200).json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
}
