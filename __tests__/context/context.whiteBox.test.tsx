import { render, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../src/app/lib/contexts';
import { getUserCookies } from '../../src/app/lib/functions';

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