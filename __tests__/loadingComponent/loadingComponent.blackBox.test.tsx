import { render, screen } from '@testing-library/react';
import Loading from '../../src/app/components/Loading'; // Adjust the path as necessary

describe('Loading Component', () => {
    it('should render the loading text', () => {
        render(<Loading />);
        const loadingText = screen.getByText(/loading.../i);
        expect(loadingText).toBeInTheDocument();
    });
});