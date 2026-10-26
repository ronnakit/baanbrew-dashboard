// Lab 3.2 · ตรวจฟอร์มและสร้างเอกสารยอดขายใหม่
import { nowBangkokISO } from "./time.js";

export const BRANCHES = ["สยาม", "สีลม", "อารีย์", "บางนา", "มหาวิทยาลัย"];
export const PAYMENTS = ["QR พร้อมเพย์", "บัตรเครดิต", "เงินสด", "LINE MAN", "Grab"];
export const MAX_QTY = 20;

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * ตรวจฟอร์ม { branch, product_id, qty, payment_method, customer_id }
 * คืน {} ถ้าถูกต้อง หรือ { ชื่อฟิลด์: ข้อความภาษาไทย } ถ้าผิด
 */
export function validateSaleForm(form, products = []) {
  const errors = {};

  // ตรวจจำนวน qty
  const q = Number(form.qty);
  if (!Number.isInteger(q) || q < 1 || q > MAX_QTY) {
    errors.qty = `จำนวนต้องเป็นจำนวนเต็ม 1–${MAX_QTY}`;
  }

  // ตรวจสาขา
  if (!BRANCHES.includes(form.branch)) {
    errors.branch = "สาขาไม่มีอยู่ในระบบ";
  }

  // ตรวจเมนู
  const found = products.some((p) => p.product_id === form.product_id);
  if (!found) {
    errors.product_id = "เมนูไม่มีอยู่ในระบบ";
  }

  // ตรวจรหัสสมาชิก (ว่างได้ แต่ถ้าใส่ต้องขึ้นต้นด้วย C ตามด้วยตัวเลข 5 หลัก)
  const cid = form.customer_id ? form.customer_id.trim() : "";
  if (cid !== "") {
    if (!/^[Cc]\d{5}$/.test(cid)) {
      errors.customer_id = "รหัสสมาชิกต้องขึ้นต้นด้วย C ตามด้วยตัวเลข 5 หลัก เช่น C01234";
    }
  }

  return errors;
}

/** เลขบิลจากเวลาไทย รูปแบบ WEB-YYYYMMDD-HHMMSS-XXXX (XXXX = ตัวเลข/อักษรพิมพ์ใหญ่สุ่ม 4 ตัว) */
export function makeOrderId(now = new Date(), rand = Math.random) {
  const iso = nowBangkokISO(now); // e.g. 2026-09-27T03:30:05+07:00
  const ymd = iso.slice(0, 10).replace(/-/g, "");
  const hms = iso.slice(11, 19).replace(/:/g, "");

  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rand() * CHARS.length);
    randomPart += CHARS[idx];
  }

  return `WEB-${ymd}-${hms}-${randomPart}`;
}

/**
 * สร้าง { id, data } จากฟอร์มที่ผ่านการตรวจแล้ว
 */
export function buildSale(form, product, { uid, now = new Date(), rand = Math.random }) {
  const dt = nowBangkokISO(now);
  const date = dt.slice(0, 10);
  const hour = Number(dt.slice(11, 13));

  const qty = Number(form.qty);
  const unitPrice = product.price;
  const revenue = qty * unitPrice;
  const orderId = makeOrderId(now, rand);

  const cid = form.customer_id ? form.customer_id.trim() : "";
  const customerId = cid !== "" ? cid.toUpperCase() : null;

  const isDelivery = form.payment_method === "LINE MAN" || form.payment_method === "Grab";
  const channel = isDelivery ? "เดลิเวอรี" : "หน้าร้าน";

  const data = {
    branch: form.branch,
    channel,
    created_by: uid,
    customer_id: customerId,
    date,
    datetime: dt,
    hour,
    order_id: orderId,
    payment_method: form.payment_method,
    product_id: form.product_id,
    qty,
    revenue,
    source: "web",
    unit_price: unitPrice,
  };

  return {
    id: `${orderId}-${form.product_id}`,
    data,
  };
}
