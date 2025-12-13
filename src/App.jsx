import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Shuffle, Play, ChevronLeft, ChevronRight, Home, Sparkles } from "lucide-react";
import Button from "./components/Button";
import Toggle from "./components/Toggle";
import Badge from "./components/Badge";
import QuestionCard from "./components/QuestionCard";
import Summary from "./components/Summary";
import ImportPanel from "./components/ImportPanel";
import { loadQuestions, QUIZ_BANK } from "./lib/quizBank";
import { shuffle, clamp } from "./lib/utils";
import { clearState, loadState, saveState } from "./lib/storage";

function Header({ modeKey, setModeKey, started, onHome, onStart, loading }) {
  return (
    <div className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white grid place-items-center shadow-soft">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-600">Ôn thi Triết học</div>
              <div className="text-lg font-black text-slate-900 leading-none">Trắc nghiệm</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={modeKey}
              disabled={started || loading}
              onChange={(e) => setModeKey(e.target.value)}
              className="h-10 rounded-xl bg-white px-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60"
            >
              {Object.entries(QUIZ_BANK).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            {started ? (
              <Button variant="secondary" onClick={onHome}>
                <Home className="h-4 w-4" />
                Trang chủ
              </Button>
            ) : (
              <Button onClick={onStart} disabled={loading}>
                <Play className="h-4 w-4" />
                {loading ? "Đang tải..." : "Bắt đầu"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ onQuickStart }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 text-white shadow-soft overflow-hidden">
          <div className="p-7 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Hạnh hehehe chúc anh em thi tốt!
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-black leading-tight">
              Ôn thi trắc nghiệm Triết học
              <span className="block text-white/90 text-xl md:text-2xl font-extrabold mt-2">Chương 1 / 2 / 3 hoặc trộn</span>
            </h1>
            <p className="mt-4 text-white/90 leading-relaxed">
              Chọn đáp án → biết đúng/sai ngay. Làm xong có tổng kết + danh sách câu đúng/sai để review.
              Đáp án generate từ ChatGPT nên các bạn nhớ kiểm tra kỹ lại nhé!
            </p>
            <div className="mt-7">
              <Button variant="secondary" className="bg-white text-blue-700 hover:bg-white/95 focus:ring-white/30" onClick={onQuickStart}>
                <Play className="h-5 w-5" />
                Bắt đầu ngay
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-soft overflow-hidden">
          <div className="p-6 md:p-7">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-semibold text-slate-600">Tuỳ chọn</div>
                <div className="mt-1 text-lg font-black text-slate-900">Cá nhân hoá đề</div>
              </div>
              <Badge tone="blue"><Shuffle className="h-3.5 w-3.5" /> Random</Badge>
            </div>
            <div className="mt-5 space-y-4">
              <Toggle label="Trộn thứ tự câu hỏi" checked={true} onChange={() => {}} />
              <div className="text-xs text-slate-500">
                (Tuỳ chọn đầy đủ ở dưới sau khi bấm Start)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [modeKey, setModeKey] = useState("mixed");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  const listRef = useRef(null);

  useEffect(() => {
    const saved = loadState();
    if (!saved) return;
    setModeKey(saved.modeKey ?? "mixed");
    setShuffleQuestions(!!saved.shuffleQuestions);
    setShuffleOptions(!!saved.shuffleOptions);
    setQuestions(saved.questions ?? []);
    setAnswers(saved.answers ?? {});
    setIdx(saved.idx ?? 0);
    setStarted(!!saved.started);
  }, []);

  useEffect(() => {
    saveState({ modeKey, shuffleQuestions, shuffleOptions, questions, answers, idx, started });
  }, [modeKey, shuffleQuestions, shuffleOptions, questions, answers, idx, started]);

  const isComplete = useMemo(() => {
    if (!started || !questions.length) return false;
    return questions.every((q) => answers[q.id]?.revealed);
  }, [started, questions, answers]);

  const current = questions[idx];

  const start = async () => {
    setLoading(true);
    try {
      const raw = await loadQuestions(modeKey);
      let qs = raw.filter((q) => q.question && q.options?.length >= 2 && q.answerIndex !== null);

      if (shuffleQuestions) qs = shuffle(qs);

      if (shuffleOptions) {
        qs = qs.map((q) => {
          const pairs = q.options.map((text, i) => ({ text, i }));
          const shuffled = shuffle(pairs);
          const newOptions = shuffled.map((p) => p.text);
          const newAnswerIndex = shuffled.findIndex((p) => p.i === q.answerIndex);
          return { ...q, options: newOptions, answerIndex: newAnswerIndex };
        });
      }

      setQuestions(qs);
      setAnswers({});
      setIdx(0);
      setStarted(true);
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      alert(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    setStarted(false);
    setQuestions([]);
    setAnswers({});
    setIdx(0);
    clearState();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pick = (choiceIndex) => {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { selectedIndex: choiceIndex, isCorrect: choiceIndex === current.answerIndex, revealed: true }
    }));
  };

  const next = () => setIdx((i) => clamp(i + 1, 0, questions.length - 1));
  const prev = () => setIdx((i) => clamp(i - 1, 0, questions.length - 1));
  const review = (i) => { setIdx(clamp(i, 0, questions.length - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const resetAttempt = () => { setAnswers({}); setIdx(0); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const importQuestions = (qs) => {
    const normalized = (qs || [])
      .map((q, i) => ({
        id: q.id ?? `import_${i + 1}`,
        chapter: q.chapter ?? "custom",
        question: String(q.question ?? "").trim(),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        answerIndex: Number.isInteger(q.answerIndex) ? q.answerIndex : null,
        explanation: q.explanation ? String(q.explanation) : ""
      }))
      .filter((q) => q.question && q.options.length >= 2 && q.answerIndex !== null);

    if (!normalized.length) return alert("Không có câu hợp lệ sau khi import.");
    const merged = [...questions, ...normalized];
    setQuestions(merged);
    if (!started) { setStarted(true); setIdx(0); setAnswers({}); }
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen">
      <Header
        modeKey={modeKey}
        setModeKey={setModeKey}
        started={started}
        onHome={goHome}
        onStart={start}
        loading={loading}
      />

      {!started ? (
        <>
          <Hero onQuickStart={start} />
          <div className="mx-auto max-w-6xl px-4 pb-12">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-soft overflow-hidden">
                <div className="p-6 md:p-7">
                  <div className="text-sm font-semibold text-slate-600">Tuỳ chọn đề</div>
                  <div className="mt-1 text-lg font-black text-slate-900">Random & import</div>

                  <div className="mt-5 space-y-4">
                    <Toggle checked={shuffleQuestions} onChange={setShuffleQuestions} label="Trộn thứ tự câu hỏi" />
                    <Toggle checked={shuffleOptions} onChange={setShuffleOptions} label="Trộn thứ tự đáp án (A/B/C/D)" />
                  </div>

                  <div className="mt-7 flex gap-2 flex-wrap">
                    <Button onClick={start} disabled={loading}>
                      <Play className="h-4 w-4" /> {loading ? "Đang tải..." : "Bắt đầu"}
                    </Button>
                    <Button variant="secondary" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}>
                      Import file
                    </Button>
                  </div>
                </div>
              </div>

              <ImportPanel onImport={importQuestions} />
            </div>
          </div>
        </>
      ) : (
        <div ref={listRef} className="mx-auto max-w-6xl px-4 py-7">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current?.id ?? "empty"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  {current ? (
                    <QuestionCard
                      q={current}
                      idx={idx}
                      total={questions.length}
                      selection={answers[current.id]?.selectedIndex ?? null}
                      revealed={!!answers[current.id]?.revealed}
                      onPick={pick}
                    />
                  ) : (
                    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-soft p-6">Không có câu hỏi.</div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button variant="secondary" onClick={prev} disabled={idx === 0}>
                  <ChevronLeft className="h-4 w-4" /> Trước
                </Button>

                <div className="flex items-center gap-2 text-sm">
                  <Badge tone="gray">{Object.values(answers).filter((a) => a?.revealed).length}/{questions.length} đã làm</Badge>
                  {isComplete && <Badge tone="green">Hoàn thành</Badge>}
                </div>

                <Button variant="secondary" onClick={next} disabled={idx === questions.length - 1}>
                  Sau <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {isComplete && (
                <div className="mt-6">
                  <Summary questions={questions} answers={answers} onReview={review} onReset={resetAttempt} />
                </div>
              )}
            </div>

            <div className="md:col-span-4">
              <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-soft overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-600">Điều hướng</div>
                      <div className="mt-1 text-lg font-black text-slate-900">Danh sách câu</div>
                    </div>
                    <Badge tone="blue">{QUIZ_BANK[modeKey]?.label ?? modeKey}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-6 gap-2">
                    {questions.map((q, i) => {
                      const a = answers[q.id];
                      const tone = a?.revealed
                        ? (a.isCorrect ? "bg-emerald-100 ring-emerald-200 text-emerald-800" : "bg-rose-100 ring-rose-200 text-rose-800")
                        : "bg-slate-100 ring-slate-200 text-slate-700";
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setIdx(i)}
                          className={`h-10 rounded-2xl ring-1 text-sm font-black transition hover:-translate-y-[1px] hover:shadow-soft ${tone} ${i === idx ? "outline-none ring-2 ring-blue-400" : ""}`}
                          title={q.question}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 grid gap-2">
                    <Button variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                      Lên đầu trang
                    </Button>
                    <ImportPanel onImport={importQuestions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mx-auto max-w-6xl px-4 pb-10">
        <div className="mt-10 rounded-3xl bg-white ring-1 ring-slate-200 p-6 shadow-soft">
          <div className="text-sm font-semibold text-slate-600">Ghi chú</div>
          <div className="mt-1 text-sm text-slate-700 leading-relaxed">
            • Dữ liệu mặc định nằm trong <span className="font-semibold">/public/quizzes/*.json</span>. <br />
            • Có parser import TXT kiểu “bộ đề” có đáp án nằm ở dòng trước câu hỏi.
          </div>
        </div>
      </footer>
    </div>
  );
}
