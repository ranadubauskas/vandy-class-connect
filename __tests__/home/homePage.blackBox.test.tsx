import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { RecordModel } from 'pocketbase';
import Home from "../../src/app/home/page";
import { AuthContext } from "../../src/app/lib/contexts";
import { getUserCookies } from '../../src/app/lib/functions';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(() => '/home'),
}));

jest.mock('../../src/app/lib/functions', () => ({
    getUserCookies: jest.fn(),
}));

jest.mock('../../src/app/lib/pocketbaseClient', () => {
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

jest.mock('../../src/app/server');


import { getAllCourses } from '../../src/app/server';

const getAllCoursesMock = getAllCourses as jest.MockedFunction<typeof getAllCourses>;

getAllCoursesMock.mockResolvedValue([
    {
        id: "1",
        name: "Program Design and Data Structures",
        code: "CS 2201",
        subject: "CS",
        averageRating: 4.5,
        collectionId: "coursesCollectionId",
        collectionName: "courses",
        created: "2023-10-01T00:00:00Z",
        updated: "2023-10-01T00:00:00Z",
    } as RecordModel,
    {
        id: "2",
        name: "Methods of Linear Algebra",
        code: "MATH 2410",
        subject: "MATH",
        averageRating: 4.0,
        collectionId: "coursesCollectionId",
        collectionName: "courses",
        created: "2023-10-01T00:00:00Z",
        updated: "2023-10-01T00:00:00Z",
    } as RecordModel,
]);


describe("Home page", () => {
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

    beforeEach(() => {
        jest.clearAllMocks();

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

        // Mock getAllCourses
        getAllCoursesMock.mockResolvedValue([
            {
                id: "1",
                name: "Program Design and Data Structures",
                code: "CS 2201",
                subject: "CS",
                averageRating: 4.5,
                collectionId: "coursesCollectionId",
                collectionName: "courses",
                created: "2023-10-01T00:00:00Z",
                updated: "2023-10-01T00:00:00Z",
            } as RecordModel,
            {
                id: "2",
                name: "Methods of Linear Algebra",
                code: "MATH 2410",
                subject: "MATH",
                averageRating: 4.0,
                collectionId: "coursesCollectionId",
                collectionName: "courses",
                created: "2023-10-01T00:00:00Z",
                updated: "2023-10-01T00:00:00Z",
            } as RecordModel,
        ]);


        getOneMock.mockResolvedValue({
            savedCourses: ['1'],
        });

        updateMock.mockResolvedValue({});

    });

    it("should render the Home component and display user name", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });
        await waitFor(() => expect(getUserCookies).toHaveBeenCalled());
        expect(screen.getByText("Welcome, John Smith!", { exact: false })).toBeInTheDocument();
    });

    it("should display loading state initially", () => {
        render(
            <AuthContext.Provider value={mockAuthContextValue}>
                <Home />
            </AuthContext.Provider>
        );
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should display courses after loading", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
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
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });
        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        await act(async () => {
            // Updated placeholder text to match the component
            fireEvent.change(screen.getByPlaceholderText("Search for a course"), {
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
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });
        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Open filter modal
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /open filter/i }));
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
                <AuthContext.Provider value={mockAuthContextValue}>
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

    it('should add a course to savedCourses when the course is not already saved', async () => {
        await act(async () => {
            render(<Home />);
        });

        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Verify that course '2' is not saved initially
        const saveButton2 = screen.getByTestId('save-button-2');
        userEvent.hover(saveButton2);

        expect(await screen.findByText('Save Course')).toBeInTheDocument();
        // Simulate unhover
        userEvent.unhover(saveButton2);

        // Click the save button for course '2' to save it
        fireEvent.click(saveButton2);

        // Wait for state to update
        await waitFor(() => {
            // Optionally, you can check if the saveButton2 now displays the unsaved icon
            // Or simulate hover again and check the tooltip text
            userEvent.hover(saveButton2);
            expect(screen.getByText('Unsave Course')).toBeInTheDocument();
        });
    });

    it('should apply rating filter and update course list', async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Open filter modal
        fireEvent.click(screen.getByLabelText('Open filter'));

        // Get the filter modal and set rating filter to 4.0
        const filterModal = screen.getByText('Select Filters').closest('div');
        fireEvent.change(within(filterModal).getByLabelText('Minimum Rating:'), { target: { value: '4' } });

        // Apply filter by selecting the specific "Save" button in the modal
        const modalSaveButton = within(filterModal).getByRole('button', { name: /save/i });
        fireEvent.click(modalSaveButton);

        // Verify only courses with rating >= 4.0 are displayed
        expect(screen.getByText('CS 2201')).toBeInTheDocument();
        expect(screen.getByText('MATH 2410')).toBeInTheDocument(); // Both courses have >=4.0
    });

    it("should filter courses by selected subject", async () => {
        // Mock getAllCourses to return courses with a known subject like "CS"
        getAllCoursesMock.mockResolvedValue([
            {
                id: "1",
                name: "Program Design and Data Structures",
                code: "CS 2201",
                subject: "CS",
                averageRating: 4.5,
                collectionId: "coursesCollectionId",
                collectionName: "courses",
                created: "2023-10-01T00:00:00Z",
                updated: "2023-10-01T00:00:00Z",
            } as RecordModel,
            {
                id: "2",
                name: "Methods of Linear Algebra",
                code: "MATH 2410",
                subject: "MATH",
                averageRating: 4.0,
                collectionId: "coursesCollectionId",
                collectionName: "courses",
                created: "2023-10-01T00:00:00Z",
                updated: "2023-10-01T00:00:00Z",
            } as RecordModel,
        ]);

        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        // Wait for courses and course subjects to be loaded
        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Open the filter modal
        fireEvent.click(screen.getByLabelText("Open filter"));

        const filterModal = screen.getByText("Select Filters").closest("div");
        expect(filterModal).not.toBeNull();

        // Check if the "CS" checkbox is displayed in the filter modal
        const csCheckbox = within(filterModal!).getByLabelText("CS");
        expect(csCheckbox).toBeInTheDocument();

        // Select "CS" as a subject filter
        fireEvent.click(csCheckbox);

        // Apply the filter
        fireEvent.click(within(filterModal!).getByRole("button", { name: /save/i }));

        // Verify that only CS courses are displayed
        expect(screen.getByText("CS 2201")).toBeInTheDocument();
        expect(screen.queryByText("MATH 2410")).not.toBeInTheDocument();
    });
});