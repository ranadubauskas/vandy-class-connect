import { render, screen } from '@testing-library/react';
import About from '../../src/app/about/page';

describe('About Component - Black Box Tests', () => {
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
});