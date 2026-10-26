"""แบ่งเอกสารเป็น chunk พร้อม metadata (เวิร์กช็อป 1)

แต่ละ chunk เป็น dict ที่มีอย่างน้อย:
chunk_id ("<doc_id>#<ลำดับ>"), doc_id, title, section, status, effective_date, text
"""
import re
from rag.ingest import load_docs

MAX_CHARS = 600


def chunk_docs(docs: list[dict] | None = None, max_chars: int = MAX_CHARS) -> list[dict]:
    if docs is None:
        docs = load_docs()

    chunks = []

    for d in docs:
        doc_id = d["doc_id"]
        title = d.get("title", "")
        status = d.get("status", "active")
        effective_date = d.get("effective_date", "")
        body = d.get("body", "")

        # แบ่งตามหัวข้อ ##
        # หาตำแหน่งของ ## ใน body
        # ใช้ regex split โดยจับหัวข้อไว้ด้วย
        raw_sections = re.split(r"(?:^|\n)##\s+", body)

        chunk_idx = 1
        for sec in raw_sections:
            sec = sec.strip()
            if not sec:
                continue

            # ถ้าเป็นส่วนแรกก่อน ## แรก (เช่น # Title หรือบทนำ)
            if not body.startswith("## ") and sec == raw_sections[0] and "\n" in sec:
                first_line, _, rest = sec.partition("\n")
                if first_line.startswith("# "):
                    sec_title = first_line.replace("#", "").strip()
                    sec_text = rest.strip()
                else:
                    sec_title = "บทนำ"
                    sec_text = sec
            else:
                sec_lines = sec.split("\n", 1)
                sec_title = sec_lines[0].strip()
                sec_text = sec_lines[1].strip() if len(sec_lines) > 1 else ""

            full_text = f"{sec_title}\n{sec_text}".strip() if sec_text else sec_title

            # ถ้าขนาดยาวเกิน max_chars ให้แบ่งย่อยตามย่อหน้า
            if len(full_text) <= max_chars:
                sub_texts = [full_text]
            else:
                paragraphs = sec_text.split("\n\n")
                sub_texts = []
                cur = sec_title + "\n"
                for p in paragraphs:
                    p = p.strip()
                    if not p:
                        continue
                    if len(cur) + len(p) + 1 <= max_chars:
                        cur += ("\n" if cur.endswith("\n") else "\n\n") + p
                    else:
                        if cur.strip() != sec_title:
                            sub_texts.append(cur.strip())
                        # ถ้า paragraph เดียวยาวเกิน max_chars ให้ตัดเป็นท่อนๆ
                        if len(p) > max_chars:
                            for i in range(0, len(p), max_chars - 50):
                                sub_texts.append(p[i : i + max_chars - 50])
                            cur = sec_title + "\n"
                        else:
                            cur = sec_title + "\n" + p
                if cur.strip() and cur.strip() != sec_title:
                    sub_texts.append(cur.strip())

            for st in sub_texts:
                chunks.append({
                    "chunk_id": f"{doc_id}#{chunk_idx}",
                    "doc_id": doc_id,
                    "title": title,
                    "section": sec_title,
                    "status": status,
                    "effective_date": effective_date,
                    "text": st[:max_chars],
                })
                chunk_idx += 1

    return chunks


if __name__ == "__main__":
    cs = chunk_docs()
    print(len(cs), "chunks · ยาวสุด", max(len(c["text"]) for c in cs), "ตัวอักษร")
