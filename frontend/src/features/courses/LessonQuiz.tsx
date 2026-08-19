import { useState } from "react";
import type { CourseQuiz } from "@/types/course";

export function LessonQuiz({ quiz }: { quiz: CourseQuiz }) {
  const questions = quiz.questions;
  const [selected, setSelected] = useState<Array<number | null>>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) {
    return <p className="mt-6 text-ink-soft">This quiz has no questions yet.</p>;
  }

  const answered = selected.filter((value) => value !== null).length;
  const correct = questions.reduce((total, question, index) => {
    return total + (selected[index] === question.answerIndex ? 1 : 0);
  }, 0);
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= quiz.passingScore;

  function choose(questionIndex: number, choiceIndex: number) {
    if (submitted) {
      return;
    }
    setSelected((current) => current.map((value, index) => (index === questionIndex ? choiceIndex : value)));
  }

  function mark() {
    if (answered < questions.length) {
      return;
    }
    setSubmitted(true);
  }

  function retry() {
    setSelected(questions.map(() => null));
    setSubmitted(false);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        {questions.length} {questions.length === 1 ? "question" : "questions"} · pass at {quiz.passingScore}%
      </p>
      {questions.map((question, questionIndex) => {
        const picked = selected[questionIndex];
        return (
          <fieldset key={`${question.prompt}-${questionIndex}`} className="rounded-2xl border border-line bg-paper/40 p-5">
            <legend className="font-medium text-ink">
              {questionIndex + 1}. {question.prompt}
            </legend>
            <div className="mt-4 space-y-2">
              {question.choices.map((choice, choiceIndex) => {
                const isPicked = picked === choiceIndex;
                const isAnswer = question.answerIndex === choiceIndex;
                const showResult = submitted && (isPicked || isAnswer);
                return (
                  <label
                    key={`${choice}-${choiceIndex}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${
                      showResult && isAnswer
                        ? "border-accent bg-accent/10 text-ink"
                        : showResult && isPicked
                          ? "border-line bg-paper text-ink-soft"
                          : "border-line bg-surface text-ink hover:border-accent/40"
                    }`}
                  >
                    <input
                      className="mt-1"
                      type="radio"
                      name={`quiz-${questionIndex}`}
                      checked={isPicked}
                      disabled={submitted}
                      onChange={() => choose(questionIndex, choiceIndex)}
                    />
                    <span>{choice}</span>
                  </label>
                );
              })}
            </div>
            {submitted && question.explanation ? (
              <p className="mt-3 text-sm leading-6 text-ink-soft">{question.explanation}</p>
            ) : null}
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        {submitted ? (
          <>
            <p className="text-sm font-medium text-ink" role="status">
              {passed ? "Passed" : "Try again"} · {score}% ({correct}/{questions.length})
            </p>
            <button
              type="button"
              className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent/40"
              onClick={retry}
            >
              Retry quiz
            </button>
          </>
        ) : (
          <button
            type="button"
            className="cursor-pointer rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-40"
            disabled={answered < questions.length}
            onClick={mark}
          >
            Check answers
          </button>
        )}
      </div>
    </div>
  );
}
