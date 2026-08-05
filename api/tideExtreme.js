const ALLOWED_ORIGINS = ['https://mwmh1012.github.io', 'https://freediving-forecast.vercel.app'];
function isAllowed(req){
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  return ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));
}

export default async function handler(req, res) {
  if(!isAllowed(req)){
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(403).json({ error: 'Forbidden: allowed origin only' });
  }
  const { obs_post_id, date } = req.query;
  const key = process.env.DATA_GO_KR_KEY;
  const url = `https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService?serviceKey=${key}&type=json&numOfRows=10&pageNo=1&obsCode=${obs_post_id}&reqDate=${date}`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: String(e) });
  }
}
