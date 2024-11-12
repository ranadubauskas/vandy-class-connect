// StarRating.test.tsx
import { fireEvent, render } from '@testing-library/react';
import StarRating from '../../src/app/components/StarRating';

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
});
