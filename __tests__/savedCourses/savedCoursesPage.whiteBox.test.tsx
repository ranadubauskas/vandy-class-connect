import { act, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { getUserCookies } from '../../src/app/lib/functions';
import SavedCourses from '../../src/app/savedCourses/page';



jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(() => '/savedCourses'),
}));

jest.mock('../../src/app/lib/functions', () => ({
    getUserCookies: jest.fn(),
}));

jest.mock('../../src/app/lib/pocketbaseClient', () => ({
    collection: jest.fn().mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
            return {
                getOne: jest.fn().mockResolvedValue({
                    id: "user123",
                    savedCourses: ["1", "2"],
                }),
                update: jest.fn(),
            };
        }
        if (collectionName === 'courses') {
            return {
                getOne: jest.fn().mockImplementation((courseId: string) => {
                    const courses = {
                        "1": { id: "1", name: "Program Design and Data Structures", code: "CS 2201", averageRating: 4.5 },
                        "2": { id: "2", name: "Methods of Linear Algebra", code: "MATH 2410", averageRating: 4.0 },
                    };
                    return Promise.resolve(courses[courseId]);
                }),
                update: jest.fn(),
            };
        }
        return { getOne: jest.fn(), update: jest.fn() }; // Default mock for other collections
    }),
}));

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

describe("SavedCourses page", () => {
    beforeAll(() => {
        jest.clearAllMocks();
    });

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
        (getUserCookies as jest.Mock).mockResolvedValue({
            id: "123",
            firstName: "John",
            lastName: "Smith",
        });
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    it("should toggle edit mode when Edit button is clicked", async () => {
        render(<SavedCourses />);
        const editButton = screen.getByText("Edit");
        
        // Initial state: "Edit" mode off
        expect(editButton.textContent).toBe("Edit");
        
        // Click to toggle to "Save Changes"
        act(() => {
            editButton.click();
        });
        expect(editButton.textContent).toBe("Save Changes");

        // Click again to toggle back to "Edit"
        act(() => {
            editButton.click();
        });
        expect(editButton.textContent).toBe("Edit");
    });

    it("should set error message when fetchCookies fails", async () => {
        // Mock getUserCookies to throw an error
        (getUserCookies as jest.Mock).mockRejectedValue(new Error("Error fetching cookies"));
        
        render(<SavedCourses />);

        // Wait for error message to appear
        await waitFor(() => expect(screen.getByText("Error fetching saved courses")).toBeInTheDocument());
    });
});
