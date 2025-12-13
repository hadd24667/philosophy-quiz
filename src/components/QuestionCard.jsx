import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import Badge from "./Badge";

function OptionButton({ index, label, selected, revealed, correctIndex, onPick }) {
  const isCorrect = revealed && index === correctIndex;
  const isWrong = revealed && selected && index !== correctIndex;

  return (
    <button
      type="button"
      onClick={() => onPick(index)}
      disabled={revealed}
      className={cn(
        "group w-full rounded-2xl p-4 text-left ring-1 transition outline-none focus:ring-4",
        revealed ? "cursor-default" : "hover:shadow-soft hover:-translate-y-[1px]",
        selected ? "ring-blue-300 bg-blue-50" : "ring-slate-200 bg-white",
        isCorrect && "ring-emerald-300 bg-emerald-50",
        isWrong && "ring-rose-300 bg-rose-50"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black ring-1",
            isCorrect
              ? "bg-emerald-600 text-white ring-emerald-200"
              : isWrong
              ? "bg-rose-600 text-white ring-rose-200"
              : selected
              ? "bg-blue-600 text-white ring-blue-200"
              : "bg-slate-100 text-slate-700 ring-slate-200"
          )}
        >
          {String.fromCharCode(65 + index)}
        </div>

        <div className="flex-1">
          <div className="text-sm leading-relaxed text-slate-900">{label}</div>

          {revealed && index === correctIndex && (
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Đáp án đúng
            </div>
          )}
          {revealed && selected && index !== correctIndex && (
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
              <XCircle className="h-4 w-4" />
              Bạn chọn sai
            </div>
          )}
        </div>

        {!revealed && <ChevronRight className="mt-1 h-5 w-5 text-slate-300 transition group-hover:text-slate-400" />}
      </div>
    </button>
  );
}

export default function QuestionCard({ q, idx, total, selection, revealed, onPick }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-soft overflow-hidden">
      <div className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge tone="blue">{q.chapter?.toUpperCase()}</Badge>
            <Badge tone="gray">Câu {idx + 1}/{total}</Badge>
          </div>
          {revealed && (
            <Badge tone={selection === q.answerIndex ? "green" : "red"}>
              {selection === q.answerIndex ? "Đúng" : "Sai"}
            </Badge>
          )}
        </div>

        <h2 className="mt-4 text-lg md:text-xl font-bold leading-snug text-slate-900">{q.question}</h2>

        <div className="mt-5 grid gap-3">
          {q.options.map((opt, i) => (
            <OptionButton
              key={i}
              index={i}
              label={opt}
              selected={selection === i}
              revealed={revealed}
              correctIndex={q.answerIndex}
              onPick={onPick}
            />
          ))}
        </div>

        {revealed && q.explanation && (
          <div className="mt-5 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
            <div className="text-sm font-bold text-slate-900">Giải thích / ghi chú</div>
            <div className="mt-1 text-sm leading-relaxed text-slate-700">{q.explanation}</div>
          </div>
        )}
      </div>
    </div>
  );
}
