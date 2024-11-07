import { fireEvent, render, screen, act } from "@testing-library/react";
import Login from "../src/app/login/page";
import { signIn } from '../src/app/server';
import { AuthProvider } from "../src/app/lib/contexts";

jest.mock('../src/app/server', () => ({
  signIn: jest.fn(),
}));

jest.mock('../src/app/lib/functions', () => ({
  getUserCookies: jest.fn().mockResolvedValue(null),
}));

const renderWithAuthProvider = (ui, options = {}) => {
  return render(<AuthProvider>{ui}</AuthProvider>, options);
};

describe("Login page", () => {
  beforeEach(() => {
    // Cast `signIn` as a Jest mock to access `mockImplementation`
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
});
