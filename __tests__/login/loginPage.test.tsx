import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from 'next/navigation';
import { AuthProvider } from "../../src/app/lib/contexts";
import Login from "../../src/app/login/page";
import { getUserByID, getUserReviews, signIn } from '../../src/app/server';

jest.mock('../../src/app/server', () => ({
    signIn: jest.fn(),
    getUserByID: jest.fn(),
    getUserReviews: jest.fn(),
}));

jest.mock('../../src/app/lib/functions', () => ({
    getUserCookies: jest.fn().mockResolvedValue(null),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

const renderWithAuthProvider = (ui, options = {}) => {
    return render(<AuthProvider>{ui}</AuthProvider>, options);
};

describe("Login page", () => {
    const mockPush = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock `signIn` function
        (signIn as jest.Mock).mockImplementation((email: string, password: string) => {
            if (email === 'test@vanderbilt.edu' && password === 'Testpassword123!') {
                return Promise.resolve({
                    id: 'test-user',
                    email: 'test-user@vanderbilt.edu',
                });
            } else {
                return Promise.reject(new Error('Invalid credentials'));
            }
        });

        (getUserByID as jest.Mock).mockResolvedValue({
            id: 'test-user',
            firstName: 'John',
            lastName: 'Doe',
            email: 'test-user@vanderbilt.edu',
        });

        (getUserReviews as jest.Mock).mockResolvedValue([
            { id: 'review1', content: 'Great course!' },
        ]);

        // Mock `useRouter` return value with `push` function
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
    });

    it("should render the login form", async () => {
        await act(async () => {
            renderWithAuthProvider(<Login />);
        });
        expect(screen.getByPlaceholderText("Vanderbilt Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it("should show error message on failed login", async () => {
        await act(async () => {
            renderWithAuthProvider(<Login />);
        });
        fireEvent.change(screen.getByPlaceholderText("Vanderbilt Email"), { target: { value: "invalidemail@example.com" } });
        fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "invalidpassword" } });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        expect(await screen.findByText("Login failed. Please check your credentials.")).toBeInTheDocument();
    });
    it("should call loginUser and navigate to '/home' on successful login", async () => {
        await act(async () => {
            renderWithAuthProvider(<Login />);
        });

        fireEvent.change(screen.getByPlaceholderText("Vanderbilt Email"), {
            target: { value: "test@vanderbilt.edu" },
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "Testpassword123!" },
        });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(signIn).toHaveBeenCalledWith("test@vanderbilt.edu", "Testpassword123!");
            expect(getUserByID).toHaveBeenCalledWith("test-user");
            expect(getUserReviews).toHaveBeenCalledWith("test-user");
            expect(mockPush).toHaveBeenCalledWith("/home");
        });
    });
});
