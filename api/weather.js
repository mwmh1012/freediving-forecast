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
  const { base_date, base_time, nx, ny } = req.query;
  const key = process.env.DATA_GO_KR_KEY;
  const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${key}&numOfRows=1000&pageNo=1&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;
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
