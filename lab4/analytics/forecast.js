// Lab 4.4 · พยากรณ์ยอดขายแบบอธิบายได้ และวัดความแม่นด้วยการย้อนทดสอบ (backtest)
import { addDays } from "../../lab3/time.js";

const dow = (ymd) => new Date(ymd + "T00:00:00Z").getUTCDay(); // 0 = อาทิตย์

/** ค่าเฉลี่ยยอดขายวันเดียวกันของสัปดาห์ K ครั้งล่าสุด (ฤดูกาลรายสัปดาห์) */
export function seasonalForecast(series, horizon, K = 8) {
  const lastDate = series[series.length - 1].date;
  return Array.from({ length: horizon }, (_, i) => {
    const d = addDays(lastDate, i + 1);
    const targetDow = dow(d);
    const matches = series.filter((s) => dow(s.date) === targetDow).slice(-K);
    const avg = matches.length > 0 ? matches.reduce((sum, s) => sum + s.revenue, 0) / matches.length : 0;
    return { date: d, forecast: avg };
  });
}

/** ค่าเฉลี่ย K วันล่าสุด เส้นตรง (ตัวเปรียบเทียบที่ไม่สนวันในสัปดาห์) */
export function flatForecast(series, horizon, K = 28) {
  const recent = series.slice(-K);
  const avg = recent.reduce((a, s) => a + s.revenue, 0) / recent.length;
  const last = series[series.length - 1].date;
  return Array.from({ length: horizon }, (_, i) => ({ date: addDays(last, i + 1), forecast: avg }));
}

/** Mean Absolute Percentage Error (%) · ข้ามวันที่ยอดจริงเป็น 0 เพราะหารไม่ได้ */
export function mape(actual, forecast) {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i++) {
    const act = actual[i];
    const fc = forecast[i];
    if (act > 0) {
      sum += Math.abs((act - fc) / act);
      count++;
    }
  }
  return count > 0 ? (sum / count) * 100 : 0;
}

/**
 * ย้อนทดสอบ: ซ่อน horizon วันสุดท้าย พยากรณ์จากข้อมูลก่อนหน้า แล้วเทียบกับของจริง
 */
export function backtest(series, horizon = 28, K = 8) {
  const train = series.slice(0, -horizon);
  const test = series.slice(-horizon);

  const sf = seasonalForecast(train, horizon, K);
  const ff = flatForecast(train, horizon);

  const actRevs = test.map((t) => t.revenue);
  const sfRevs = sf.map((s) => s.forecast);
  const ffRevs = ff.map((f) => f.forecast);

  const mapeSeasonal = mape(actRevs, sfRevs);
  const mapeFlat = mape(actRevs, ffRevs);

  return {
    test,
    seasonal: sf,
    flat: ff,
    mapeSeasonal,
    mapeFlat,
  };
}
