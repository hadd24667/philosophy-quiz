export const QUIZ_BANK = {
  ch1: { label: "Chương 1", files: ["/quizzes/ch1.json"] },
  ch2: { label: "Chương 2", files: ["/quizzes/ch2.json"] },
  ch3: { label: "Chương 3", files: ["/quizzes/ch3.json"] },
  mixed: { label: "Trộn (1–3)", files: ["/quizzes/ch1.json", "/quizzes/ch2.json", "/quizzes/ch3.json"] }
};

export async function loadQuestions(modeKey) {
  const mode = QUIZ_BANK[modeKey];
  if (!mode) throw new Error("Mode không hợp lệ.");

  const all = [];
  for (const url of mode.files) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Không đọc được file: ${url}`);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error(`File ${url} phải là một mảng câu hỏi JSON`);
    all.push(...json);
  }

  return all.map((q, idx) => ({
    id: q.id ?? `${modeKey}_${idx + 1}`,
    chapter: q.chapter ?? modeKey,
    question: String(q.question ?? "").trim(),
    options: Array.isArray(q.options) ? q.options.map(String) : [],
    answerIndex: Number.isInteger(q.answerIndex) ? q.answerIndex : null,
    explanation: q.explanation ? String(q.explanation) : ""
  }));
}
