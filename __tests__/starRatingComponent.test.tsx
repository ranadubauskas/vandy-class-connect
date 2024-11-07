import { fireEvent, render, screen } from '@testing-library/react';
import StarRating from '../src/app/components/StarRating'; // Adjust the path as necessary

describe('StarRating Component', () => {
  const handleRatingChange = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render 5 stars', () => {
    render(<StarRating rating={3} />);
    const stars = screen.getAllByText('★');
    expect(stars).toHaveLength(5);
  });

  it('should apply the correct rating based on the initial prop', () => {
    render(<StarRating rating={3} />);
    const stars = screen.getAllByText('★');
    expect(stars[0]).toHaveStyle('color: #FFD700');
    expect(stars[1]).toHaveStyle('color: #FFD700');
    expect(stars[2]).toHaveStyle('color: #FFD700');
    expect(stars[3]).toHaveStyle('color: #ccc');
  });

  it('should allow full-star rating change on click when not read-only', () => {
    render(<StarRating rating={3} onRatingChange={handleRatingChange} readOnly={false} />);
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[4]);
    expect(handleRatingChange).toHaveBeenCalledWith(5);
  });

  it('should allow half-star rating on hover and update accordingly', () => {
    render(<StarRating rating={3} onRatingChange={handleRatingChange} readOnly={false} size={24} />);
    const stars = screen.getAllByText('★');
    fireEvent.mouseMove(stars[2], { nativeEvent: { offsetX: 10 } }); // simulate half-star hover
    expect(stars[2]).toHaveStyle('color: #FFD700'); // Check that the half star is colored correctly
  });

  it('should not call onRatingChange if component is read-only', () => {
    render(<StarRating rating={2} onRatingChange={handleRatingChange} readOnly={true} />);
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[4]);
    expect(handleRatingChange).not.toHaveBeenCalled();
  });

  it('should reset hover state when the mouse leaves a star', () => {
    render(<StarRating rating={2} />);
    const stars = screen.getAllByText('★');
    fireEvent.mouseMove(stars[2], { nativeEvent: { offsetX: 10 } });
    expect(stars[2]).toHaveStyle('color: #FFD700');
    fireEvent.mouseLeave(stars[2]);
    expect(stars[2]).toHaveStyle('color: #ccc');
  });
});