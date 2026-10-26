// Lab 4.5 · หาวันที่ยอดขายผิดปกติ
import { addDays } from "../../lab3/time.js";

export const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

const dow = (ymd) => new Date(ymd + "T00:00:00Z").getUTCDay();

/**
 * คะแนนความผิดปกติ = ln((จริง + SMOOTH) / (คาดหวัง + SMOOTH))
 */
export function scoreAnomalies(daily, holidays = {}, { weeks = 8, minWeeks = 4, smooth = 1000 } = {}) {
  const byBranch = new Map();
  for (const r of daily) {
    if (!byBranch.has(r.branch)) byBranch.set(r.branch, []);
    byBranch.get(r.branch).push(r);
  }

  const results = [];

  for (const [branch, records] of byBranch.entries()) {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const curDow = dow(cur.date);

      const minDate = addDays(cur.date, -weeks * 7);
      const past = sorted.slice(0, i).filter((r) => r.date >= minDate && dow(r.date) === curDow);

      if (past.length < minWeeks) continue;

      const pastRevs = past.map((p) => p.revenue);
      const expected = median(pastRevs);
      const actual = cur.revenue;
      const score = Math.log((actual + smooth) / (expected + smooth));
      const change = expected > 0 ? actual / expected - 1 : 0;
      const holiday = holidays[cur.date] || null;

      results.push({
        date: cur.date,
        branch,
        actual,
        expected,
        change,
        score,
        holiday,
      });
    }
  }

  return results.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
}

/** อันดับวันผิดปกติที่ควรตรวจสอบ (ไม่รวมวันหยุด) */
export function topAnomalies(daily, holidays = {}, n = 15, opts) {
  return scoreAnomalies(daily, holidays, opts).filter((a) => !a.holiday).slice(0, n);
}
