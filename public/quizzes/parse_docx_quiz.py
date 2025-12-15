import pdfplumber
import re
import json
import argparse

# ========= REGEX =========
START_MARKER = "300 CÂU HỎI TRẮC NGHIỆM TRIẾT HỌC"
QUESTION_RE = re.compile(r"Câu\s*(\d+)\s*[:\.]", re.IGNORECASE)
OPTION_RE = re.compile(r"^[a-dA-D]\.\s*(.+)")
INLINE_ANSWER_RE = re.compile(r"\(([a-dA-D])\)")
ANSWER_PAIR_RE = re.compile(r"(\d+)\s*([A-Da-d])")

# ========= UTILS =========
def extract_lines(pdf_path):
    lines = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                lines.extend(l.strip() for l in txt.split("\n") if l.strip())
    return lines


def slice_from_start(lines):
    for i, l in enumerate(lines):
        if START_MARKER in l.upper():
            return lines[i+1:]
    raise RuntimeError("❌ Không tìm thấy phần 300 câu hỏi")


def extract_answer_key(lines):
    joined = " ".join(lines)
    pairs = ANSWER_PAIR_RE.findall(joined)
    return {int(n): a.upper() for n, a in pairs}


# ========= PARSE =========
def parse_questions(lines):
    questions = []
    current = None

    for line in lines:
        q = QUESTION_RE.match(line)
        if q:
            if current:
                questions.append(current)

            current = {
                "num": int(q.group(1)),
                "question": line[q.end():].strip(),
                "options": [],
                "inlineAnswer": None
            }
            continue

        if not current:
            continue

        opt = OPTION_RE.match(line)
        if opt:
            text = opt.group(1).strip()
            inline = INLINE_ANSWER_RE.search(text)
            if inline:
                current["inlineAnswer"] = inline.group(1).upper()
                text = INLINE_ANSWER_RE.sub("", text).strip()

            current["options"].append(text)
            continue

        # nối dòng gãy
        if len(current["options"]) == 0:
            current["question"] += " " + line

    if current:
        questions.append(current)

    return questions


def build_json(questions, answer_key, chapter):
    letter_to_idx = {"A": 0, "B": 1, "C": 2, "D": 3}
    result = []

    for q in questions:
        ans_letter = q["inlineAnswer"] or answer_key.get(q["num"])
        if not ans_letter:
            continue

        options = q["options"][:4]
        while len(options) < 4:
            options.append("")

        result.append({
            "id": f"{chapter}_{q['num']}",
            "chapter": chapter,
            "question": q["question"].strip(),
            "options": options,
            "answerIndex": letter_to_idx[ans_letter]
        })

    return result


# ========= MAIN =========
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf", help="PDF bộ đề")
    ap.add_argument("-o", "--output", default="bo_de_300_A.json")
    ap.add_argument("--chapter", default="ch1")
    args = ap.parse_args()

    lines = extract_lines(args.pdf)
    lines = slice_from_start(lines)

    answer_key = extract_answer_key(lines)
    questions = parse_questions(lines)
    result = build_json(questions, answer_key, args.chapter)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✔ Parsed {len(result)} câu hỏi")
    print(f"✔ Output: {args.output}")


if __name__ == "__main__":
    main()
