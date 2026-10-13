// 공공데이터포털 '식품의약품안전처_식품영양성분DB정보'를 대신 호출해 주는 서버 함수예요.
// 인증키는 Vercel 환경변수(FOODSAFETY_KEY)에만 있고, 브라우저로는 절대 보내지 않아요.

const ENDPOINT = "https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo03/getFoodNtrCpntDbInq03";

module.exports = async (req, res) => {
  const key = process.env.FOODSAFETY_KEY;
  if (!key) {
    return res.status(500).json({ error: "서버에 인증키가 설정되지 않았어요. Vercel의 Environment Variables에 FOODSAFETY_KEY를 넣고 다시 배포해 주세요." });
  }

  const name = String(req.query.name || "").trim().slice(0, 100);
  const page = Math.max(1, parseInt(req.query.page || "1", 10) || 1);
  const rows = Math.min(100, Math.max(1, parseInt(req.query.rows || "50", 10) || 50));

  const params = new URLSearchParams({ serviceKey: key, type: "json", pageNo: String(page), numOfRows: String(rows) });
  if (name) params.set("FOOD_NM_KR", name);

  const hide = (t) => String(t).split(key).join("<인증키>");
  let text = "", status = 0;
  try {
    const r = await fetch(`${ENDPOINT}?${params}`, { signal: AbortSignal.timeout(25000) });
    status = r.status;
    text = await r.text();
  } catch (e) {
    return res.status(502).json({ error: `공공데이터포털 서버에 연결하지 못했어요. (${e && e.name ? e.name : "연결 실패"})` });
  }

  let data;
  try { data = JSON.parse(text); }
  catch {
    // 인증키 오류 등은 XML이나 일반 글자로 올 때가 많아요.
    return res.status(502).json({
      error: `공공데이터포털이 JSON이 아닌 응답을 보냈어요 (상태 ${status}). 인증키가 이 API(식품영양성분DB정보)용인지, 활용신청이 승인됐는지 확인해 주세요.`,
      preview: hide(text.replace(/\s+/g, " ").slice(0, 300)),
    });
  }

  const header = data?.header || data?.response?.header || {};
  const body = data?.body || data?.response?.body || {};
  if (header.resultCode === "03") return res.status(200).json({ total: 0, rows: [] }); // 검색 결과 없음
  if (header.resultCode && header.resultCode !== "00") {
    return res.status(502).json({ error: `${header.resultMsg || "요청 오류"} (코드 ${header.resultCode})` });
  }

  let items = body.items;
  if (items && !Array.isArray(items)) items = items.item;
  if (items && !Array.isArray(items)) items = [items];

  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
  return res.status(200).json({ total: parseInt(body.totalCount || "0", 10), rows: items || [] });
};
