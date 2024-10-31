import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from 'next/navigation';
import Home from "../src/app/home/page";
import { AuthContext } from "../src/app/lib/contexts";
import { getUserCookies } from '../src/app/lib/functions';
import { getAllCourses } from '../src/app/server';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(() => '/home'),
}));

jest.mock('../src/app/lib/functions', () => ({
    getUserCookies: jest.fn(),
}));

jest.mock('../src/app/server', () => ({
    getAllCourses: jest.fn().mockResolvedValue([
        {
            id: "1",
            name: "Program Design and Data Structures",
            code: "CS 2201",
            subject: "Computer Science",
            averageRating: 4.5,
        },
        {
            id: "2",
            name: "Methods of Linear Algebra",
            code: "MATH 2410",
            subject: "Mathematics",
            averageRating: 4.0,
        },
    ]),
}));

describe("Home page", () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock useRouter
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });

        // Mock getUserCookies
        (getUserCookies as jest.Mock).mockResolvedValue({
            firstName: "John",
            lastName: "Smith",
        });

        // Mock getAllCourses
        (getAllCourses as jest.Mock).mockResolvedValue([
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
        ]);
    });

    it("should render the Home component and display user name", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={null}>
                    <Home />
                </AuthContext.Provider>
            );
        });
        await waitFor(() => expect(getUserCookies).toHaveBeenCalled());
        expect(screen.getByText("Welcome, John Smith!", { exact: false })).toBeInTheDocument();
    });

    it("should display loading state initially", () => {
        render(
            <AuthContext.Provider value={null}>
                <Home />
            </AuthContext.Provider>
        );
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should display courses after loading", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={null}>
                    <Home />
                </AuthContext.Provider>
            );
        });
        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Check if courses are displayed
        expect(screen.getByText("CS 2201")).toBeInTheDocument();
        expect(screen.getByText("MATH 2410")).toBeInTheDocument();
    });

    it("should filter courses based on search query", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={null}>
                    <Home />
                </AuthContext.Provider>
            );
        });
        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        await act(async () => {
            // Simulate user typing in the search bar
            fireEvent.change(screen.getByPlaceholderText("Course Name"), {
                target: { value: "Linear" },
            });
        });
        await waitFor(() => {
            expect(screen.queryByText("CS 2201")).not.toBeInTheDocument();
        });

        // Check that only the matching course is displayed
        expect(screen.getByText("MATH 2410")).toBeInTheDocument();
    });

    it("should open and close the filter modal", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={null}>
                    <Home />
                </AuthContext.Provider>
            );
        });
        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Open filter modal
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /filter/i }));
        });
        expect(screen.getByText("Select Filters")).toBeInTheDocument();

        // Close filter modal
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /close filter/i }));
        });
        expect(screen.queryByText("Select Filters")).not.toBeInTheDocument();
    });

    it("should navigate to course page when 'View Course' is clicked", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={null}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Clicking on 'View Course' button for the first course
        await act(async () => {
            fireEvent.click(screen.getAllByText("View Course")[0]);
        });
        expect(mockPush).toHaveBeenCalledWith("/course?id=1");
    });
});
