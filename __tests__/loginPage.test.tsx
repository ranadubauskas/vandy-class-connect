import { fireEvent, render, screen } from "@testing-library/react";
import Login from "../src/app/login/page";
import { signIn } from '../src/app/server';
import { AuthProvider } from "../src/app/lib/contexts";

// Mock the 'signIn' function globally before all tests
jest.mock('../src/app/server', () => ({
  signIn: jest.fn(),
}));

const renderWithAuthProvider = (ui: React.ReactElement, options = {}) => {
  return render(<AuthProvider>{ui}</AuthProvider>, options);
};

describe("Login page", () => {
  beforeEach(() => {
    const mockSignIn = jest.fn().mockImplementation((formData) => {
      const email = formData.get('email');
      const password = formData.get('password');
    
      if (email === 'test@vanderbilt.edu' && password === 'Testpassword123!') {
        return Promise.resolve({
          record: {
            id: 'test-user',
            email: 'test-user@vanderbilt.edu',
          },
          token: 'test-token',
        });
      } else {
        return Promise.reject(new Error('Invalid credentials'));
      }
    });
    (signIn as jest.Mock).mockImplementation(mockSignIn);
  });

  it("should render the login form", () => {
    renderWithAuthProvider(<Login />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it("should show error message on failed login", async () => {
    renderWithAuthProvider(<Login />);
        fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "invalidemail@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "invalidpassword" } });
    
    // Simulate submission of form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Expect error message to be dispayed
    expect(await screen.findByText("Login failed. Please check your credentials.")).toBeInTheDocument();
  });
});
