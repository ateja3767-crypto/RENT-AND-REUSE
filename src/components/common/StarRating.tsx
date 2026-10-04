import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCount?: boolean;
  showNumeric?: boolean;
  className?: string;
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  totalReviews,
  size = 'sm',
  showCount = true,
  showNumeric = true,
  className = '',
}) => {
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    xs: 'text-[11px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const roundedStars = Math.round(rating);

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= roundedStars;
          return (
            <Star
              key={starIndex}
              className={`${iconSizes[size]} ${
                isFilled
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          );
        })}
      </div>

      {showNumeric && (
        <span className={`${textSizes[size]} font-bold text-slate-900 dark:text-white tabular-nums ml-0.5`}>
          {rating > 0 ? rating.toFixed(1) : 'New'}
        </span>
      )}

      {showCount && totalReviews !== undefined && (
        <span className={`${textSizes[size]} text-slate-500 dark:text-slate-400 tabular-nums`}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

interface InteractiveStarPickerProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'md' | 'lg';
}

const RATING_LABELS: Record<number, string> = {
  1: '1.0 — Poor / Defective Equipment',
  2: '2.0 — Fair / Notable Wear or Missing Parts',
  3: '3.0 — Good / Functional with Minor Quirks',
  4: '4.0 — Very Good / Clean & Reliable Gear',
  5: '5.0 — Excellent / Pristine Campus Equipment',
};

export const InteractiveStarPicker: React.FC<InteractiveStarPickerProps> = ({
  value,
  onChange,
  size = 'lg',
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const activeValue = hoveredStar ?? value;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= activeValue;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              aria-label={`Rate ${star} out of 5 stars`}
              className="p-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 transition-transform hover:scale-110 cursor-pointer"
            >
              <Star
                className={`${size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'} transition-colors ${
                  active
                    ? 'fill-amber-400 text-amber-500'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            </button>
          );
        })}

        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-2 tabular-nums">
          {RATING_LABELS[activeValue] || `${activeValue}.0 out of 5`}
        </span>
      </div>
    </div>
  );
};
