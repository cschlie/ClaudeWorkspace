import { useState, useCallback } from "react";

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z";

function Star({ index, rating, hoverRating, size, interactive, onClickHalf }) {
  const displayRating = hoverRating !== null ? hoverRating : rating;
  const fillLevel = Math.min(Math.max(displayRating - index, 0), 1);

  const clipId = `star-clip-${index}-${Math.random().toString(36).slice(2, 9)}`;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const handleClick = useCallback(
    (e) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isLeftHalf = x < rect.width / 2;
      onClickHalf(index + (isLeftHalf ? 0.5 : 1));
    },
    [interactive, index, onClickHalf]
  );

  return (
    <svg
      viewBox="0 0 24 24"
      className={`${sizeClass} shrink-0 ${interactive ? "cursor-pointer" : ""}`}
      onClick={handleClick}
      role={interactive ? "button" : undefined}
      aria-label={`${index + 1} star`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={`${fillLevel * 100}%`} height="100%" />
        </clipPath>
      </defs>

      {/* Empty star (border color) */}
      <path
        d={STAR_PATH}
        fill="var(--color-border, #3d2a5c)"
        stroke="none"
      />

      {/* Filled portion */}
      {fillLevel > 0 && (
        <path
          d={STAR_PATH}
          fill="var(--color-star, #f59e0b)"
          stroke="none"
          clipPath={`url(#${clipId})`}
        />
      )}
    </svg>
  );
}

export default function StarRating({
  rating = 0,
  onRate,
  size = "md",
  showValue = false,
}) {
  const [hoverRating, setHoverRating] = useState(null);
  const interactive = typeof onRate === "function";

  const handleMouseMove = useCallback(
    (e, index) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isLeftHalf = x < rect.width / 2;
      setHoverRating(index + (isLeftHalf ? 0.5 : 1));
    },
    [interactive]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverRating(null);
  }, []);

  const handleClickHalf = useCallback(
    (value) => {
      if (interactive) {
        onRate(value);
      }
    },
    [interactive, onRate]
  );

  const displayValue = hoverRating !== null ? hoverRating : rating;

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={handleMouseLeave}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`Rating: ${rating} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          onMouseMove={(e) => handleMouseMove(e, i)}
        >
          <Star
            index={i}
            rating={rating}
            hoverRating={hoverRating}
            size={size}
            interactive={interactive}
            onClickHalf={handleClickHalf}
          />
        </div>
      ))}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium tabular-nums text-current">
          {displayValue.toFixed(1)}
        </span>
      )}
    </div>
  );
}
