#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parse PDF bộ đề trắc nghiệm (format lộn xộn) -> JSON.

Hỗ trợ các tình huống:
- "Câu 1:" / "Câu 1." / "Câu 1" (thiếu dấu :) vẫn nhận.
- Đáp án đúng đánh dấu kiểu "(b)", "(c)"... ở cuối dòng phương án.
- Có câu chỉ 3 đáp án (a,b,c) -> sẽ pad thêm "" cho d nếu bật --pad-to-4.
- Một số câu bị đánh số trùng (ví dụ 26, 96, 131...) -> id sẽ tự thêm hậu tố _2, _3...
- Phương án có thể nằm cùng dòng hoặc xuống dòng.

Output mỗi câu theo schema:
{
  "id": "boA_1",
  "chapter": "boA",
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "answerIndex": 1
}

Lưu ý: answerIndex là **0-based**: a=0, b=1, c=2, d=3.
"""

import argparse
import json
import re
from collections import defaultdict

def extract_text_pdfplumber(pdf_path: str) -> str:
    try:
        import pdfplumber
    except Exception as e:
        raise RuntimeError("Thiếu thư viện pdfplumber. Cài: pip install pdfplumber") from e

    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for p in pdf.pages:
            pages.append(p.extract_text() or "")
    return "\n".join(pages)

def normalize_text(text: str) -> str:
    lines = []
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        # bỏ một số dòng rác hay gặp
        if re.search(r"Downlloaded by|Downloaded by", s, re.I):
            continue
        if re.match(r"^\d+\s*$", s):
            continue
        if re.search(r"^300 CÂU HỎI TRẮC NGHIỆM", s, re.I):
            continue
        if re.search(r"^KÈM ĐÁP ÁN", s, re.I):
            continue
        lines.append(s)

    text = "\n".join(lines)
    # nối từ bị ngắt dòng kiểu "triết-\nhọc"
    text = re.sub(r"([A-Za-zÀ-ỹ])-\n([A-Za-zÀ-ỹ])", r"\1\2", text)
    # gom nhiều space
    text = re.sub(r"[ \t]+", " ", text)
    return text

def split_question_blocks(text: str):
    # đưa mọi "Câu <num>" về đầu dòng để dễ split
    text = re.sub(r"(?<!\n)(Câu\s*\d+\b)", r"\n\1", text, flags=re.IGNORECASE)
    pattern = re.compile(r"(?im)^Câu\s*(\d+)\b(?:\s*[:\.])?\s*")
    matches = list(pattern.finditer(text))
    blocks = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        blocks.append(text[start:end].strip())
    return blocks

# Option label: a. / b) ... nhưng tránh match vào "(b)" là marker đáp án
OPT_PAT = re.compile(r"(?i)(?<![A-Za-zÀ-ỹ0-9\(\[])([a-z])\s*[\.\)]\s+")

def parse_block(block: str):
    m = re.match(r"(?is)Câu\s*(\d+)\b(?:\s*[:\.])?\s*(.*)$", block)
    if not m:
        return None
    qnum = int(m.group(1))
    body = m.group(2).strip()

    matches = list(OPT_PAT.finditer(body))
    options = {}
    answer_letter = None

    if matches:
        question_text = body[:matches[0].start()].strip()
        for i, mm in enumerate(matches):
            label = mm.group(1).lower()
            seg_start = mm.end()
            seg_end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
            seg = body[seg_start:seg_end].strip()

            # lấy marker đáp án kiểu "(b)" - ưu tiên marker cuối cùng trong segment
            ans_ms = re.findall(r"\(([a-z])\)", seg, flags=re.I)
            if ans_ms:
                answer_letter = ans_ms[-1].lower()
                seg = re.sub(r"\(([a-z])\)", "", seg, flags=re.I).strip()

            seg = re.sub(r"\s+", " ", seg).strip()
            options[label] = seg
    else:
        question_text = body.strip()

    # fallback: marker có thể nằm đâu đó trong body
    if answer_letter is None:
        ans_ms = re.findall(r"\(([a-z])\)", body, flags=re.I)
        if ans_ms:
            answer_letter = ans_ms[-1].lower()

    question_text = re.sub(r"\s+", " ", question_text).strip()
    question_text = re.sub(r"\s+[a-z]\.\s*$", "", question_text, flags=re.I).strip()

    return qnum, question_text, options, answer_letter

def build_items(parsed_blocks, chapter: str, pad_to_4: bool):
    occ = defaultdict(int)
    items = []

    for qnum, qtext, opts, ans in parsed_blocks:
        occ[qnum] += 1
        suffix = f"_{occ[qnum]}" if occ[qnum] > 1 else ""

        if pad_to_4:
            letters = ["a", "b", "c", "d"]
            options = [opts.get(l, "") for l in letters]
        else:
            letters_sorted = sorted(opts.keys(), key=lambda x: ord(x) - ord("a"))
            options = [opts[l] for l in letters_sorted]

        answerIndex = (ord(ans) - ord("a")) if ans else None

        items.append({
            "id": f"{chapter}_{qnum}{suffix}",
            "chapter": chapter,
            "question": qtext,
            "options": options,
            "answerIndex": answerIndex
        })

    return items

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="Đường dẫn file PDF")
    ap.add_argument("--output", required=True, help="Đường dẫn JSON output")
    ap.add_argument("--chapter", default="boA", help="Giá trị field chapter (vd: ch1/ch2/boA)")
    ap.add_argument("--pad-to-4", action="store_true", help="Pad options về đúng 4 phần tử a,b,c,d (thiếu thì '')")
    args = ap.parse_args()

    raw = extract_text_pdfplumber(args.input)
    text = normalize_text(raw)
    blocks = split_question_blocks(text)

    parsed = []
    for b in blocks:
        r = parse_block(b)
        if r and r[2]:
            parsed.append(r)

    items = build_items(parsed, chapter=args.chapter, pad_to_4=args.pad_to_4)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"OK: parsed {len(items)} questions -> {args.output}")

if __name__ == "__main__":
    main()
