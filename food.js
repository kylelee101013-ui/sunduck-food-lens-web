// 식품안전나라 API를 대신 호출해 주는 서버 함수예요.
// 인증키는 Vercel 환경변수(FOODSAFETY_KEY)에만 있고, 브라우저로는 절대 보내지 않아요.

const ALLOWED = {
  C002: ["PRDLST_NM", "PRDLST_DCNM", "BSSH_NM", "PRDLST_REPORT_NO"], // 품목제조보고 원재료
  I2790: ["DESC_KOR"],                                                // 식품영양성분 DB
};

module.exports = async (req, res) => {
  const key = process.env.FOODSAFETY_KEY;
  if (!key) {
    return res.status(500).json({ error: "서버에 인증키가 설정되지 않았어요. Vercel의 Environment Variables에 FOODSAFETY_KEY를 넣고 다시 배포해 주세요." });
  }

  const { svc } = req.query;
  if (!ALLOWED[svc]) return res.status(400).json({ error: "지원하지 않는 서비스예요." });

  const start = Math.max(1, parseInt(req.query.start || "1", 10) || 1);
  const end = Math.min(start + 999, Math.max(start, parseInt(req.query.end || "50", 10) || 50));
  const cond = ALLOWED[svc]
    .filter((f) => req.query[f])
    .map((f) => `${f}=${encodeURIComponent(String(req.query[f]).slice(0, 100))}`)
    .join("&");

  const url = `http://openapi.foodsafetykorea.go.kr/api/${key}/${svc}/json/${start}/${end}` + (cond ? `/${cond}` : "");

  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(502).json({ error: "식품안전나라 응답을 읽지 못했어요. 인증키가 이 서비스용인지 확인해 주세요." }); }

    const body = data[svc] || data;
    const code = body?.RESULT?.CODE || "";
    const msg = body?.RESULT?.MSG || "";
    if (code === "INFO-200") return res.status(200).json({ total: 0, rows: [] });
    if (code && code !== "INFO-000") return res.status(502).json({ error: `${msg} (코드 ${code})` });

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
    return res.status(200).json({ total: parseInt(body.total_count || "0", 10), rows: body.row || [] });
  } catch (e) {
    return res.status(502).json({ error: "식품안전나라 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요." });
  }
};
