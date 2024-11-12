import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SavedCourses from '../src/app/savedCourses/page';
import PocketBase from 'pocketbase';
import userEvent from '@testing-library/user-event';
import { AuthContext } from "../src/app/lib/contexts";
import { getUserCookies } from '../src/app/lib/functions';


//Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(() => '/savedCourses'),
}));
  
jest.mock('../src/app/lib/functions', () => ({
    getUserCookies: jest.fn(),
}));
  
jest.mock('../src/app/lib/pocketbaseClient', () => {
    const collectionMock = jest.fn().mockImplementation((collectionName) => {
        return {
            getOne: getOneMock,
            update: updateMock,
        };
    });
    const pbMock = {
        collection: collectionMock,
    };
    return {
        __esModule: true,
        default: pbMock,
    };
});
const getOneMock = jest.fn();
const updateMock = jest.fn();

jest.mock('../src/app/server', () => ({
    getSavedCourses: jest.fn().mockResolvedValue([
        {
            id: "1",
            name: "Program Design and Data Structures",
            code: "CS 2201",
            averageRating: 4.5,
        },
        {
            id: "2",
            name: "Methods of Linear Algebra",
            code: "MATH 2410",
            averageRating: 4.0,
        },
    ]),
}));

describe("SavedCourses page", () => {
    const mockPush = jest.fn();

    const mockAuthContextValue = {
        userData: {
            id: "123",
            firstName: "John",
            lastName: "Smith",
            username: "johnsmith",
            email: "john.smith@example.com",
            graduationYear: "2024",
            profilePic: "profilePicUrl",
        },
        getUser: jest.fn(),
        logoutUser: jest.fn(),
        loginUser: jest.fn(),
    };

    beforeAll(() => {
        jest.clearAllMocks();
    });

    beforeEach(() => {
        // Mock useRouter
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });

        // Mock getUserCookies
        (getUserCookies as jest.Mock).mockResolvedValue({
            id: "123",
            firstName: "John",
            lastName: "Smith",
        });

        // Mock getOne (getting saved courses for the user)
        getOneMock.mockResolvedValue({
            savedCourses: ["1"], // Simulate that course with ID 1 is saved
        });

        // Mock update function to simulate saving/removing courses
        updateMock.mockResolvedValue({});
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    it("should render the saved courses list correctly", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <SavedCourses />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getUserCookies).toHaveBeenCalled());
        expect(await screen.findByText(/Program Design and Data Structures/i)).toBeInTheDocument();
        expect(await screen.findByText(/Methods of Linear Algebra/i)).toBeInTheDocument();
    });

    it("should display loading state when courses are being fetched", () => {
        render(
            <AuthContext.Provider value={mockAuthContextValue}>
                <SavedCourses />
            </AuthContext.Provider>
        );
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should toggle between edit and save mode when the edit button is clicked", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <SavedCourses />
                </AuthContext.Provider>
            );
        });

        const editButton = screen.getByRole("button", { name: /edit/i });
        expect(editButton).toBeInTheDocument();

        // Test initial state
        expect(editButton).toHaveTextContent("Edit");

        // Click to enable edit mode
        fireEvent.click(editButton);
        expect(editButton).toHaveTextContent("Save Changes");

        // Click to save changes
        fireEvent.click(editButton);
        expect(editButton).toHaveTextContent("Edit");
    });

    it("should open confirmation dialog when removing a course", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <SavedCourses />
                </AuthContext.Provider>
            );
        });

        // Simulate the user entering edit mode
        const editButton = screen.getByRole("button", { name: /edit/i });
        fireEvent.click(editButton);  // Click to enter edit mode

        const removeButton = screen.getAllByRole('button', { name: /unsave course/i })[0];  // Assuming there are multiple courses
        fireEvent.click(removeButton);

        expect(screen.getByText(/are you sure you want to remove this course/i)).toBeInTheDocument();
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);  // Cancel the action

        expect(screen.queryByText(/are you sure you want to remove this course/i)).not.toBeInTheDocument();
    });

    it("should navigate to course page when 'View Course' is clicked", async () => {
        // Mock the course data
        const courses = [
        {
          id: "1",
          name: "Program Design and Data Structures",
          code: "CS 2201",
          averageRating: 4.5,
        },
        {
          id: "2",
          name: "Methods of Linear Algebra",
          code: "MATH 2410",
          averageRating: 4.0,
        },
      ];
  
      // Render the SavedCourses component with mocked courses
      await act(async () => {
        render(
          <AuthContext.Provider value={mockAuthContextValue}>
            <SavedCourses />
          </AuthContext.Provider>
        );
      });
  
      // Simulate clicking the "View Course" button for the first course
      const viewCourseButton = screen.getByText(/View Course/i);
      fireEvent.click(viewCourseButton);
  
      // Assert that the router.push method was called with the correct URL
      expect(mockPush).toHaveBeenCalledWith("/course?id=1");
    });
    

    it("should display loading state initially", () => {
        render(
            <AuthContext.Provider value={mockAuthContextValue}>
                <SavedCourses />
            </AuthContext.Provider>
        );
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

});