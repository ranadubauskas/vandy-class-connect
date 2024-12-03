// components/StarRating.jsx
import React from 'react';

interface StarRatingProps {
  rating: number; // Current rating to display
  onRatingChange?: (newRating: number) => void;
  onHover?: (newHoverRating: number) => void;
  onLeave?: () => void;
  readOnly?: boolean;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  onHover,
  onLeave,
  readOnly = false,
  size = 24,
}) => {
  const renderStar = (star: number) => {
    const fillPercentage = Math.min(Math.max(rating - star + 1, 0), 1); // Determines how much the star is filled

    return (
      <span
        key={star}
        className={`star ${fillPercentage > 0 ? 'filled' : ''}`}
        onMouseMove={(e) => {
          if (!readOnly && onHover) {
            const { offsetX } = e.nativeEvent;
            const isHalf = offsetX < size / 2;
            const newHoverRating = isHalf ? star - 0.5 : star;
            onHover(newHoverRating);
          }
        }}
        onClick={() => {
          if (!readOnly && onRatingChange) {
            // Determine if click was on half or full star
            // Note: This simplistic approach assumes entire star is clickable
            onRatingChange(star);
          }
        }}
        style={{
          cursor: readOnly ? 'default' : 'pointer',
          fontSize: size,
          position: 'relative',
          display: 'inline-block',
        }}
      >
        {/* Full star background */}
        <span
          style={{
            color: '#ccc',
            position: 'absolute',
            left: 0,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          ★
        </span>

        {/* Partial star fill based on active rating */}
        <span
          style={{
            color: '#FFD700',
            position: 'absolute',
            left: 0,
            width: `${fillPercentage * 100}%`,
            overflow: 'hidden',
          }}
        >
          ★
        </span>

        <span style={{ opacity: 0 }}>★</span> {/* Invisible star for spacing */}
      </span>
    );
  };

  return (
    <div
      aria-label="Star Rating"
      className="star-rating"
      data-testid="star-rating"
      data-size={size}
      onMouseLeave={() => {
        if (!readOnly && onLeave) {
          onLeave();
        }
      }}
    >
      {[1, 2, 3, 4, 5].map(renderStar)}
    </div>
  );
};

export default StarRating;
