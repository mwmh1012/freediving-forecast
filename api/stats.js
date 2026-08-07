import { Redis } from '@upstash/redis';
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { key, days } = req.query;
  if(!key || key !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });

  try {
    const numDays = Math.min(parseInt(days,10) || 14, 60);
    const today = new Date();
    const daily = [];
    for(let i=0; i<numDays; i++){
      const d = new Date(today);
      d.setDate(d.getDate()-i);
      const dateKey = d.toISOString().slice(0,10);
      const [events, visitors] = await Promise.all([
        redis.get(`events:${dateKey}`),
        redis.scard(`visitors:${dateKey}`)
      ]);
      daily.push({ date: dateKey, events: events ? parseInt(events,10) : 0, visitors: visitors || 0 });
    }

    const recentRaw = await redis.lrange('recent_events', 0, 49);
    const recent = recentRaw.map(function(r){
      try{ return typeof r === 'string' ? JSON.parse(r) : r; }catch(e){ return null; }
    }).filter(Boolean);

    let topLocations = [];
    try{
      const raw = await redis.zrange('location_counts', 0, 9, { rev: true, withScores: true });
      for(let i=0; i<raw.length; i+=2){
        topLocations.push({ name: raw[i], count: Math.round(raw[i+1]) });
      }
    }catch(e){ topLocations = []; }

    res.status(200).json({ daily: daily.reverse(), recent: recent, topLocations: topLocations });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
}
