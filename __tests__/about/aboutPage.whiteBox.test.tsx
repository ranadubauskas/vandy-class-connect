import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import About from '../../src/app/about/page';

// Mocking next/navigation's useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('About Component - White Box Tests', () => {
  const mockRouterBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockRouterBack,
    });
  });

  it('should navigate back when "Back" button is clicked', () => {
    render(<About />);

    // Find and click the "Back" button
    const backButton = screen.getByText('← Back');
    fireEvent.click(backButton);

    // Ensure router.back() was called
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('should render and toggle FAQ items correctly', () => {
    render(<About />);

    // Toggle the first FAQ item
    const firstFaqButton = screen.getByText('What is VandyClassConnect?');
    fireEvent.click(firstFaqButton);

    // Ensure answer is displayed
    expect(
      screen.getByText('VandyClassConnect is a platform designed for Vanderbilt students to review courses, find tutors, and upload/view syllabi.')
    ).toBeInTheDocument();

    // Toggle the first FAQ item again to close it
    fireEvent.click(firstFaqButton);
    expect(
      screen.queryByText('VandyClassConnect is a platform designed for Vanderbilt students to review courses, find tutors, and upload/view syllabi.')
    ).not.toBeInTheDocument();
  });
});