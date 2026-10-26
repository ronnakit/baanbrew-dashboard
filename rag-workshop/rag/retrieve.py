"""ค้นคืน chunk ที่เกี่ยวข้องกับคำถาม (เวิร์กช็อป 2 และ 4) ทำงานในเครื่องทั้งหมด ไม่เรียก API

python -m rag.retrieve "คำถาม" -k 4 [--method tfidf|hybrid] [--include-superseded] [--json]
"""
import argparse
import json
import math
import re
from collections import Counter
from rag.chunk import chunk_docs


def _get_ngrams(text: str, n_range=(2, 4)):
    clean = re.sub(r"\s+", "", text.lower())
    grams = []
    for n in range(n_range[0], n_range[1] + 1):
        for i in range(len(clean) - n + 1):
            grams.append(clean[i : i + n])
    return grams


class Retriever:
    def __init__(self, chunks: list[dict] | None = None, method: str = "tfidf"):
        self.method = method
        self.chunks = chunk_docs() if chunks is None else chunks

        # คำนวณ IDF ของ n-grams
        self.df = Counter()
        self.chunk_data = []

        for c in self.chunks:
            full_str = f"{c.get('title', '')} {c.get('section', '')} {c.get('text', '')}"
            grams = _get_ngrams(full_str)
            g_counts = Counter(grams)
            g_set = set(g_counts.keys())
            self.chunk_data.append((c, g_set, g_counts))
            for g in g_set:
                self.df[g] += 1

        n_chunks = len(self.chunks)
        self.idf = {g: math.log((n_chunks + 1) / (self.df[g] + 1)) + 1 for g in self.df}

    def search(self, query: str, k: int = 4, include_superseded: bool = True) -> list[dict]:
        """คืน chunk k อันที่คะแนนสูงสุด เรียงจากมากไปน้อย แต่ละอันเพิ่มช่อง 'score'"""
        q_grams = Counter(_get_ngrams(query))
        q_tokens = [t for t in re.split(r"[\s\?]+", query) if len(t) >= 2]

        scored = []
        for c, g_set, c_counts in self.chunk_data:
            if not include_superseded and c.get("status") == "superseded":
                continue

            # TF-IDF พื้นฐาน
            score = sum(q_grams[g] * c_counts[g] * (self.idf.get(g, 1) ** 2) for g in q_grams if g in g_set)

            # Normalization และ Boosts
            if self.method == "hybrid":
                # ปรับตามความยาวข้อความเล็กน้อย
                text_len = len(c.get("text", ""))
                if text_len > 0:
                    score = score / (text_len ** 0.4)

                # Title & Section Boost
                title = c.get("title", "")
                section = c.get("section", "")
                for token in q_tokens:
                    if token in title:
                        score += 50.0
                    if token in section:
                        score += 80.0

                # เอกสาร active ได้คะแนนมากกว่า superseded ในโหมด hybrid
                if c.get("status") == "active":
                    score *= 1.25
            else:
                # โหมด tfidf ธรรมดา
                title = c.get("title", "")
                section = c.get("section", "")
                for token in q_tokens:
                    if token in title:
                        score += 10.0
                    if token in section:
                        score += 15.0

            result_chunk = dict(c)
            result_chunk["score"] = float(score)
            scored.append(result_chunk)

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:k]


def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("query", help="คำถามภาษาไทย")
    parser.add_argument("-k", type=int, default=4, help="จำนวน chunk ที่ต้องการ")
    parser.add_argument("--method", default="tfidf", choices=["tfidf", "hybrid"], help="วิธีการค้นคืน")
    parser.add_argument("--include-superseded", action="store_true", help="รวมเอกสารที่ยกเลิกแล้ว")
    parser.add_argument("--json", action="store_true", help="แสดงผลลัพธ์เป็น JSON")
    args = parser.parse_args()

    retriever = Retriever(method=args.method)
    results = retriever.search(args.query, k=args.k, include_superseded=args.include_superseded)

    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print(f"ผลการค้นหาสำหรับ: '{args.query}' ({len(results)} รายการ):")
        for i, r in enumerate(results, 1):
            status_tag = f"[{r['status']}]" if r.get("status") else ""
            print(f"\n{i}. {r['doc_id']} #{r['section']} (คะแนน: {r['score']:.2f}) {status_tag}")
            print(f"   {r['text'][:150]}...")


if __name__ == "__main__":
    main()
