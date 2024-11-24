import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (newRating: number) => void;
  readOnly?: boolean;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, readOnly = false, size = 24 }) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(rating);

  const handleMouseEnter = (event: React.MouseEvent, star: number) => {
    if (!readOnly) {
      const { offsetX } = event.nativeEvent;
      const isHalf = offsetX < size / 2; // Check if cursor is in the left half of the star
      setHoveredRating(isHalf ? star - 0.5 : star);
    }
  };

  const handleClick = (star: number, isHalf: boolean) => {
    if (!readOnly && onRatingChange) {
      const newRating = isHalf ? star - 0.5 : star;
      setSelectedRating(newRating);
      onRatingChange(newRating);
    }
  };

  const renderStar = (star: number) => {
    const activeRating = hoveredRating !== null ? hoveredRating : selectedRating;
    const fillPercentage = Math.min(Math.max(activeRating - star + 1, 0), 1);

    return (
      <span
        key={star}
        className={`star ${fillPercentage > 0 ? 'filled' : ''}`} 
        onMouseMove={(e) => handleMouseEnter(e, star)} // Handle hover with half-star detection
        onClick={() => handleClick(star, fillPercentage < 1)} // Set rating with half-star precision
        onMouseLeave={() => !readOnly && setHoveredRating(null)} // Reset hover on mouse leave
        style={{
          cursor: readOnly ? 'default' : 'pointer',
          fontSize: size,
          position: 'relative',
          display: 'inline-block',
        }}
      >
        {/* Full star background */}
        <span style={{ color: '#ccc', position: 'absolute', left: 0, width: '100%', overflow: 'hidden' }}>★</span>

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

  return <div 
            aria-label="Star Rating" 
            className="star-rating"
            data-testid="star-rating"
            data-size={size}
            >
              {[1, 2, 3, 4, 5].map(renderStar)}
          </div>;
};


export default StarRating;
