import pdfplumber
import re
import json

START_QUESTIONS = "Bộ câu hỏi (90 câu)"

QUESTION_RE = re.compile(r"Câu\s*(\d+)\.\s*(.+)", re.IGNORECASE)
OPTION_RE = re.compile(r"^[A-D]\.\s*(.+)")
ANSWER_PAIR_RE = re.compile(r"(\d+)\s*([A-D])")

LETTER_TO_INDEX = {"A": 0, "B": 1, "C": 2, "D": 3}


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


def slice_from_marker(lines, marker):
    for i, l in enumerate(lines):
        if marker in l.upper():
            return lines[i + 1 :]
    raise RuntimeError(f"❌ Không tìm thấy {marker}")


def parse_questions(lines, max_q=90):
    questions = []
    cur = None

    for line in lines:
        line = re.sub(r"\s+", " ", line).strip()
        # 1) bắt đầu câu mới
        q = QUESTION_RE.match(line)
        if q:
            num = int(q.group(1))
            if num > max_q:
                break

            if cur:
                questions.append(cur)

            cur = {
                "num": num,
                "question": q.group(2).strip(),
                "options": []
            }
            continue

        if not cur:
            continue

        # 2) bắt đầu 1 option mới A/B/C/D
        opt = OPTION_RE.match(line)
        if opt:
            cur["options"].append(opt.group(1).strip())
            continue

        # 3) không match câu mới/option mới => nối dòng
        #    - nếu chưa có options: đây là phần tiếp của câu hỏi
        #    - nếu đã có options: đây là phần tiếp của option gần nhất (option dài xuống dòng)
        if cur["options"]:
            # nối vào option gần nhất
            cur["options"][-1] = (cur["options"][-1] + " " + line).strip()
        else:
            # nối vào câu hỏi
            cur["question"] = (cur["question"] + " " + line).strip()

    if cur and cur["num"] <= max_q:
        questions.append(cur)

    return questions



def parse_answers(lines):
    joined = " ".join(lines)
    pairs = ANSWER_PAIR_RE.findall(joined)

    answers = {}
    for num, letter in pairs:
        answers[int(num)] = LETTER_TO_INDEX[letter]

    return answers


def build_json(questions, answers):
    result = []

    for q in questions:
        options = q["options"][:4]
        while len(options) < 4:
            options.append("")

        result.append({
            "id": f"ch3_{q['num']}",
            "chapter": "ch3",
            "question": q["question"],
            "options": options,
            "answerIndex": answers.get(q["num"])
        })

    return result


def main():
    pdf_path = "ch_3_on.pdf"
    out_path = "ch3.json"

    lines = extract_lines(pdf_path)

    # KHÔNG cắt theo marker nữa
    questions = parse_questions(lines, max_q=90)

    answers = parse_answers(lines)
    result = build_json(questions, answers)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✔ Parsed {len(result)} câu chương 3 (EXPECTED: 90)")
    print(f"✔ Output: {out_path}")


if __name__ == "__main__":
    main()
