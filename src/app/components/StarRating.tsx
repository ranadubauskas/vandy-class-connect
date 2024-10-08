import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (newRating: number) => void; 
  readOnly?: boolean;
  size?: number; 
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, readOnly = false, size = 24 }) => {
  const stars = [1, 2, 3, 4, 5];
  
  const renderStar = (star: number) => {
    const fillPercentage = Math.min(Math.max(rating - star + 1, 0), 1); // Calculate fill for partial stars

    return (
      <span
        key={star}
        onClick={() => !readOnly && onRatingChange && onRatingChange(star)}
        onMouseEnter={() => !readOnly && onRatingChange && onRatingChange(star)}
        style={{ cursor: readOnly ? 'default' : 'pointer', fontSize: size, position: 'relative', display: 'inline-block' }}
      >
        <span style={{ color: '#ccc', position: 'absolute', left: 0, width: '100%', overflow: 'hidden' }}>★</span>
        <span
          style={{
            color: '#FFD700',
            position: 'absolute',
            left: 0,
            width: `${fillPercentage * 100}%`, // Fill partial star
            overflow: 'hidden',
          }}
        >
          ★
        </span>
        <span style={{ opacity: 0 }}>★</span> {/* Invisible star for spacing */}
      </span>
    );
  };

  return <div className="star-rating">{stars.map(renderStar)}</div>;
};

export default StarRating;
