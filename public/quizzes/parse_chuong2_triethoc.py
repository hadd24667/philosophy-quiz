import pdfplumber
import re
import json

# ========= MARKERS =========
START_QUESTIONS = "TRẮC NGHIỆM CHƯƠNG 2"
START_ANSWERS = "ĐÁP ÁN"

# ========= REGEX =========
QUESTION_RE = re.compile(r"Câu\s*(\d+)\.\s*(.+)", re.IGNORECASE)
OPTION_RE = re.compile(r"^[A-D]\.\s*(.+)")
ANSWER_PAIR_RE = re.compile(r"(\d+)\s*([A-D])")

LETTER_TO_INDEX = {"A": 0, "B": 1, "C": 2, "D": 3}


# ========= UTILS =========
def extract_lines(pdf_path):
    lines = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                for line in text.split("\n"):
                    line = line.strip()
                    if line:
                        lines.append(line)
    return lines


def slice_between(lines, start_marker, stop_marker=None):
    start = None
    stop = None

    for i, l in enumerate(lines):
        if start is None and start_marker in l.upper():
            start = i + 1
        elif start is not None and stop_marker and stop_marker in l.upper():
            stop = i
            break

    if start is None:
        raise RuntimeError(f"❌ Không tìm thấy {start_marker}")

    return lines[start:stop]


# ========= PARSE QUESTIONS =========
def parse_questions(lines):
    questions = []
    cur = None

    for line in lines:
        q = QUESTION_RE.match(line)
        if q:
            if cur:
                questions.append(cur)

            cur = {
                "num": int(q.group(1)),
                "question": q.group(2).strip(),
                "options": []
            }
            continue

        opt = OPTION_RE.match(line)
        if opt and cur:
            cur["options"].append(opt.group(1).strip())
            continue

        if cur and len(cur["options"]) == 0:
            cur["question"] += " " + line

    if cur:
        questions.append(cur)

    return questions


# ========= PARSE ANSWERS =========
def parse_answers(lines):
    joined = " ".join(lines)
    pairs = ANSWER_PAIR_RE.findall(joined)

    answers = {}
    for num, letter in pairs:
        answers[int(num)] = LETTER_TO_INDEX[letter]

    return answers


# ========= BUILD JSON =========
def build_json(questions, answers):
    result = []

    for q in questions:
        options = q["options"][:4]
        while len(options) < 4:
            options.append("")

        result.append({
            "id": f"ch2_{q['num']}",
            "chapter": "ch2",
            "question": q["question"],
            "options": options,
            "answerIndex": answers.get(q["num"])
        })

    return result


# ========= MAIN =========
def main():
    pdf_path = "ch_2_on.pdf"   # đổi nếu cần
    out_path = "ch2.json"

    lines = extract_lines(pdf_path)

    question_lines = slice_between(lines, START_QUESTIONS, START_ANSWERS)
    answer_lines = slice_between(lines, START_ANSWERS)

    questions = parse_questions(question_lines)
    answers = parse_answers(answer_lines)

    result = build_json(questions, answers)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✔ Parsed {len(result)} câu chương 2")
    print(f"✔ Output: {out_path}")


if __name__ == "__main__":
    main()
