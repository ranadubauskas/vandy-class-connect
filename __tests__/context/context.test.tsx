import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { act } from 'react-dom/test-utils';
import { AuthProvider, useAuth } from '../../src/app/lib/contexts';
import { getUserCookies, logout } from '../../src/app/lib/functions';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('../../src/app/lib/functions', () => ({
    getUserCookies: jest.fn(),
    logout: jest.fn(),
}));

describe('AuthContext', () => {
    const mockPush = jest.fn();
    let consoleErrorSpy: jest.SpyInstance;


    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    const TestComponent = () => {
        const { userData, getUser, loginUser, logoutUser } = useAuth();
        return (
            <div>
                <p>User: {userData?.username || 'No user'}</p>
                <button onClick={getUser}>Get User</button>
                <button onClick={() => loginUser({ id: '1', username: 'testUser', firstName: 'Test', lastName: 'User', email: 'test@example.com', graduationYear: '2024', profilePic: 'profile.png' })}>
                    Log In
                </button>
                <button onClick={logoutUser}>Log Out</button>
            </div>
        );
    };

    it('should render AuthProvider and handle login', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByText('User: No user')).toBeInTheDocument();

        // Simulate login
        act(() => {
            screen.getByText('Log In').click();
        });

        await waitFor(() => {
            expect(screen.getByText('User: testUser')).toBeInTheDocument();
        });
    });

    it('should call getUserCookies on mount and set userData if available', async () => {
        (getUserCookies as jest.Mock).mockResolvedValue({
            id: '1',
            username: 'testUser',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            graduationYear: '2024',
            profilePic: 'profile.png',
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('User: testUser')).toBeInTheDocument();
        });
    });

    it('should call getUser to set userData', async () => {
        (getUserCookies as jest.Mock).mockResolvedValue({
            id: '2',
            username: 'getUserTest',
            firstName: 'Get',
            lastName: 'User',
            email: 'getuser@example.com',
            graduationYear: '2025',
            profilePic: 'getuser.png',
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Click to call getUser
        act(() => {
            screen.getByText('Get User').click();
        });

        await waitFor(() => {
            expect(screen.getByText('User: getUserTest')).toBeInTheDocument();
        });
    });

    it('should call logoutUser, clear userData, and redirect to /login', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Simulate login
        act(() => {
            screen.getByText('Log In').click();
        });

        await waitFor(() => {
            expect(screen.getByText('User: testUser')).toBeInTheDocument();
        });

        // Simulate logout
        act(() => {
            screen.getByText('Log Out').click();
        });

        await waitFor(() => {
            expect(screen.getByText('User: No user')).toBeInTheDocument();
            expect(logout).toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('should throw an error if useAuth is called outside of AuthProvider', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const InvalidComponent = () => {
            try {
                useAuth();
            } catch (error) {
                return <p>{error.message}</p>;
            }
            return null;
        };

        render(<InvalidComponent />);
        expect(screen.getByText('useAuth must be used within an AuthProvider')).toBeInTheDocument();

        errorSpy.mockRestore();
    });
    it('should log an error if setUserDataFromCookies encounters an error', async () => {
        const errorMessage = 'Error fetching user cookies';
        (getUserCookies as jest.Mock).mockRejectedValue(new Error(errorMessage));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error setting user data:", expect.any(Error));
        });
    });
});