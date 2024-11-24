import React from 'react';

interface RatingBoxProps {
  rating: number | string;
  size?: 'small' | 'large';
}

const RatingBox: React.FC<RatingBoxProps> = ({ rating, size = 'large' }) => {
  // Parse rating as a number and set a fallback display value
  const parsedRating = typeof rating === "number" ? rating : parseFloat(rating) || 0;
  const displayRating = parsedRating === 0.0 ? "N/A" : parsedRating.toFixed(1);

  const sizeClass = size === 'small' ? 'text-sm p-1' : 'text-lg p-2';

  // Determine the rating color class based on parsedRating
  const ratingColorClass =
    parsedRating === 0.0
      ? "bg-gray-400" // Gray if rating is exactly 0.0 or "N/A"
      : parsedRating > 0 && parsedRating < 2
        ? "bg-red-400" // Red for (0, 2)
        : parsedRating >= 2 && parsedRating < 4
          ? "bg-yellow-300" // Yellow for [2, 4)
          : "bg-green-300"; // Green for [4, 5]

  return (
    <div className={`rating-box text-lg p-2 rounded-lg font-bold shadow-lg ${ratingColorClass} ${sizeClass}`}
      aria-label={`Rating: ${displayRating}`}
    >
      {displayRating}
    </div>
  );
};

export default RatingBox;