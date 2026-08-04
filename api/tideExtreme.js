export default async function handler(req, res) {
  const { obs_post_id, date } = req.query;
  const key = process.env.DATA_GO_KR_KEY;
  const url = `https://apis.data.go.kr/1192136/tideFcstHghLw?serviceKey=${key}&ObsCode=${obs_post_id}&Date=${date}&resultType=json`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
