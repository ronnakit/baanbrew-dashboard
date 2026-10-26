// Lab 2.2 · ซ่อมกราฟทั้ง 5 รูปแบบ
import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, LabelList, Cell,
} from "recharts";
import {
  revenueByProduct, monthlyRevenue, branchPerformance, weeklyRevenue,
  thaiMonth, daysInMonth,
} from "./lab2Metrics.js";
import { dailyRevenue, withMovingAverage, fmtBaht, fmtShortBaht, fmtNum } from "../lib/metrics.js";

const COFFEE = "#6B3E26";
const LEAF = "#2F7D5B";
const MUTED = "#78716c";

/** กราฟ 1 ซ่อมแล้ว: แสดง Top 10 เมนูขายดีที่สุดด้วย Horizontal Bar แทน Pie Chart 40 สี */
export function FixedChart1({ rows, products }) {
  const data = useMemo(() => {
    const list = revenueByProduct(rows, products);
    return list.slice(0, 10);
  }, [rows, products]);

  const top10Share = useMemo(() => {
    const totalShare = data.reduce((s, d) => s + d.share, 0);
    return (totalShare * 100).toFixed(1);
  }, [data]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 text-xs font-medium text-stone-700 bg-stone-100 p-2 rounded">
        💡 <strong>ข้อสรุป:</strong> เมนู Top 10 ทำรายได้รวมกันถึง {top10Share}% ของยอดขายทั้งร้าน (อันดับ 1 คือ {data[0]?.name})
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...data].reverse()} layout="vertical" margin={{ top: 5, right: 70, left: 20, bottom: 5 }}>
            <CartesianGrid stroke="#eee" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtShortBaht} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#444" }} />
            <Tooltip formatter={(v, _, item) => [`${fmtBaht(v)} (${(item.payload.share * 100).toFixed(1)}%)`, "ยอดขาย"]} />
            <Bar dataKey="revenue" fill={COFFEE} radius={[0, 4, 4, 0]}>
              <LabelList dataKey="revenue" position="right" formatter={fmtShortBaht} style={{ fontSize: 11, fill: "#444" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** กราฟ 2 ซ่อมแล้ว: แกน Y เริ่มที่ 0 เสมอ ไม่หลอกตาว่าสยามขายได้มากกว่าอารีย์เป็นสิบเท่า */
export function FixedChart2({ rows }) {
  const data = useMemo(() => branchPerformance(rows).sort((a, b) => b.revenue - a.revenue), [rows]);

  const ratio = useMemo(() => {
    if (data.length < 2) return 1;
    return (data[0].revenue / data[data.length - 1].revenue).toFixed(1);
  }, [data]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 text-xs font-medium text-stone-700 bg-stone-100 p-2 rounded">
        💡 <strong>ข้อสรุป:</strong> ยอดขายสยามสูงกว่าอารีย์จริงเพียง {ratio} เท่า (ไม่ได้ต่างกันมหาศาลเหมือนกราฟที่ตัดทอนแกน Y)
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid stroke="#eee" vertical={false} />
            <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, "auto"]} tickFormatter={fmtShortBaht} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [fmtBaht(v), "ยอดขายรวม"]} />
            <Bar dataKey="revenue" fill={LEAF} radius={[4, 4, 0, 0]}>
              <LabelList dataKey="revenue" position="top" formatter={fmtShortBaht} style={{ fontSize: 11, fill: "#444" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** กราฟ 3 ซ่อมแล้ว: กราฟแนวโน้มรายสัปดาห์ / 7-Day Moving Average อ่านง่าย ไม่รก */
export function FixedChart3({ rows }) {
  const data = useMemo(() => weeklyRevenue(rows), [rows]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 text-xs font-medium text-stone-700 bg-stone-100 p-2 rounded">
        💡 <strong>ข้อสรุป:</strong> รวมยอดขายเป็นรายสัปดาห์ เห็นแนวโน้มการเติบโตอย่างมั่นคงโดยไม่ถูกสัญญาณรบกวน (Noise) บังตา
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} minTickGap={30} />
            <YAxis tickFormatter={fmtShortBaht} width={55} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [fmtBaht(v), "ยอดขายสัปดาห์"]} />
            <Line type="monotone" dataKey="revenue" stroke={COFFEE} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** กราฟ 4 ซ่อมแล้ว: เปรียบเทียบ "ยอดขายเฉลี่ยต่อวันในแต่ละเดือน" แก้ปัญหาเดือนล่าสุดมีแค่ 20 วัน */
export function FixedChart4({ rows }) {
  const data = useMemo(() => monthlyRevenue(rows), [rows]);
  const last = data[data.length - 1];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 text-xs font-medium text-stone-700 bg-stone-100 p-2 rounded">
        💡 <strong>ข้อสรุป:</strong> ยอดขายเฉลี่ยต่อวันของเดือน ก.ย. อยู่ที่ {fmtBaht(last?.perDay || 0)}/วัน (ยอดไม่ได้ตก แต่เดือนนี้มีข้อมูลแค่ {last?.days} วัน)
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickFormatter={thaiMonth} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtShortBaht} width={55} tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={thaiMonth}
              formatter={(v, _, item) => [
                `${fmtBaht(v)}/วัน (เก็บข้อมูล ${item.payload.days} วัน)`,
                "ยอดเฉลี่ยรายวัน",
              ]}
            />
            <Bar dataKey="perDay" fill={LEAF} radius={[4, 4, 0, 0]}>
              <LabelList dataKey="perDay" position="top" formatter={fmtShortBaht} style={{ fontSize: 10, fill: "#444" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** กราฟ 5 ซ่อมแล้ว: ประเมินผลงานสาขาอย่างเป็นธรรมด้วย "ยอดขายเฉลี่ยต่อวัน" */
export function FixedChart5({ rows }) {
  const data = useMemo(() => branchPerformance(rows).sort((a, b) => b.perDay - a.perDay), [rows]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 text-xs font-medium text-stone-700 bg-stone-100 p-2 rounded">
        💡 <strong>ข้อสรุป:</strong> เมื่อเทียบยอดเฉลี่ยต่อวัน สาขาอารีย์ทำผลงานได้ดีเป็นอันดับ 4 ({fmtBaht(data.find(d => d.branch === "อารีย์")?.perDay || 0)}/วัน) ไม่ใช่สาขาที่แย่ที่สุด
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 80, left: 10, bottom: 5 }}>
            <CartesianGrid stroke="#eee" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtShortBaht} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="branch" width={90} tick={{ fontSize: 12, fill: "#333" }} />
            <Tooltip formatter={(v, _, item) => [`${fmtBaht(v)}/วัน (เปิด ${item.payload.days} วัน)`, "ยอดเฉลี่ยต่อวัน"]} />
            <Bar dataKey="perDay" fill={COFFEE} radius={[0, 4, 4, 0]}>
              <LabelList dataKey="perDay" position="right" formatter={(v) => `${fmtBaht(v)}/วัน`} style={{ fontSize: 11, fill: "#333" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
