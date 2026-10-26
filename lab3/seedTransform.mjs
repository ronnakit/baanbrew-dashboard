// Lab 3.1 · แปลงแถวจาก sales.csv เป็นเอกสาร Firestore
import { addDays, daysBetween } from "../src/lab3/time.js";

export const BRANCHES = ["สยาม", "สีลม", "อารีย์", "บางนา", "มหาวิทยาลัย"];

/**
 * เลือกเฉพาะ N วันล่าสุดของข้อมูล นับจากวันล่าสุดในไฟล์ (ไม่ใช่วันนี้) รวมวันสุดท้ายด้วย
 * @returns {{ rows: object[], start: string, end: string }}  start/end เป็น YYYY-MM-DD
 */
export function selectLastDays(rows, days) {
  const dates = [...new Set(rows.map((r) => (r.datetime ? r.datetime.slice(0, 10) : r.date)))].sort();
  if (dates.length === 0) {
    return { rows: [], start: "", end: "" };
  }
  const end = dates[dates.length - 1];
  const startIndex = Math.max(0, dates.length - days);
  const start = dates[startIndex];

  const filtered = rows.filter((r) => {
    const d = r.datetime ? r.datetime.slice(0, 10) : r.date;
    return d >= start && d <= end;
  });

  return { rows: filtered, start, end };
}

/** จำนวนวันที่ต้องเลื่อน ให้วันล่าสุดของข้อมูลกลายเป็น "เมื่อวาน" ของ today · ห้ามติดลบ */
export function computeShift(lastDataDate, today) {
  const yesterday = addDays(today, -1);
  const diff = daysBetween(lastDataDate, yesterday);
  return Math.max(0, diff);
}

/** เลื่อนวันที่ใน datetime ("2026-09-20T16:05:09+07:00") ไป days วัน โดยคงเวลาและ +07:00 */
export function shiftDateTime(iso, days) {
  if (!days) return iso;
  const datePart = iso.slice(0, 10);
  const timePart = iso.slice(10);
  const newDate = addDays(datePart, days);
  return `${newDate}${timePart}`;
}

/**
 * แปลง 1 แถว CSV (ทุกค่าเป็นข้อความ) เป็น { id, data }
 * id = order_id + "-" + product_id
 */
export function toSaleDoc(row, shiftDays = 0) {
  // ตรวจสอบความสะอาดของข้อมูล
  const qtyNum = Number(row.qty);
  if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
    throw new Error(`qty ไม่ถูกต้อง: ${row.qty}`);
  }

  // unit_price ต้องเป็นตัวเลขบวก และไม่มีข้อความปน
  if (typeof row.unit_price !== "string" || row.unit_price.trim() === "" || isNaN(Number(row.unit_price))) {
    throw new Error(`unit_price ไม่ใช่ตัวเลข: ${row.unit_price}`);
  }
  const priceNum = Number(row.unit_price);
  if (priceNum <= 0) {
    throw new Error(`unit_price ต้องมากกว่า 0: ${row.unit_price}`);
  }

  // ตรวจสอบชื่อสาขา
  if (!BRANCHES.includes(row.branch)) {
    throw new Error(`สาขาไม่อยู่ในรายการมาตรฐาน: ${row.branch}`);
  }

  // ตรวจสอบ datetime format: 20YY-MM-DDTHH:MM:SS+07:00
  const dtRegex = /^20\d\d-[0-1]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\+07:00$/;
  if (!row.datetime || !dtRegex.test(row.datetime)) {
    throw new Error(`datetime ไม่ถูกต้องตามมาตรฐาน: ${row.datetime}`);
  }

  // เลื่อนวันที่ถ้ามี shiftDays
  const dt = shiftDays ? shiftDateTime(row.datetime, shiftDays) : row.datetime;
  const date = dt.slice(0, 10);
  const hour = Number(dt.slice(11, 13));

  const customerId = row.customer_id && row.customer_id.trim() ? row.customer_id.trim() : null;

  return {
    id: `${row.order_id}-${row.product_id}`,
    data: {
      order_id: row.order_id,
      datetime: dt,
      date,
      hour,
      branch: row.branch,
      product_id: row.product_id,
      qty: qtyNum,
      unit_price: priceNum,
      revenue: qtyNum * priceNum,
      customer_id: customerId,
      payment_method: row.payment_method,
      channel: row.channel,
      source: "import",
    },
  };
}

/** สรุป: { docs, bills (นับ order_id ไม่ซ้ำ), revenue, byBranch: {สาขา: ยอด}, start, end } */
export function summarize(docs) {
  const bills = new Set();
  let revenue = 0;
  const byBranch = {};
  for (const b of BRANCHES) byBranch[b] = 0;

  let minDate = null;
  let maxDate = null;

  for (const doc of docs) {
    const d = doc.data;
    bills.add(d.order_id);
    revenue += d.revenue;
    byBranch[d.branch] = (byBranch[d.branch] ?? 0) + d.revenue;

    if (!minDate || d.date < minDate) minDate = d.date;
    if (!maxDate || d.date > maxDate) maxDate = d.date;
  }

  return {
    docs: docs.length,
    bills: bills.size,
    revenue,
    byBranch,
    start: minDate ?? "",
    end: maxDate ?? "",
  };
}
