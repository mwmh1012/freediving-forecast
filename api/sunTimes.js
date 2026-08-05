const ALLOWED_ORIGINS = ['https://mwmh1012.github.io', 'https://freediving-forecast.vercel.app'];
function isAllowed(req){
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  return ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));
}
function extractTag(xml, tag){
  const m = xml.match(new RegExp('<'+tag+'>([^<]*)</'+tag+'>'));
  return m ? m[1] : null;
}

export default async function handler(req, res) {
  if(!isAllowed(req)){
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(403).json({ error: 'Forbidden: allowed origin only' });
  }
  const { date, lat, lng } = req.query;
  const key = process.env.DATA_GO_KR_KEY;
  const url = `https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getLCRiseSetInfo?serviceKey=${key}&locdate=${date}&longitude=${lng}&latitude=${lat}&dnYn=Y&numOfRows=10`;
  try {
    const r = await fetch(url);
    const xml = await r.text();
    const data = {
      sunrise: extractTag(xml, 'sunrise'),
      sunset: extractTag(xml, 'sunset'),
      suntransit: extractTag(xml, 'suntransit'),
      civilm: extractTag(xml, 'civilm'),
      civile: extractTag(xml, 'civile')
    };
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: String(e) });
  }
}
