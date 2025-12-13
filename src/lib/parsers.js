export function parseStudocuLikeText(text, chapter = "ch1") {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions = [];
  let pendingAnswer = null;

  let cur = null; // {id, question, options, answerIndex, explanation, chapter}
  const flush = () => {
    if (!cur) return;
    if (cur.question && cur.options?.length >= 2 && Number.isInteger(cur.answerIndex)) {
      questions.push(cur);
    }
    cur = null;
  };

  const isSingleLetter = (s) => /^[a-dA-D]$/.test(s);
  const qStart = (s) => /^(\d+)[\.\)]\s*(.+)$/.exec(s);
  const optLine = (s) => /^([a-dA-D])[\)\.\:]\s*(.+)$/.exec(s);
  const map = { a: 0, b: 1, c: 2, d: 3 };

  for (const line of lines) {
    if (/^chap\s*\d+\s*:?\s*$/i.test(line)) {
      flush();
      pendingAnswer = null;
      continue;
    }

    if (isSingleLetter(line)) {
      pendingAnswer = line.toLowerCase();
      continue;
    }

    const qs = qStart(line);
    if (qs) {
      flush();
      const num = qs[1];
      const qText = qs[2].trim();
      const answerIndex = pendingAnswer ? map[pendingAnswer] : null;
      pendingAnswer = null;

      cur = {
        id: `${chapter}_${num}`,
        chapter,
        question: qText,
        options: [],
        answerIndex,
        explanation: ""
      };
      continue;
    }

    const ol = optLine(line);
    if (ol && cur) {
      cur.options.push(ol[2].trim());
      continue;
    }

    if (cur) {
      if (cur.options.length === 0) cur.question += " " + line;
      else cur.explanation = (cur.explanation ? cur.explanation + " " : "") + line;
    }
  }

  flush();
  return { chapter, questions };
}

export function parseQuizJson(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("JSON phải là một mảng câu hỏi.");
  return data;
}
