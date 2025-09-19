import { useState } from "react";

export default function Quiz({ quiz }: { quiz: Array<{ question: string; options: string[]; answerIndex?: number; explanation?: string }> }) {
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz || quiz.length === 0) return null;

  const handleSelect = (i: number, opt: number) => {
    setAnswers((s) => ({ ...s, [i]: opt }));
  };

  const score = () => {
    let s = 0;
    for (let i = 0; i < quiz.length; i++) {
      const a = answers[i];
      if (a != null && quiz[i].answerIndex === a) s++;
    }
    return s;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Quiz</h3>
      <p className="text-sm text-muted-foreground">Test your understanding with {quiz.length} quick questions.</p>
      <div className="space-y-6">
        {quiz.map((q, i) => (
          <div key={i} className="p-4 border border-border rounded-md">
            <div className="font-medium mb-2">{i + 1}. {q.question}</div>
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((opt, idx) => {
                const sel = answers[i] === idx;
                const correct = q.answerIndex === idx;
                const showCorrect = submitted && correct;
                return (
                  <button
                    key={idx}
                    onClick={() => !submitted && handleSelect(i, idx)}
                    className={`text-left p-3 rounded-md border ${sel ? 'border-primary bg-primary/10' : 'border-border'} ${showCorrect ? 'ring-2 ring-green-300' : ''}`}
                    disabled={submitted}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {submitted && (correct ? <span className="text-xs text-green-600">Correct</span> : (sel ? <span className="text-xs text-red-600">Your answer</span> : null))}
                    </div>
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <div className="mt-2 text-sm text-muted-foreground">Explanation: {q.explanation}</div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {!submitted ? (
          <button className="px-4 py-2 bg-primary text-white rounded" onClick={() => setSubmitted(true)}>Submit</button>
        ) : (
          <>
            <div className="text-sm">Score: {score()} / {quiz.length}</div>
            <button className="px-3 py-1 border border-border rounded" onClick={() => { setSubmitted(false); setAnswers({}); }}>Retry</button>
          </>
        )}
      </div>
    </div>
  );
}
