import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import Button from "./Button";
import Badge from "./Badge";
import { cn } from "../lib/utils";

function MiniRow({ ok, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl p-4 ring-1 transition hover:shadow-soft hover:-translate-y-[1px]",
        ok ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200"
      )}
    >
      <div className="flex items-start gap-3">
        {ok ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-700 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-rose-700 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-900 line-clamp-2">{title}</div>
        </div>
        <Badge tone={ok ? "green" : "red"}>{ok ? "Đúng" : "Sai"}</Badge>
      </div>
    </button>
  );
}

export default function Summary({ questions, answers, onReview, onReset }) {
  const total = questions.length;
  const correct = questions.reduce((acc, q) => acc + (answers[q.id]?.isCorrect ? 1 : 0), 0);
  const wrong = total - correct;

  const data = [
    { name: "Đúng", value: correct },
    { name: "Sai", value: wrong }
  ];

  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-soft overflow-hidden">
      <div className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-600">Tổng kết</div>
            <div className="mt-1 text-2xl md:text-3xl font-black text-slate-900">{correct}/{total} câu đúng</div>
            <div className="mt-1 text-sm text-slate-600">
              {wrong} câu sai • Tỉ lệ đúng: {total ? Math.round((correct / total) * 100) : 0}%
            </div>
          </div>

          <Button variant="secondary" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Làm lại
          </Button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-5">
          <div className="md:col-span-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-3">
            <div className="text-sm font-bold text-slate-900">Danh sách câu hỏi</div>
            <div className="mt-3 grid gap-3">
              {questions.map((q, i) => (
                <MiniRow
                  key={q.id}
                  ok={!!answers[q.id]?.isCorrect}
                  title={`Câu ${i + 1}: ${q.question}`}
                  onClick={() => onReview(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
