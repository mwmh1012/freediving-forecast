const ALLOWED_ORIGINS = ['https://mwmh1012.github.io', 'https://freediving-forecast.vercel.app'];
function isAllowed(req){
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  return ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));
}

const OBS_CODES = ['DT_0001','DT_0004','DT_0005','DT_0006','DT_0007','DT_0010','DT_0011','DT_0012','DT_0013','DT_0014','DT_0022','DT_0023','DT_0026','DT_0031','DT_0032'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if(!isAllowed(req)) return res.status(403).json({ error: 'Forbidden' });

  const key = process.env.DATA_GO_KR_KEY;
  const today = new Date();
  const dateStr = today.getFullYear() + String(today.getMonth()+1).padStart(2,'0') + String(today.getDate()).padStart(2,'0');

  const results = await Promise.all(OBS_CODES.map(async function(code){
    try{
      const url = `https://apis.data.go.kr/1192136/surveyWaterTemp/GetSurveyWaterTempApiService?serviceKey=${key}&type=json&numOfRows=5&pageNo=1&ObsCode=${code}&Date=${dateStr}`;
      const r = await fetch(url);
      const json = await r.json();
      const items = json?.response?.body?.items?.item;
      const hasData = items && (Array.isArray(items) ? items.length>0 : true);
      return { obsCode: code, hasData: !!hasData, sample: hasData ? (Array.isArray(items)?items[0]:items) : null };
    }catch(e){
      return { obsCode: code, hasData: false, error: String(e) };
    }
  }));

  res.status(200).json({ dateChecked: dateStr, results });
}
