// ฟังก์ชันคำนวณทั้งหมดของ Dashboard Lab 1
// 1 แถวใน sales.csv = 1 รายการสินค้าในบิล, ยอดขาย = qty × unit_price

/** แปลงแถวดิบจาก CSV เป็นตัวเลขและเพิ่มคอลัมน์ที่ใช้บ่อย */
export function prepareRows(rows) {
  return rows
    .filter((r) => r.order_id)
    .map((r) => {
      const qty = Number(r.qty);
      const unitPrice = Number(r.unit_price);
      return {
        ...r,
        qty,
        unitPrice,
        revenue: qty * unitPrice,
        date: r.datetime.slice(0, 10),
        hour: Number(r.datetime.slice(11, 13)),
      };
    });
}

/** KPI 4 ตัวหลัก */
export function computeKpis(rows) {
  const revenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const bills = new Set(rows.map((r) => r.order_id)).size; // นับบิลที่ไม่ซ้ำ
  const customers = new Set(rows.map((r) => r.customer_id).filter(Boolean)).size; // นับเฉพาะสมาชิก
  return {
    revenue,
    bills,
    avgPerBill: bills ? revenue / bills : 0,
    customers,
  };
}

/** ยอดขายรวมรายวัน เรียงตามวันที่ */
export function dailyRevenue(rows) {
  const map = new Map();
  for (const r of rows) map.set(r.date, (map.get(r.date) ?? 0) + r.revenue);
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));
}

/** ค่าเฉลี่ยเคลื่อนที่ 7 วัน */
export function withMovingAverage(series, key = "revenue", window = 7) {
  return series.map((d, i) => {
    const slice = series.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((s, x) => s + x[key], 0) / slice.length;
    return { ...d, ma: i >= window - 1 ? avg : null };
  });
}

/** ยอดขายแยกสาขา เรียงจากมากไปน้อย */
export function revenueByBranch(rows) {
  const map = new Map();
  for (const r of rows) {
    const cur = map.get(r.branch) ?? { branch: r.branch, revenue: 0, bills: new Set() };
    cur.revenue += r.revenue;
    cur.bills.add(r.order_id);
    map.set(r.branch, cur);
  }
  return [...map.values()]
    .map((b) => ({ ...b, bills: b.bills.size }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** จำนวนบิลตามชั่วโมงของวัน แยกตามสาขา (การบ้าน Lab 1) */
export function hourlyBillsByBranch(rows) {
  // หาชั่วโมงที่มีรายการขาย (เช่น 07:00 ถึง 20:00)
  const hourOrders = new Map(); // hour -> { total: Set, branches: Map(branch -> Set) }

  for (const r of rows) {
    const h = r.hour;
    if (!hourOrders.has(h)) {
      hourOrders.set(h, { total: new Set(), branches: new Map() });
    }
    const hData = hourOrders.get(h);
    hData.total.add(r.order_id);
    
    if (!hData.branches.has(r.branch)) {
      hData.branches.set(r.branch, new Set());
    }
    hData.branches.get(r.branch).add(r.order_id);
  }

  const hours = [...hourOrders.keys()].sort((a, b) => a - b);
  return hours.map((h) => {
    const hData = hourOrders.get(h);
    const row = {
      hour: `${String(h).padStart(2, "0")}:00`,
      total: hData.total.size,
    };
    for (const [branch, billSet] of hData.branches.entries()) {
      row[branch] = billSet.size;
    }
    return row;
  });
}

export const fmtBaht = (n) => "฿" + Math.round(n).toLocaleString("th-TH");
export const fmtBaht2 = (n) => "฿" + Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtNum = (n) => Number(n).toLocaleString("th-TH");
export const fmtShortBaht = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : `${n}`);
