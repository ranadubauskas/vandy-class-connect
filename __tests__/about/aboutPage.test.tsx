import '@testing-library/jest-dom/extend-expect';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import About from '../../src/app/about/page';
const { describe, test, expect } = require('@jest/globals');


// Mocking next/navigation's useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('About Component', () => {
  const mockRouterBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockRouterBack,
    });
  });

  it('should render the About page content correctly', () => {
    render(<About />);

    // Check for heading
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();

    // Check for introductory text
    expect(
      screen.getByText(
        /VandyClassConnect is a platform to help Vanderbilt students navigate course registration/i
      )
    ).toBeInTheDocument();

    // Check for FAQ heading
    expect(screen.getByRole('heading', { name: 'FAQ' })).toBeInTheDocument();
  });

  it('should render all FAQ questions', () => {
    render(<About />);

    const faqQuestions = [
      'What is VandyClassConnect?',
      'How can I find a tutor?',
      'Can I leave course reviews?',
      'How do I upload a syllabus?',
    ];

    faqQuestions.forEach((question) => {
      expect(screen.getByText(question)).toBeInTheDocument();
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