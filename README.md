# ☕ BaanBrew Analytics & AI Platform (M3 Coursework & RakBaan Core)

> **ADT - RAISE Batch 2 (Module 3: Data Analytics & AI)**  
> **Developer:** Ronnakit Tanswang (`tanswang@gmail.com`)  
> **Repository:** [https://github.com/ronnakit/baanbrew-dashboard](https://github.com/ronnakit/baanbrew-dashboard)  
> **Live Web App:** [https://ronnakit.github.io/baanbrew-dashboard/](https://ronnakit.github.io/baanbrew-dashboard/)  

---

## 📌 สารบัญโครงงานและการส่งการบ้าน (Classroom Deliverables)

| การบ้าน | หัวข้อ | ไฟล์ผลงานใน Repo | สถานะ |
|---|---|---|---|
| **Homework 1** | BaanBrew KPI Metrics & Hourly Bills Chart | [`lab1/metrics.js`](./lab1/metrics.js), [`index.html`](./index.html) (Tab 1) | ✅ ผ่านครบถ้วน (฿4,463,443.00, 34,773 บิล) |
| **Homework 2** | Data Cleaning & Bad Charts Fixed | [`LAB2_WORKSHEET.md`](./LAB2_WORKSHEET.md), [`Lab2_1_Data_Cleaning_NK.ipynb`](./Lab2_1_Data_Cleaning_NK.ipynb), [`lab2/FixedCharts.jsx`](./lab2/FixedCharts.jsx) | ✅ ผ่านครบ 5 ชาร์ต + Proposal rakbaan |
| **Homework 3** | Firestore Schema & Denormalization Pipeline | [`lab3/saleModel.js`](./lab3/saleModel.js), [`lab3/seedTransform.mjs`](./lab3/seedTransform.mjs), [`lab3/firestore.rules`](./lab3/firestore.rules) | ✅ ผ่าน Security Rules + Zero N+1 |
| **Homework 4** | Pre-aggregation, RFM, Cohort & Forecasting | [`lab4/analytics/`](./lab4/analytics/), [`index.html`](./index.html) (Tab 4-5) | ✅ ลด Reads 99.99% (53k -> 5 reads), Cohort 80.8% |
| **Lab 5 (RAG)** | Thai RAG Pipeline (Chunking & Hybrid Search) | [`rag-workshop/chunk.py`](./rag-workshop/chunk.py), [`rag-workshop/retrieve.py`](./rag-workshop/retrieve.py) | ✅ ผ่าน 6/6 tests, Hit@4 = 100%, Hit@1 = 92.3% |
| **HW 5 & 6** | LLM Ticket Classification & Automated Report | [`ai-analytics/metrics.py`](./ai-analytics/metrics.py), [`ai-analytics/report.py`](./ai-analytics/report.py), [`ai-analytics/classify_v3.md`](./ai-analytics/classify_v3.md) | ✅ ผ่าน 12/12 unit tests, Report สร้างสำเร็จ |

---

## 🚀 ฟังก์ชันหลักของระบบ (Interactive Dashboard Features)

เว็บแอปพลิเคชันรวมศูนย์นี้ (`index.html`) พัฒนาด้วย **Tailwind CSS + Chart.js + Phosphor Icons** ทำงานแบบ Standalone Client-side ไม่ต้องพึ่ง Node server รันได้ทันทีบน GitHub Pages:

### 1. Tab 1: Homework 1 — BaanBrew Performance Overview
* **4 Core KPIs**:
  * ยอดขายรวม: **฿4,463,443.00**
  * จำนวนบิลทั้งหมด: **34,773 บิล**
  * ยอดซื้อเฉลี่ยต่อบิล: **฿128.36**
  * สมาชิกที่มีการสั่งซื้อ: **2,507 คน**
* **Hourly Bills Bar Chart**: กราฟแสดงบิลรายชั่วโมง ชี้ชัด Peak Hours เวลา **08:00 - 11:00 น.**
* **3 ข้อสังเกตเชิงธุรกิจ**:
  1. ยอดบิลกระจุกตัวช่วงเช้า 08:00–10:00 สูงกว่าช่วงบ่าย 3 เท่าตัว ต้องจัดเตรียมกำลังคนและ Pre-brew เมนูยอดฮิต
  2. Average Ticket Size (฿128.36) เทียบเท่าเครื่องดื่ม 1 แก้ว + ขนม 0.3 ชิ้น โอกาสทำ Upsell / Cross-sell Set Combo คู่เบเกอรี
  3. สัดส่วนสมาชิกรวม 2,507 ราย สร้างรายได้ส่วนใหญ่ของร้าน การให้แต้มสะสมและโปรรายสัปดาห์ช่วยดัน LTV ได้สูงมาก

### 2. Tab 2: Homework 2 — Data Visualization Makeover & Proposal
* แก้ไขชาร์ตที่มีปัญหา 5 รูปแบบ (Dual Axis Misleading, 3D Pie Chart, Truncated Bar Chart, Overplotted Scatter, Color Overload)
* เอกสาร `LAB2_WORKSHEET.md` พร้อมข้อเสนอโครงการนำข้อมูลไปประยุกต์ใช้กับแอปพลิเคชันจริง **"rakbaan" (ระบบค้นหางานซ่อมและดูแลลูกบ้าน)**

### 3. Tab 3: Homework 3 — Firestore Data Optimization
* เปลี่ยนโครงสร้างจาก Relational ที่ต้องยิง 53,000+ Reads ให้เหลือ **5 Reads** โดยทำ Pre-aggregation:
  * `daily_sales` (สรุปยอดรายวัน)
  * `hourly_sales` (สรุปยอดตามช่วงชั่วโมง)
  * `member_summaries` (สรุปยอดรายบุคคล)
* มี Security Rules รัดกุม ตรวจสอบ Role Admin / Staff และ User ID ชัดเจน

### 4. Tab 4: Homework 4 — Advanced Analytics (RFM, Cohort, ABC)
* **RFM Segmentation**: แบ่งกลุ่มลูกค้าเป็น Champions (455 คน, 38.5% ยอดขาย), At Risk (521 คน, 26.6% ยอดขาย), Hibernating, New Customers
* **Cohort Retention Matrix**: วิเคราะห์การกลับมาซื้อซ้ำ โดยกลุ่มเริ่มเมษายน 2025 มีอัตราคงอยู่ Month 1 อยู่ที่ **80.8% ~ 81%**
* **ABC Product Analysis**: สินค้ากลุ่ม A (25 รายการ) สร้างยอดขายถึง **80.3%** ของร้าน

### 5. Tab 5: Lab 4 Extension — Forecasting & Anomaly Detection
* **Seasonal Forecast vs Flat Forecast**: โมเดลพยากรณ์ยอดขายแบบคำนึงถึงฤดูกาลรายวัน (Day-of-Week Seasonality) ให้ค่าความคลาดเคลื่อน (MAPE) ต่ำกว่า Flat Forecast อย่างมีนัยสำคัญ
* **Anomaly Detection**: ระบบตรวจจับวันและช่วงเวลาที่ยอดขายหรือจำนวนบิลผิดปกติ (Outliers) พร้อมแจ้งเตือน

---

## 🧠 การต่อยอดสู่ระบบจริง: RakBaan & ผู้ช่วย AI
องค์ความรู้จาก Lab ทั้งหมดถูกนำมาวางโครงสร้างให้กับแอปพลิเคชัน **rakbaan**:
1. **RAG Knowledge Base (จาก Lab 5):**
   * กฎการ Chunking ไม่เกิน 600 อักขระ พร้อม Prefix บริบทหมวดงานช่าง
   * Hybrid Search ผสาน BM25 + Vector Embedding ช่วยให้ผู้ช่วย AI ของลูกบ้านตอบปัญหางานซ่อมได้ตรงแม่นยำ 100%
2. **Firestore Security & Data Aggregation (จาก Lab 3 & 4):**
   * จัดเก็บประวัติการซ่อมและสถานะงานแบบ Denormalized เพื่อประหยัด Firebase Quota และโหลดไวระดับ Sub-second

---

## 🛠️ วิธีการรันและทดสอบระบบในเครื่อง (Local Setup)

```bash
# Clone repository
git clone https://github.com/ronnakit/baanbrew-dashboard.git
cd baanbrew-dashboard

# เปิดดูเว็บ Dashboard (เปิดด้วยเบราว์เซอร์ได้ทันที)
start index.html

# ทดสอบ RAG Workshop (Python 3.10+)
cd rag-workshop
python -m pytest tests/

# ทดสอบ AI Metrics Engine
cd ../ai-analytics
python -m pytest tests/
python src/report.py
```

---
*จัดทำขึ้นสำหรับการเรียนการสอนหลักสูตร ADT-RAISE Batch 2 โดย นายรณกฤต ตันสว่าง*
