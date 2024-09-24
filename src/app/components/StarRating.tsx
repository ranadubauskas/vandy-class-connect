import React from 'react';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (newRating: number) => void; // Optional for read-only mode
    readOnly?: boolean; // New prop to indicate if the stars are clickable
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, readOnly = false }) => {
    const stars = [1, 2, 3, 4, 5];

    return (
        <div className="star-rating">
            {stars.map((star) => (
                <span
                    key={star}
                    onClick={() => !readOnly && onRatingChange && onRatingChange(star)}
                    onMouseEnter={() => !readOnly && onRatingChange && onRatingChange(star)}
                    style={{ cursor: readOnly ? 'default' : 'pointer', color: star <= rating ? '#FFD700' : '#ccc' }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export default StarRating;