import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import NavBar from '../../src/app/components/NavBar'; // Adjust the path as necessary
import { AuthContext } from '../../src/app/lib/contexts';

// Mock usePathname from Next.js
jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

describe('NavBar Component', () => {
    const mockLogout = jest.fn();
    const mockGetUser = jest.fn();
    const mockLoginUser = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the logo and About link', () => {
        render(
            <AuthContext.Provider
                value={{
                    userData: null,
                    logoutUser: mockLogout,
                    getUser: mockGetUser,
                    loginUser: mockLoginUser,
                }}
            >
                <NavBar />
            </AuthContext.Provider>
        );

        // Logo and About link should always be present
        expect(screen.getByAltText('Logo')).toBeInTheDocument();
        expect(screen.getByText('VandyClassConnect')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should call logoutUser when "Log Out" button is clicked', () => {
        const mockUserData = {
            id: '123',
            username: 'johndoe',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            graduationYear: '2025',
            profilePic: 'profile-pic-url.jpg',
        };

        render(
            <AuthContext.Provider
                value={{
                    userData: mockUserData,
                    logoutUser: mockLogout,
                    getUser: mockGetUser,
                    loginUser: mockLoginUser,
                }}
            >
                <NavBar />
            </AuthContext.Provider>
        );

        fireEvent.click(screen.getByText('Log Out'));
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should highlight the current page link based on pathname', () => {
        (usePathname as jest.Mock).mockReturnValue('/home');

        const mockUserData = {
            id: '123',
            username: 'johndoe',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            graduationYear: '2025',
            profilePic: 'profile-pic-url.jpg',
        };

        render(
            <AuthContext.Provider
                value={{
                    userData: mockUserData,
                    logoutUser: mockLogout,
                    getUser: mockGetUser,
                    loginUser: mockLoginUser,
                }}
            >
                <NavBar />
            </AuthContext.Provider>
        );

        const homeLink = screen.getByText('Home');
        expect(homeLink).toHaveClass('text-white'); // Adjust as necessary to check for active styling
    });
});