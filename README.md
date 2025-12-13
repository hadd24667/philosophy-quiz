# Philosophy Quiz (React + Tailwind)

## Chạy dự án
```bash
npm i
npm run dev
```

## Dữ liệu câu hỏi
Mặc định: `public/quizzes/ch1.json`, `ch2.json`, `ch3.json`.

Schema:
```json
{
  "id": "ch1_1",
  "chapter": "ch1",
  "question": "Câu hỏi ...?",
  "options": ["A ...", "B ...", "C ...", "D ..."],
  "answerIndex": 2,
  "explanation": "Giải thích (tuỳ chọn)"
}
```

## Import
- JSON: mảng câu hỏi theo schema.
- TXT: kiểu “bộ đề” có đáp án (A/B/C/D) nằm **ở dòng trước** câu hỏi.
