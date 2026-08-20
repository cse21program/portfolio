export function StarRating({
  value,
  onChange,
  name = "rating",
}: {
  value: number;
  onChange?: (value: number) => void;
  name?: string;
}) {
  const interactive = Boolean(onChange);
  return (
    <div className="flex gap-1" role={interactive ? "radiogroup" : "img"} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((score) => {
        const filled = score <= value;
        const className = `grid h-9 w-9 place-items-center rounded-full text-sm ${
          filled ? "bg-accent text-paper" : "border border-line bg-surface text-muted"
        } ${interactive ? "cursor-pointer hover:border-accent" : ""}`;
        if (!interactive) {
          return (
            <span key={score} className={className} aria-hidden="true">
              {score}
            </span>
          );
        }
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} ${score === 1 ? "star" : "stars"}`}
            name={name}
            className={className}
            onClick={() => onChange?.(score)}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}
