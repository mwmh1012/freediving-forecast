import { Redis } from '@upstash/redis';
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

function kstDateKey(ts){
  return new Date(ts + 9*60*60*1000).toISOString().slice(0,10);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { key } = req.query;
  if(!key || key !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });

  try{
    const raw = await redis.lrange('recent_events', 0, 4999);
    const items = raw.map(function(r){ try{ return typeof r==='string'?JSON.parse(r):r; }catch(e){ return null; } }).filter(Boolean);

    const byDate = {};
    items.forEach(function(it){
      const dk = kstDateKey(it.ts);
      if(!byDate[dk]) byDate[dk] = { count:0, visitors:new Set() };
      byDate[dk].count++;
      if(it.anonId) byDate[dk].visitors.add(it.anonId);
    });

    const dates = Object.keys(byDate);
    for(const dk of dates){
      await redis.del(`events:${dk}`);
      await redis.del(`visitors:${dk}`);
      await redis.set(`events:${dk}`, byDate[dk].count);
      const visitorArr = Array.from(byDate[dk].visitors);
      if(visitorArr.length>0) await redis.sadd(`visitors:${dk}`, ...visitorArr);
    }

    res.status(200).json({ ok:true, rebuiltDates: dates, totalEventsScanned: items.length });
  }catch(e){
    res.status(500).json({ error: String(e) });
  }
}
