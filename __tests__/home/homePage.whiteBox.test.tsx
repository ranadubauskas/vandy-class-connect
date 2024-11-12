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

    it('should filter courses based on search query when search button is clicked', async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Enter search query
        fireEvent.change(screen.getByPlaceholderText('Search for a course'), { target: { value: 'Program' } });

        // Click the Search button
        fireEvent.click(screen.getByRole('button', { name: /search/i }));

        // Wait for the filtering to take effect
        await waitFor(() => {
            expect(screen.getByText('CS 2201')).toBeInTheDocument();
            expect(screen.queryByText('MATH 2410')).not.toBeInTheDocument();
        });
    });

    it('should handle no user cookies found', async () => {
        (getUserCookies as jest.Mock).mockResolvedValue(null);

        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getUserCookies).toHaveBeenCalled());

        // Since there are no user cookies, welcome message should not display the name
        expect(screen.queryByText('Welcome,', { exact: false })).not.toBeInTheDocument();
    });

    it('should handle error when fetching saved courses', async () => {
        getOneMock.mockRejectedValue(new Error('Fetch error'));

        // Spy on console.error to suppress error output in test
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getOneMock).toHaveBeenCalledTimes(1));

        // Verify that an error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching saved courses:', expect.any(Error));

        consoleErrorSpy.mockRestore();
    });

    it('should handle error when fetching cookies', async () => {
        (getUserCookies as jest.Mock).mockRejectedValue(new Error('Cookies error'));

        // Spy on console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getUserCookies).toHaveBeenCalled());

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching cookies:', expect.any(Error));

        consoleErrorSpy.mockRestore();
    });

    it('should handle error when fetching courses', async () => {
        (getAllCourses as jest.Mock).mockRejectedValue(new Error('Courses error'));

        // Spy on console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching courses:', expect.any(Error));

        // Verify that loading is set to false
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

        consoleErrorSpy.mockRestore();
    });

    it('should handle error when updating saved courses', async () => {
        updateMock.mockRejectedValue(new Error('Update error'));

        // Spy on console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Click the save button for course '2' to save it
        const saveButton2 = screen.getByTestId('save-button-2');
        fireEvent.click(saveButton2);

        // Wait for update to be called
        await waitFor(() =>
            expect(updateMock).toHaveBeenCalledWith('123', {
                savedCourses: ['1', '2'],  // This matches the updated expected value
            })
        );

        // Expect error to be logged
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving course:', expect.any(Error));

        consoleErrorSpy.mockRestore();
    });

    it("should log 'No save courses found' if there are no saved courses", async () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

        // Mock the response to have no saved courses
        getOneMock.mockResolvedValueOnce({ savedCourses: null });

        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledWith("No save courses found"));

        consoleLogSpy.mockRestore();
    });

    it("should toggle temp subject filters when a subject is selected", async () => {
        // Mock the course data to ensure "CS" is present in the subjects
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

        // Wait for courses to load and ensure "CS" appears in subjects
        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Open the filter modal
        fireEvent.click(screen.getByLabelText("Open filter"));

        const filterModal = screen.getByText("Select Filters").closest("div");
        expect(filterModal).not.toBeNull();

        // Ensure "CS" label is present and toggle it on
        const csCheckbox = within(filterModal!).getByLabelText("CS");
        fireEvent.click(csCheckbox);
        expect(csCheckbox).toBeChecked();

        // Toggle "CS" off
        fireEvent.click(csCheckbox);
        expect(csCheckbox).not.toBeChecked();
    });

    it("should remove a course from savedCourses when unsaved", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Simulate clicking the save button for an already saved course (to unsave it)
        const saveButton1 = screen.getByTestId('save-button-1'); // Assuming course with id "1" is saved
        fireEvent.click(saveButton1);

        // Wait for update to be called with course removed
        await waitFor(() =>
            expect(updateMock).toHaveBeenCalledWith("123", {
                savedCourses: [], // Expect savedCourses array to be empty after removing
            })
        );
    });

    it("should add a course to savedCourses when saved", async () => {
        await act(async () => {
            render(
                <AuthContext.Provider value={mockAuthContextValue}>
                    <Home />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Simulate clicking the save button for a course not currently saved
        const saveButton2 = screen.getByTestId('save-button-2'); // Assuming course with id "2" is not saved
        fireEvent.click(saveButton2);

        // Wait for update to be called with course added
        await waitFor(() =>
            expect(updateMock).toHaveBeenCalledWith("123", {
                savedCourses: ["1", "2"], // Expect both courses to be saved
            })
        );
    });

    it("should remove a subject filter when the remove button is clicked", async () => {
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

        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Open the filter modal
        fireEvent.click(screen.getByLabelText("Open filter"));
        const filterModal = screen.getByText("Select Filters").closest("div");

        // Use within() to ensure we target the right "CS" checkbox inside the filter modal
        const csCheckbox = within(filterModal).getByLabelText("CS");
        fireEvent.click(csCheckbox);

        // Save the filter selection
        const saveButton = within(filterModal).getByRole("button", { name: /save/i });
        fireEvent.click(saveButton);

        // Verify the filter is applied and displayed on the main page
        const csFilterTag = screen.getByText("CS", { selector: "span" });
        expect(csFilterTag).toBeInTheDocument();

        // Click the "Remove filter" button for "CS"
        fireEvent.click(screen.getByLabelText("Remove filter CS"));
        expect(screen.queryByText("CS", { selector: "span" })).not.toBeInTheDocument();
    });

    it("should clear the rating filter when the clear button is clicked", async () => {
        // Mock the course data to ensure filtering can occur
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

        // Ensure courses are loaded
        await waitFor(() => expect(getAllCourses).toHaveBeenCalled());

        // Open the filter modal
        fireEvent.click(screen.getByLabelText("Open filter"));

        // Locate and select the rating filter in the modal
        const filterModal = screen.getByText("Select Filters").closest("div");
        expect(filterModal).not.toBeNull();

        const ratingSelect = within(filterModal!).getByLabelText("Minimum Rating:");
        fireEvent.change(ratingSelect, { target: { value: "4" } });

        // Apply the filter by clicking "Save" in the modal
        const saveButton = within(filterModal!).getByRole("button", { name: /save/i });
        fireEvent.click(saveButton);
    });
});