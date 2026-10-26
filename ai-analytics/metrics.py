"""ฟังก์ชันคำนวณตัวชี้วัดของบ้านสบาย ช็อป
นิยามตัวชี้วัดอยู่ใน CLAUDE.md
"""
from pathlib import Path
import pandas as pd

DATA = Path(__file__).resolve().parent.parent / "data"


def load_orders(path: Path | str = DATA / "orders.csv") -> pd.DataFrame:
    """อ่าน orders.csv แล้วเพิ่มคอลัมน์ที่ใช้บ่อย: net, unit_cost, gp, month, date"""
    df = pd.read_csv(path, encoding="utf-8-sig")

    # อ่าน products.csv เพื่อเอา unit_cost
    products_path = DATA / "products.csv"
    if products_path.exists():
        products = pd.read_csv(products_path, encoding="utf-8-sig")[["product_id", "unit_cost"]]
        df = df.merge(products, on="product_id", how="left")
    else:
        df["unit_cost"] = 0.0

    df["date"] = df["order_datetime"].astype(str).str[:10]
    df["month"] = df["order_datetime"].astype(str).str[:7]

    is_success = df["status"] == "จัดส่งสำเร็จ"
    df["net"] = (df["qty"] * df["unit_price"] * (1 - df["discount_pct"] / 100)).where(is_success, 0.0)
    df["gp"] = (df["net"] - df["qty"] * df["unit_cost"]).where(is_success, 0.0)

    return df


def net_sales(df: pd.DataFrame) -> float:
    """ยอดขายสุทธิรวม (บาท)"""
    return float(df[df["status"] == "จัดส่งสำเร็จ"]["net"].sum())


def gross_profit(df: pd.DataFrame) -> float:
    """กำไรขั้นต้นรวม (บาท)"""
    return float(df[df["status"] == "จัดส่งสำเร็จ"]["gp"].sum())


def aov(df: pd.DataFrame) -> float:
    """ยอดขายสุทธิเฉลี่ยต่อคำสั่งซื้อที่จัดส่งสำเร็จ (บาท)"""
    succ = df[df["status"] == "จัดส่งสำเร็จ"]
    return float(succ["net"].sum() / len(succ)) if len(succ) > 0 else 0.0


def cancel_rate(df: pd.DataFrame) -> float:
    """อัตรายกเลิกของคำสั่งซื้อทั้งหมดใน df (เปอร์เซ็นต์ 0–100)"""
    return float((df["status"] == "ยกเลิก").sum() / len(df) * 100) if len(df) > 0 else 0.0


def monthly_sales(df: pd.DataFrame) -> pd.Series:
    """ยอดขายสุทธิรายเดือน index = 'YYYY-MM' เรียงตามเวลา"""
    succ = df[df["status"] == "จัดส่งสำเร็จ"]
    return succ.groupby("month")["net"].sum().sort_index()


def best_month(df: pd.DataFrame) -> str:
    """เดือนที่ยอดขายสุทธิสูงสุด ('YYYY-MM')"""
    s = monthly_sales(df)
    return str(s.idxmax())


def channel_share(df: pd.DataFrame, channel: str, start_month: str, end_month: str) -> float:
    """สัดส่วนยอดขายสุทธิของช่องทางในช่วงเดือน start_month..end_month (รวมทั้งสองเดือน) เป็นเปอร์เซ็นต์"""
    succ = df[(df["status"] == "จัดส่งสำเร็จ") & (df["month"] >= start_month) & (df["month"] <= end_month)]
    ch_net = succ[succ["channel"] == channel]["net"].sum()
    tot_net = succ["net"].sum()
    return float((ch_net / tot_net) * 100) if tot_net > 0 else 0.0


def rating_by_ship_bucket(df: pd.DataFrame) -> dict[str, float]:
    """คะแนนรีวิวเฉลี่ยตามระยะส่ง คืน dict คีย์ '1-2', '3-4', '5-6', '7+'"""
    valid = df.dropna(subset=["rating", "ship_days"])
    b12 = valid[(valid["ship_days"] >= 1) & (valid["ship_days"] <= 2)]["rating"].mean()
    b34 = valid[(valid["ship_days"] >= 3) & (valid["ship_days"] <= 4)]["rating"].mean()
    b56 = valid[(valid["ship_days"] >= 5) & (valid["ship_days"] <= 6)]["rating"].mean()
    b7p = valid[valid["ship_days"] >= 7]["rating"].mean()
    return {
        "1-2": float(b12),
        "3-4": float(b34),
        "5-6": float(b56),
        "7+": float(b7p),
    }


def top_province(df: pd.DataFrame, region: str) -> str:
    """จังหวัดที่มียอดขายสุทธิสูงสุดในภูมิภาคที่ระบุ"""
    succ = df[(df["status"] == "จัดส่งสำเร็จ") & (df["region"] == region)]
    return str(succ.groupby("province")["net"].sum().idxmax())


def avg_ship_days(df: pd.DataFrame, region: str | None = None, carrier: str | None = None,
                  start_date: str | None = None, end_date: str | None = None) -> float:
    """ระยะส่งเฉลี่ย (วัน) ตามตัวกรองที่ให้มา วันที่เป็น 'YYYY-MM-DD' และรวมทั้งสองวัน"""
    sub = df.dropna(subset=["ship_days"])
    if region:
        sub = sub[sub["region"] == region]
    if carrier:
        sub = sub[sub["carrier"] == carrier]
    if start_date:
        sub = sub[sub["date"] >= start_date]
    if end_date:
        sub = sub[sub["date"] <= end_date]
    return float(sub["ship_days"].mean()) if len(sub) > 0 else 0.0


def return_rate(df: pd.DataFrame, product_id: str | None = None,
                start_date: str | None = None, end_date: str | None = None) -> float:
    """อัตราคืนสินค้า (เปอร์เซ็นต์) ของสินค้าและช่วงวันที่ที่ระบุ"""
    sub = df
    if product_id:
        sub = sub[sub["product_id"] == product_id]
    if start_date:
        sub = sub[sub["date"] >= start_date]
    if end_date:
        sub = sub[sub["date"] <= end_date]
    ret_cnt = (sub["status"] == "คืนสินค้า").sum()
    return float((ret_cnt / len(sub)) * 100) if len(sub) > 0 else 0.0
