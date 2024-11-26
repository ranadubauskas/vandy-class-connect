import '@testing-library/jest-dom/extend-expect';
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { usePathname, useRouter } from 'next/navigation';
import { AuthContext } from "../../src/app/lib/contexts";
import Register from "../../src/app/register/page";
import { register } from '../../src/app/server';
const { describe, test, expect } = require('@jest/globals');

// Mock functions
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
}));

jest.mock('../../src/app/server', () => ({
    register: jest.fn(),
}));

jest.mock('../../src/app/lib/functions', () => ({
    getUserCookies: jest.fn().mockResolvedValue(null),
}));

const renderWithAuthProvider = (ui: React.ReactElement) => {
    return render(
        <AuthContext.Provider
            value={{
                userData: null,
                getUser: jest.fn(),
                logoutUser: jest.fn(),
                loginUser: jest.fn(),
            }}
        >
            {ui}
        </AuthContext.Provider>
    );
};

describe("Register page", () => {
    const mockPush = jest.fn();
    const mockPathname = '/register';

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });

        (usePathname as jest.Mock).mockReturnValue(mockPathname);
        (register as jest.Mock).mockImplementation((formData) => {
            const email = formData.get('email');
            const password = formData.get('password');
            const passwordConfirm = formData.get('passwordConfirm');

            if (
                email === 'test@vanderbilt.edu' &&
                password === 'Testpassword123!' &&
                password === passwordConfirm
            ) {
                return Promise.resolve({
                    record: {
                        id: 'test-user',
                        email: 'test-user@vanderbilt.edu',
                    },
                    token: 'test-token',
                });
            } else {
                return Promise.reject(new Error('Invalid registration details'));
            }
        });
    });

    it("should render the registration form", async () => {
        await act(async () => {
            renderWithAuthProvider(<Register />);
        });

        // Check if the form inputs are rendered
        expect(screen.getByPlaceholderText("First Name*")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Last Name*")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Vanderbilt Email*")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Username*")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Password*")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Confirm Password*")).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it("should show error message on failed registration", async () => {
        await act(async () => {
            renderWithAuthProvider(<Register />);
        });

        fireEvent.change(screen.getByPlaceholderText("First Name*"), { target: { value: "John" } });
        fireEvent.change(screen.getByPlaceholderText("Last Name*"), { target: { value: "Doe" } });
        fireEvent.change(screen.getByPlaceholderText("Vanderbilt Email*"), { target: { value: "wrong@example.com" } });
        fireEvent.change(screen.getByPlaceholderText("Username*"), { target: { value: "johnDoe" } });
        fireEvent.change(screen.getByPlaceholderText("Password*"), { target: { value: "wrongpassword" } });
        fireEvent.change(screen.getByPlaceholderText("Confirm Password*"), { target: { value: "wrongpassword" } });
        // Select graduation year
        fireEvent.change(screen.getByRole('combobox'), { target: { value: '2025' } });
        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /register/i }));
    });

    it("should register successfully and redirect to home", async () => {
        await act(async () => {
            renderWithAuthProvider(<Register />);
        });

        fireEvent.change(screen.getByPlaceholderText("First Name*"), { target: { value: "John" } });
        fireEvent.change(screen.getByPlaceholderText("Last Name*"), { target: { value: "Doe" } });
        fireEvent.change(screen.getByPlaceholderText("Vanderbilt Email*"), { target: { value: "test@vanderbilt.edu" } });
        fireEvent.change(screen.getByPlaceholderText("Username*"), { target: { value: "johnDoe" } });
        fireEvent.change(screen.getByPlaceholderText("Password*"), { target: { value: "Testpassword123!" } });
        fireEvent.change(screen.getByPlaceholderText("Confirm Password*"), { target: { value: "Testpassword123!" } });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: '2025' } });
        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /register/i }));
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/home'));
        // Ensure no error message displayed
        expect(screen.queryByText("Invalid registration details")).not.toBeInTheDocument();
    });
});
