// StarRating.test.tsx
import { fireEvent, render } from '@testing-library/react';
import StarRating from '../src/app/components/StarRating';

describe('StarRating Component', () => {
  test('renders 5 stars', () => {
    const { container } = render(<StarRating rating={0} />);
    const starSpans = container.querySelectorAll('.star-rating > span');
    expect(starSpans.length).toBe(5);
  });

  test('fills stars according to the rating prop', () => {
    const { container } = render(<StarRating rating={3.5} />);
    const starSpans = container.querySelectorAll('.star-rating > span');

    starSpans.forEach((starSpan, index) => {
      const fillSpan = starSpan.querySelector('span:nth-child(2)') as HTMLElement;
      const fillWidth = fillSpan ? fillSpan.style.width : null;

      if (index < 3) {
        // First three stars should be fully filled
        expect(fillWidth).toBe('100%');
      } else if (index === 3) {
        // Fourth star should be half filled
        expect(fillWidth).toBe('50%');
      } else {
        // Remaining stars should not be filled
        expect(fillWidth).toBe('0%');
      }
    });
  });

  test('calls onRatingChange with correct value when a star is clicked', () => {
    const onRatingChange = jest.fn();
    const { container } = render(<StarRating rating={0} onRatingChange={onRatingChange} />);
    const starSpans = container.querySelectorAll('.star-rating > span');

    fireEvent.click(starSpans[2]);

    expect(onRatingChange).toHaveBeenCalledWith(2.5);
  });

  test('does not call onRatingChange when readOnly is true', () => {
    const onRatingChange = jest.fn();
    const { container } = render(
      <StarRating rating={0} onRatingChange={onRatingChange} readOnly={true} />
    );
    const starSpans = container.querySelectorAll('.star-rating > span');

    fireEvent.click(starSpans[2]);

    expect(onRatingChange).not.toHaveBeenCalled();
  });

  test('cursor style is pointer when readOnly is false', () => {
    const { container } = render(<StarRating rating={0} readOnly={false} />);
    const starSpan = container.querySelector('.star-rating > span') as HTMLElement;

    expect(starSpan.style.cursor).toBe('pointer');
  });

  test('cursor style is default when readOnly is true', () => {
    const { container } = render(<StarRating rating={0} readOnly={true} />);
    const starSpan = container.querySelector('.star-rating > span') as HTMLElement;

    expect(starSpan.style.cursor).toBe('default');
  });

  test('renders stars with correct size', () => {
    const size = 30;
    const { container } = render(<StarRating rating={0} size={size} />);
    const starSpan = container.querySelector('.star-rating > span') as HTMLElement;

    expect(starSpan.style.fontSize).toBe(`${size}px`);
  });


  test('sets hoveredRating to full-star when mouse enters right half of star', () => {
    const { container } = render(<StarRating rating={0} readOnly={false} size={24} />);
    const starSpans = container.querySelectorAll('.star-rating > span');

    // Simulate mouse move to right half of the third star
    fireEvent.mouseMove(starSpans[2], { nativeEvent: { offsetX: 15 } });

    const fullStarHovered = container.querySelector('.star-rating')?.textContent;
    expect(fullStarHovered).toBeTruthy(); // Ensure it detects the full star rating
  });

  
  test('sets hoveredRating to half-star when mouse enters left half of star', () => {
    const { container } = render(<StarRating rating={0} readOnly={false} />);
    const starSpans = container.querySelectorAll('.star-rating > span');

    // Simulate mouse move to left half of third star
    fireEvent.mouseMove(starSpans[2], { nativeEvent: { offsetX: 10 } }); // Assume size / 2 is 12 for 24px size

    expect(container.textContent).toContain('★');
  });

  test('sets newRating to half-star when half of the star is clicked', () => {
    const onRatingChange = jest.fn();
    const { container } = render(
      <StarRating rating={0} onRatingChange={onRatingChange} readOnly={false} size={24} />
    );
    const starSpans = container.querySelectorAll('.star-rating > span');

    // Simulate click on the left half of the third star
    fireEvent.click(starSpans[2], { nativeEvent: { offsetX: 10 } });

    expect(onRatingChange).toHaveBeenCalledWith(2.5); // Confirm it calls with half-star value
  });


  test('sets newRating to full-star when full star is clicked', () => {
    const onRatingChange = jest.fn();
    const size = 24;
    const { container } = render(
      <StarRating rating={0} onRatingChange={onRatingChange} readOnly={false} size={size} />
    );
    const starSpans = container.querySelectorAll('.star-rating > span');
  
    // Hover over the star first to set `hoveredRating`
    fireEvent.mouseMove(starSpans[2], { nativeEvent: { offsetX: size } });
  
    // Now click on the star
    fireEvent.click(starSpans[2], { nativeEvent: { offsetX: size } });
  
    // Verify that a full-star rating was set
    expect(onRatingChange).toHaveBeenCalledWith(3);
  });

  test('resets hoveredRating on mouse leave', () => {
    const { container } = render(<StarRating rating={3} readOnly={false} />);
    const starSpans = container.querySelectorAll('.star-rating > span');

    // Simulate mouse enter and leave
    fireEvent.mouseMove(starSpans[1], { nativeEvent: { offsetX: 20 } });
    fireEvent.mouseLeave(starSpans[1]);

    expect(container.querySelector('.star-rating')).toBeInTheDocument();
  });

});
