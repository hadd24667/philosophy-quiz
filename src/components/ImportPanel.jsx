import { Upload, FileJson, FileText } from "lucide-react";
import Button from "./Button";
import Badge from "./Badge";
import { parseQuizJson, parseStudocuLikeText } from "../lib/parsers";

async function readFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = reject;
    r.readAsText(file);
  });
}

export default function ImportPanel({ onImport }) {
  const handle = async (file) => {
    const text = await readFile(file);

    try {
      const qs = parseQuizJson(text);
      onImport?.(qs);
      return;
    } catch {
      // try txt parser
    }

    const parsed = parseStudocuLikeText(text, "custom");
    if (!parsed.questions.length) {
      throw new Error("Không parse được file. Hãy dùng JSON đúng schema hoặc TXT đúng format.");
    }
    onImport?.(parsed.questions);
  };

  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-soft overflow-hidden">
      <div className="p-6 md:p-7">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-slate-600">Dữ liệu</div>
            <div className="mt-1 text-lg font-black text-slate-900">Import file trắc nghiệm</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="blue"><FileJson className="h-3.5 w-3.5" /> JSON</Badge>
            <Badge tone="gray"><FileText className="h-3.5 w-3.5" /> TXT</Badge>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Import <span className="font-semibold">JSON</span> (mảng câu hỏi) hoặc <span className="font-semibold">TXT</span> kiểu “bộ đề” có chữ đáp án A/B/C/D nằm ở dòng trước câu hỏi.
        </p>

        <div className="mt-5">
          <label className="inline-flex items-center gap-3">
            <input
              type="file"
              accept=".json,.txt"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await handle(file);
                } catch (err) {
                  alert(err?.message ?? String(err));
                } finally {
                  e.target.value = "";
                }
              }}
            />
            <Button variant="secondary">
              <Upload className="h-4 w-4" />
              Chọn file để import
            </Button>
          </label>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="text-sm font-bold text-slate-900">JSON schema (ví dụ)</div>
          <pre className="mt-2 overflow-auto text-xs text-slate-700">
{`[
  {
    "id": "ch1_1",
    "chapter": "ch1",
    "question": "Triết học ra đời khi nào?",
    "options": ["...", "...", "...", "..."],
    "answerIndex": 2,
    "explanation": "..."
  }
]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
