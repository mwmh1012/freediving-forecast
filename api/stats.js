import { Redis } from '@upstash/redis';
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

function kstShift(d){ return new Date(d.getTime() + 9*60*60*1000); }
function kstKey(shifted){ return shifted.toISOString().slice(0,10); }

function dateKeysBetween(startShifted, endShifted){
  const keys = [];
  const d = new Date(startShifted.getTime());
  while(d.getTime() <= endShifted.getTime()){
    keys.push(kstKey(d));
    d.setUTCDate(d.getUTCDate()+1);
  }
  return keys;
}
async function sumEvents(dateKeys){
  const vals = await Promise.all(dateKeys.map(function(dk){ return redis.get(`events:${dk}`); }));
  return vals.reduce(function(s,v){ return s + (v?parseInt(v,10):0); }, 0);
}
async function uniqueVisitors(dateKeys){
  const arrs = await Promise.all(dateKeys.map(function(dk){ return redis.smembers(`visitors:${dk}`); }));
  const set = new Set();
  arrs.forEach(function(a){ (a||[]).forEach(function(id){ set.add(id); }); });
  return set.size;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { key, days } = req.query;
  if(!key || key !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });

  try {
    const numDays = Math.min(parseInt(days,10) || 14, 60);
    const todayShifted = kstShift(new Date());
    const daily = [];
    for(let i=0; i<numDays; i++){
      const d = new Date(todayShifted.getTime());
      d.setUTCDate(d.getUTCDate()-i);
      const dateKey = kstKey(d);
      const [events, visitors] = await Promise.all([
        redis.get(`events:${dateKey}`),
        redis.scard(`visitors:${dateKey}`)
      ]);
      daily.push({ date: dateKey, events: events ? parseInt(events,10) : 0, visitors: visitors || 0 });
    }

    const dow = todayShifted.getUTCDay();
    const diffToMonday = (dow === 0 ? -6 : 1) - dow;
    const weekStart = new Date(todayShifted.getTime());
    weekStart.setUTCDate(weekStart.getUTCDate() + diffToMonday);
    const weekKeys = dateKeysBetween(weekStart, todayShifted);

    const monthStart = new Date(Date.UTC(todayShifted.getUTCFullYear(), todayShifted.getUTCMonth(), 1));
    const monthKeys = dateKeysBetween(monthStart, todayShifted);

    const [weekEvents, monthEvents, weekVisitors, monthVisitors, totalEventsRaw, totalVisitorsRaw] = await Promise.all([
      sumEvents(weekKeys),
      sumEvents(monthKeys),
      uniqueVisitors(weekKeys),
      uniqueVisitors(monthKeys),
      redis.get('events:total'),
      redis.scard('visitors:total')
    ]);

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

    res.status(200).json({
      daily: daily.reverse(),
      recent: recent,
      topLocations: topLocations,
      summary: {
        weekEvents: weekEvents, weekVisitors: weekVisitors,
        monthEvents: monthEvents, monthVisitors: monthVisitors,
        totalEvents: totalEventsRaw ? parseInt(totalEventsRaw,10) : 0,
        totalVisitors: totalVisitorsRaw || 0
      }
    });
  } catch(e) {
    res.status(500).json({ error: String(e) });
  }
}
