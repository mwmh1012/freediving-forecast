const ALLOWED_ORIGINS = ['https://mwmh1012.github.io', 'https://freediving-forecast.vercel.app'];
function isAllowed(req){
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  return ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));
}
const OPS = { land: 'getMidLandFcst', sea: 'getMidSeaFcst', ta: 'getMidTa' };

export default async function handler(req, res) {
  if(!isAllowed(req)){
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(403).json({ error: 'Forbidden: allowed origin only' });
  }
  const { type, regId, tmFc } = req.query;
  const op = OPS[type];
  if(!op){
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(400).json({ error: 'invalid type' });
  }
  const key = process.env.DATA_GO_KR_KEY;
  const url = `https://apis.data.go.kr/1360000/MidFcstInfoService/${op}?serviceKey=${key}&dataType=JSON&numOfRows=10&pageNo=1&regId=${regId}&tmFc=${tmFc}`;
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
