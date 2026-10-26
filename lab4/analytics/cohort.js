// Lab 4.2 · Cohort retention รายเดือน
// cohort = เดือนแรกที่ลูกค้าสมาชิกซื้อ · retention[k] = สัดส่วนลูกค้าใน cohort ที่กลับมาซื้อในเดือนที่ k (k=0 คือเดือนแรก = 100%)

/** จำนวนเดือนจาก a ถึง b เช่น monthIndex("2025-11", "2026-02") = 3 */
export function monthIndex(a, b) {
  const [ya, ma] = a.split("-").map(Number);
  const [yb, mb] = b.split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

/**
 * @param rows  แถวยอดขาย (ไม่นับ customer_id ว่าง)
 * @param asOf  วันสุดท้ายของข้อมูล YYYY-MM-DD ใช้บอกว่าเดือนสุดท้ายข้อมูลไม่ครบหรือไม่
 * @returns {{ cohorts: {cohort, size, retention: number[]}[], lastMonth, lastMonthPartial, daysInLastMonth }}
 */
export function computeCohorts(rows, asOf) {
  const valid = rows.filter((r) => r.customer_id && r.customer_id.trim());

  const custFirstMonth = new Map();
  const custMonths = new Map();

  for (const r of valid) {
    const cid = r.customer_id.trim();
    const m = r.date.slice(0, 7);
    if (!custFirstMonth.has(cid) || m < custFirstMonth.get(cid)) {
      custFirstMonth.set(cid, m);
    }
    if (!custMonths.has(cid)) {
      custMonths.set(cid, new Set());
    }
    custMonths.get(cid).add(m);
  }

  const lastMonth = asOf.slice(0, 7);
  const daysInLastMonth = Number(asOf.slice(8, 10));
  const [y, m] = asOf.slice(0, 7).split("-").map(Number);
  const daysInCal = new Date(y, m, 0).getDate();
  const lastMonthPartial = daysInLastMonth < daysInCal;

  // จัดกลุ่มตามเดือนแรก
  const cohortMap = new Map();
  for (const [cid, firstM] of custFirstMonth.entries()) {
    if (!cohortMap.has(firstM)) cohortMap.set(firstM, []);
    cohortMap.get(firstM).push(cid);
  }

  const sortedCohorts = [...cohortMap.keys()].sort();
  const cohorts = sortedCohorts.map((cMonth) => {
    const members = cohortMap.get(cMonth);
    const size = members.length;
    const numMonths = monthIndex(cMonth, lastMonth) + 1;
    const retention = [];

    for (let k = 0; k < numMonths; k++) {
      let active = 0;
      for (const cid of members) {
        const activeMSet = custMonths.get(cid);
        // หาว่ามีเดือนไหนที่ห่างจาก cMonth เท่ากับ k เดือนหรือไม่
        let hasK = false;
        for (const actM of activeMSet) {
          if (monthIndex(cMonth, actM) === k) {
            hasK = true;
            break;
          }
        }
        if (hasK) active++;
      }
      retention.push(size > 0 ? active / size : 0);
    }

    return {
      cohort: cMonth,
      size,
      retention,
    };
  });

  return {
    cohorts,
    lastMonth,
    lastMonthPartial,
    daysInLastMonth,
  };
}
