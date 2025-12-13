import re
import json
import argparse
from pathlib import Path

from docx import Document


QUESTION_RE = re.compile(r"^\s*Câu\s+(\d+)\s*[\.\)]\s*(.+)\s*$", re.IGNORECASE)
OPTION_RE = re.compile(r"^\s*([a-dA-D])\s*[\.\)]\s*(.+)\s*$")
ANSWER_SECTION_RE = re.compile(r"^\s*ĐÁP\s*ÁN\b", re.IGNORECASE)
ANSWER_PAIR_RE = re.compile(r"(\d+)\s*([A-Da-d])")  # matches 1B, 2C, 10A...


def read_docx_lines(docx_path: str) -> list[str]:
    doc = Document(docx_path)
    lines: list[str] = []
    for p in doc.paragraphs:
        txt = (p.text or "").strip()
        if not txt:
            continue
        # some paragraphs may contain line breaks
        for part in txt.splitlines():
            part = part.strip()
            if part:
                lines.append(part)
    return lines


def parse_answers(lines: list[str], start_idx: int) -> dict[int, str]:
    """
    Parse answer mapping from the answer section to end of document.
    Accepts: '1B 2C 3B ...' across multiple lines.
    Returns: {1: 'B', 2: 'C', ...}
    """
    blob = " ".join(lines[start_idx:])
    pairs = ANSWER_PAIR_RE.findall(blob)
    ans: dict[int, str] = {}
    for num_s, letter in pairs:
        ans[int(num_s)] = letter.upper()
    return ans


def parse_questions(lines: list[str]) -> tuple[list[dict], dict[int, str]]:
    questions: list[dict] = []
    i = 0
    answer_start = None

    # find answer section (if any)
    for idx, line in enumerate(lines):
        if ANSWER_SECTION_RE.search(line):
            answer_start = idx
            break

    content_lines = lines if answer_start is None else lines[:answer_start]
    answers = {} if answer_start is None else parse_answers(lines, answer_start)

    cur = None  # current question object
    while i < len(content_lines):
        line = content_lines[i].strip()

        # start of a question
        m = QUESTION_RE.match(line)
        if m:
            # flush previous
            if cur:
                questions.append(cur)
            qnum = int(m.group(1))
            qtext = m.group(2).strip()
            cur = {
                "num": qnum,
                "question": qtext,
                "options": [],
                "answerIndex": None,  # fill later using answers
            }
            i += 1
            continue

        # ignore "Chọn một:"
        if line.lower().startswith("chọn một"):
            i += 1
            continue

        # option lines
        om = OPTION_RE.match(line)
        if om and cur is not None:
            opt_text = om.group(2).strip()
            cur["options"].append(opt_text)
            i += 1
            continue

        # continuation lines (rare): append into question text if we are still before options
        if cur is not None:
            if len(cur["options"]) == 0:
                # still in question statement
                cur["question"] += " " + line
            else:
                # after options started -> treat as note (ignored)
                pass

        i += 1

    if cur:
        questions.append(cur)

    return questions, answers


def build_output(questions: list[dict], answers: dict[int, str], chapter: str) -> list[dict]:
    letter_to_index = {"A": 0, "B": 1, "C": 2, "D": 3}

    out: list[dict] = []
    for q in questions:
        num = q["num"]
        ans_letter = answers.get(num)
        ans_idx = letter_to_index.get(ans_letter) if ans_letter else None

        item = {
            "id": f"{chapter}_{num}",
            "chapter": chapter,
            "question": q["question"].strip(),
            "options": q["options"],
            "answerIndex": ans_idx,
        }

        # basic validation: ensure exactly 4 options if format is fixed
        if len(item["options"]) != 4:
            # still output, but warn via placeholder
            # (you can raise Exception instead if you want strict mode)
            pass

        out.append(item)

    # optional: sort by question number just in case DOCX order got weird
    out.sort(key=lambda x: int(x["id"].split("_")[-1]))
    return out


def main():
    ap = argparse.ArgumentParser(description="Parse DOCX quiz (Câu N + a/b/c/d, answers at end) to JSON.")
    ap.add_argument("input", help="Input .docx file path")
    ap.add_argument("-o", "--output", default="quiz.json", help="Output .json path (default: quiz.json)")
    ap.add_argument("--chapter", default="ch1", help="Chapter key used for id/chapter fields (default: ch1)")
    args = ap.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        raise FileNotFoundError(f"Not found: {in_path}")

    lines = read_docx_lines(str(in_path))
    questions, answers = parse_questions(lines)

    if not questions:
        raise ValueError("No questions parsed. Check DOCX format (must start with 'Câu N.').")

    # If answers missing, answerIndex will be null
    output = build_output(questions, answers, args.chapter)

    out_path = Path(args.output)
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Parsed questions: {len(output)}")
    print(f"Answers found: {len(answers)}")
    print(f"Wrote: {out_path.resolve()}")


if __name__ == "__main__":
    main()
