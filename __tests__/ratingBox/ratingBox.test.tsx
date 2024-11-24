import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import RatingBox from '../../src/app/components/ratingBox';
const { describe, test, expect } = require('@jest/globals');


describe('RatingBox Component', () => {
  it('displays numeric rating correctly with green background', () => {
    render(<RatingBox rating={4.5} size="large" />);
    const ratingBox = screen.getByText('4.5');
    expect(ratingBox).toBeInTheDocument();
    expect(ratingBox).toHaveClass('bg-green-300');
    expect(ratingBox).toHaveClass('text-lg p-2');
  });

  it('displays string rating correctly with yellow background and small size', () => {
    render(<RatingBox rating="3.2" size="small" />);
    const ratingBox = screen.getByText('3.2');
    expect(ratingBox).toBeInTheDocument();
    expect(ratingBox).toHaveClass('bg-yellow-300');
    expect(ratingBox).toHaveClass('text-sm p-1');
  });

  it('displays "N/A" for numeric rating 0 with gray background', () => {
    render(<RatingBox rating={0} />);
    const ratingBox = screen.getByText('N/A');
    expect(ratingBox).toBeInTheDocument();
    expect(ratingBox).toHaveClass('bg-gray-400');
  });

  it('displays "N/A" for string rating "0" with gray background', () => {
    render(<RatingBox rating="0" />);
    const ratingBox = screen.getByText('N/A');
    expect(ratingBox).toBeInTheDocument();
    expect(ratingBox).toHaveClass('bg-gray-400');
  });

  it('displays red background for rating between 0 and 2', () => {
    render(<RatingBox rating={1.8} />);
    const ratingBox = screen.getByText('1.8');
    expect(ratingBox).toBeInTheDocument();
    expect(ratingBox).toHaveClass('bg-red-400');
  });

  it('displays yellow background for rating between 2 and 4', () => {
    render(<RatingBox rating={2.5} />);
    const ratingBox = screen.getByText('2.5');
    expect(ratingBox).toBeInTheDocument();
    expect(ratingBox).toHaveClass('bg-yellow-300');
  });

  it('displays green background for rating between 4 and 5', () => {
    render(<RatingBox rating={4.9} />);
    const ratingBox = screen.getByText('4.9');
    expect(ratingBox).toBeInTheDocument();
    expect(ratingBox).toHaveClass('bg-green-300');
  });

  it('handles invalid string rating gracefully', () => {
    render(<RatingBox rating="invalid" />);
    const ratingBox = screen.getByText('N/A');
    expect(ratingBox).toBeInTheDocument();
    expect(ratingBox).toHaveClass('bg-gray-400');
  });
});
