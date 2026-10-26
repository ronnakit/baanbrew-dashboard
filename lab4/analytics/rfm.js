// Lab 4.1 · RFM: แบ่งกลุ่มลูกค้าสมาชิกด้วย Recency, Frequency, Monetary
import { daysBetween } from "../../lab3/time.js";

/**
 * คะแนน 1–5 ตามตำแหน่งเปอร์เซ็นไทล์ (ค่ามาก = คะแนนสูง)
 * ค่าที่เท่ากันต้องได้คะแนนเท่ากันเสมอ: score = 1 + floor(5 × จำนวนค่าที่ "น้อยกว่า" / n)
 */
export function percentileScores(values) {
  const n = values.length;
  return values.map((v) => {
    const countLessThan = values.filter((x) => x < v).length;
    return 1 + Math.floor((5 * countLessThan) / n);
  });
}

/** กติกาตั้งชื่อกลุ่ม ตรวจจากบนลงล่าง ข้อแรกที่ตรงคือคำตอบ */
export function segmentOf(r, f) {
  if (r >= 4 && f >= 4) return "Champions";
  if (r >= 3 && f >= 4) return "Loyal";
  if (r >= 4 && f <= 2) return "New";
  if (r <= 2 && f >= 3) return "At Risk";
  if (r <= 2) return "Lost";
  return "Need Attention";
}

export const SEGMENTS = [
  { id: "Champions", th: "ลูกค้าชั้นยอด", action: "ให้สิทธิพิเศษ ชวนลองเมนูใหม่ก่อนใคร" },
  { id: "Loyal", th: "ลูกค้าประจำ", action: "สะสมแต้ม/ขยับขึ้นเป็นชั้นยอด" },
  { id: "New", th: "ลูกค้าใหม่", action: "คูปองครั้งที่ 2 ภายใน 14 วัน" },
  { id: "Need Attention", th: "ต้องดูแล", action: "โปรฯ ตามเมนูที่เคยซื้อ" },
  { id: "At Risk", th: "เสี่ยงหาย", action: "ดึงกลับด่วน: เคยซื้อบ่อยแต่หายไปนาน" },
  { id: "Lost", th: "หายไปแล้ว", action: "ใช้งบน้อย ส่งข้อความครั้งเดียว" },
];

/**
 * @param rows   แถวยอดขาย (ไม่นับแถวที่ customer_id ว่าง)
 * @param asOf   วันที่วิเคราะห์ YYYY-MM-DD (ใช้วันล่าสุดของข้อมูล ไม่ใช่วันนี้)
 * @returns {{ customers: object[], segments: object[], asOf: string }}
 */
export function computeRfm(rows, asOf) {
  const validRows = rows.filter((r) => r.customer_id && r.customer_id.trim());
  const custMap = new Map();

  for (const r of validRows) {
    const cid = r.customer_id.trim();
    if (!custMap.has(cid)) {
      custMap.set(cid, { id: cid, lastDate: r.date, bills: new Set(), revenue: 0 });
    }
    const c = custMap.get(cid);
    if (r.date > c.lastDate) c.lastDate = r.date;
    c.bills.add(r.order_id);
    c.revenue += r.revenue;
  }

  const list = [...custMap.values()].map((c) => ({
    id: c.id,
    R: daysBetween(c.lastDate, asOf),
    F: c.bills.size,
    M: c.revenue,
  }));

  // r: ค่า R น้อย แปลว่ามาเร็วๆ นี้ ต้องได้คะแนน r สูง จึงส่ง -c.R
  const rScores = percentileScores(list.map((c) => -c.R));
  const fScores = percentileScores(list.map((c) => c.F));
  const mScores = percentileScores(list.map((c) => c.M));

  const customers = list.map((c, i) => {
    const r = rScores[i];
    const f = fScores[i];
    const m = mScores[i];
    return {
      ...c,
      r,
      f,
      m,
      segment: segmentOf(r, f),
    };
  });

  const totalRev = customers.reduce((sum, c) => sum + c.M, 0);
  const totalCust = customers.length;

  const segOrder = ["Champions", "Loyal", "New", "Need Attention", "At Risk", "Lost"];
  const segments = segOrder.map((segId) => {
    const group = customers.filter((c) => c.segment === segId);
    const segRev = group.reduce((sum, c) => sum + c.M, 0);
    return {
      segment: segId,
      customers: group.length,
      revenue: segRev,
      revenueShare: totalRev ? segRev / totalRev : 0,
      customerShare: totalCust ? group.length / totalCust : 0,
    };
  });

  return { customers, segments, asOf };
}
