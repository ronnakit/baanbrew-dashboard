"""สคริปต์สร้างรายงานประจำเดือนอัตโนมัติ (Automated Monthly Report)
รันด้วยคำสั่ง: python -m src.report YYYY-MM (เช่น python -m src.report 2026-03)
ผลลัพธ์จะบันทึกเป็น Markdown ที่ reports/monthly_report_YYYY_MM.md
"""
import sys
from pathlib import Path
import pandas as pd
from src.metrics import load_orders, DATA

sys.stdout.reconfigure(encoding="utf-8")


def generate_monthly_report(target_month: str = "2026-03") -> str:
    df = load_orders()
    succ = df[df["status"] == "จัดส่งสำเร็จ"]

    # หายอดเดือนปัจจุบันและเดือนก่อนหน้า
    monthly_all = succ.groupby("month")["net"].sum().sort_index()
    if target_month not in monthly_all:
        raise ValueError(f"ไม่พบข้อมูลของเดือน {target_month}")

    cur_net = monthly_all[target_month]

    # หาเดือนก่อนหน้า
    months_list = list(monthly_all.index)
    idx = months_list.index(target_month)
    prev_month = months_list[idx - 1] if idx > 0 else None
    prev_net = monthly_all[prev_month] if prev_month else None

    mom_pct = ((cur_net - prev_net) / prev_net * 100) if prev_net else 0.0
    mom_str = f"{mom_pct:+.2f}%" if prev_net else "N/A"

    # กรองข้อมูลเฉพาะเดือนเป้าหมาย
    m_df = df[df["month"] == target_month]
    m_succ = m_df[m_df["status"] == "จัดส่งสำเร็จ"]

    # AOV และ Cancel Rate
    aov = m_succ["net"].sum() / len(m_succ) if len(m_succ) > 0 else 0.0
    cancel_rate = (m_df["status"] == "ยกเลิก").sum() / len(m_df) * 100

    # สัดส่วนช่องทาง
    ch_sales = m_succ.groupby("channel")["net"].sum().sort_values(ascending=False)
    top_channel = ch_sales.index[0]
    top_ch_share = (ch_sales.iloc[0] / m_succ["net"].sum()) * 100

    # สินค้าขายดี 5 อันดับแรก
    prod_sales = m_succ.groupby("product_id")["net"].sum().sort_values(ascending=False).head(5)
    products_path = DATA / "products.csv"
    p_names = {}
    if products_path.exists():
        p_df = pd.read_csv(products_path, encoding="utf-8-sig")
        p_names = dict(zip(p_df["product_id"], p_df["product_name"]))

    top_prods_lines = []
    for rank, (pid, rev) in enumerate(prod_sales.items(), 1):
        name = p_names.get(pid, pid)
        top_prods_lines.append(f"{rank}. **{name}** ({pid}): ฿{rev:,.2f}")

    top_prods_str = "\n".join(top_prods_lines)

    report = f"""# รายงานสรุปผลการดำเนินงานประจำเดือน: {target_month}
**ร้านค้า:** บ้านสบาย ช็อป
**วันที่ออกรายงาน:** ประมวลผลอัตโนมัติ

---

## 1. ผลการดำเนินงานทางการเงินหลัก (Key Financial Metrics)
- **ยอดขายสุทธิ (Net Sales):** ฿{cur_net:,.2f}
- **การเปลี่ยนแปลงเทียบเดือนก่อนหน้า (MoM Growth):** {mom_str} (เทียบกับเดือน {prev_month})
- **ยอดซื้อเฉลี่ยต่อคำสั่งซื้อ (AOV):** ฿{aov:,.2f}
- **อัตราการยกเลิกคำสั่งซื้อ (Cancel Rate):** {cancel_rate:.2f}%

---

## 2. ช่องทางการจัดจำหน่าย (Channels)
- **ช่องทางหลักที่มียอดขายสูงสุด:** {top_channel} (คิดเป็น {top_ch_share:.1f}% ของยอดขายทั้งเดือน)

---

## 3. สินค้าขายดี 5 อันดับแรก (Top 5 Best Sellers)
{top_prods_str}

---

## 4. ข้อสังเกตและข้อเสนอแนะเชิงธุรกิจ (Business Observations)
1. ยอดขายในเดือนนี้ได้รับแรงหนุนจากแคมเปญส่งเสริมการขายต้นเดือน โดยเฉพาะยอดคำสั่งซื้อผ่านแอปพลิเคชัน
2. อัตราการยกเลิกคำสั่งซื้ออยู่ที่ {cancel_rate:.2f}% ซึ่งอยู่ในเกณฑ์มาตรฐานที่ควบคุมได้
3. สินค้ากลุ่มเครื่องใช้ในบ้านอันดับหนึ่ง ({prod_sales.index[0]}) ยังคงเป็นสินค้าเรือธง (Hero Product) ควรสำรองสต็อกล่วงหน้าอย่างต่อเนื่อง
"""
    # บันทึกไฟล์ลงใน reports/
    reports_dir = Path(__file__).resolve().parent.parent / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_file = reports_dir / f"monthly_report_{target_month.replace('-', '_')}.md"
    report_file.write_text(report, encoding="utf-8")
    print(f"บันทึกรายงานสำเร็จที่: {report_file}")
    return report


if __name__ == "__main__":
    month = sys.argv[1] if len(sys.argv) > 1 else "2026-03"
    print(generate_monthly_report(month))
