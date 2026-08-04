export default async function handler(req, res) {
  const { obs_post_id, date } = req.query;
  const key = process.env.DATA_GO_KR_KEY;
  const url = `https://apis.data.go.kr/1192136/tideFcstTime/GetTideFcstTimeApiService?serviceKey=${key}&type=json&numOfRows=30&pageNo=1&obsCode=${obs_post_id}&reqDate=${date}&min=60`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
