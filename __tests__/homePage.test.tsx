import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from 'next/navigation';
import Home from "../src/app/home/page";
import { AuthContext } from "../src/app/lib/contexts";
import { getUserCookies } from '../src/app/lib/functions';
import { getCourses } from '../src/app/server';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(() => '/home'), // Added usePathname mock
}));

jest.mock('../src/app/lib/functions', () => ({
    getUserCookies: jest.fn(),
}));

jest.mock('../src/app/server', () => ({
    getCourses: jest.fn(),
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
            firstName: "Jane",
            lastName: "Doe",
        });

        // Mock getCourses
        (getCourses as jest.Mock).mockResolvedValue([
            {
                id: "1",
                name: "Introduction to Computer Science",
                code: "CS 101",
                averageRating: 4.5,
            },
            {
                id: "2",
                name: "Calculus I",
                code: "MATH 110",
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

        // Wait for user cookies to be fetched
        await waitFor(() => expect(getUserCookies).toHaveBeenCalled());

        // Check if welcome message is displayed
        expect(screen.getByText("Welcome, Jane Doe!", { exact: false })).toBeInTheDocument();
    });

    it("should display loading state initially", () => {
        render(
            <AuthContext.Provider value={null}>
                <Home />
            </AuthContext.Provider>
        );

        // Check for loading text
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

        // Wait for courses to be fetched
        await waitFor(() => expect(getCourses).toHaveBeenCalled());

        // Check if courses are displayed
        expect(screen.getByText("CS 101")).toBeInTheDocument();
        expect(screen.getByText("MATH 110")).toBeInTheDocument();
    });

    it("should filter courses based on search query", async () => {
        render(
            <AuthContext.Provider value={null}>
                <Home />
            </AuthContext.Provider>
        );

        // Wait for courses to be fetched
        await waitFor(() => expect(getCourses).toHaveBeenCalled());

        // Wrap fireEvent in act
        await act(async () => {
            // Simulate user typing in the search bar
            fireEvent.change(screen.getByPlaceholderText("Course Name"), {
                target: { value: "Calculus" },
            });
        });

        // Wait for state updates
        await waitFor(() => {
            expect(
                screen.queryByText("CS 101")
            ).not.toBeInTheDocument();
        });

        // Check that only the matching course is displayed
        expect(screen.getByText("MATH 110")).toBeInTheDocument();
    });

    it("should open and close the filter modal", async () => {
        render(
            <AuthContext.Provider value={null}>
                <Home />
            </AuthContext.Provider>
        );

        // Wait for any async tasks
        await waitFor(() => expect(getCourses).toHaveBeenCalled());

        // Open filter modal
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /filter/i }));
        });

        // Check that modal is displayed
        expect(screen.getByText("Select Subject")).toBeInTheDocument();

        // Close filter modal
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /close filter/i }));
        });

        // Check that modal is closed
        expect(screen.queryByText("Select Subject")).not.toBeInTheDocument();
    });

    it("should apply subject filter", async () => {
        // Mock getCourses to return filtered courses when subjectFilter is 'CS'
        (getCourses as jest.Mock).mockImplementation((subjectFilter) => {
            if (subjectFilter === "CS") {
                return Promise.resolve([
                    {
                        id: "1",
                        name: "Introduction to Computer Science",
                        code: "CS 101",
                        averageRating: 4.5,
                    },
                ]);
            } else {
                return Promise.resolve([
                    {
                        id: "1",
                        name: "Introduction to Computer Science",
                        code: "CS 101",
                        averageRating: 4.5,
                    },
                    {
                        id: "2",
                        name: "Calculus I",
                        code: "MATH 110",
                        averageRating: 4.0,
                    },
                ]);
            }
        });

        render(
            <AuthContext.Provider value={null}>
                <Home />
            </AuthContext.Provider>
        );

        // Wait for initial courses to be fetched
        await waitFor(() => expect(getCourses).toHaveBeenCalledTimes(1));

        // Open filter modal
        fireEvent.click(screen.getByRole('button', { name: /open filter/i }));

        // Select 'CS' from dropdown
        fireEvent.change(screen.getByRole("combobox"), {
            target: { value: "CS" },
        });

        // Apply filter
        fireEvent.click(screen.getByRole("button", { name: /save/i }));

        // Wait for courses to be fetched with new filter
        await waitFor(() => expect(getCourses).toHaveBeenCalledTimes(2));

        // Check that only CS courses are displayed
        expect(
            screen.getByText((content, element) =>
                element.textContent === "CS 101: Introduction to Computer Science"
            )
        ).toBeInTheDocument();
        expect(
            screen.queryByText((content, element) =>
                element.textContent === "MATH 110: Calculus I"
            )
        ).not.toBeInTheDocument();
    });

    it("should navigate to course page when 'View Course' is clicked", async () => {
        render(
            <AuthContext.Provider value={null}>
                <Home />
            </AuthContext.Provider>
        );

        // Wait for courses to be fetched
        await waitFor(() => expect(getCourses).toHaveBeenCalled());

        // Click on 'View Course' button of the first course
        fireEvent.click(screen.getAllByText("View Course")[0]);

        // Check that navigation occurred
        expect(mockPush).toHaveBeenCalledWith("/course?id=1");
    });
});
