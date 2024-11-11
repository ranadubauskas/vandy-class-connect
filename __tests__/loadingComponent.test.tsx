import { render, screen } from '@testing-library/react';
import Loading from '../src/app/components/Loading'; // Adjust the path as necessary

describe('Loading Component', () => {
  it('should render the loading text', () => {
    render(<Loading />);
    const loadingText = screen.getByText(/loading.../i);
    expect(loadingText).toBeInTheDocument();
  });

  it('should have the correct styles applied', () => {
    render(<Loading />);
    const loadingContainer = screen.getByText(/loading.../i).parentElement;
    expect(loadingContainer).toHaveStyle({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100vh',
      paddingTop: '2rem',
    });
  });
});