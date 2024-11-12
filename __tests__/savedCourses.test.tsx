import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthContext } from "../src/app/lib/contexts";
import * as functions from '../src/app/lib/functions';
import { getUserCookies } from '../src/app/lib/functions';
import pb from '../src/app/lib/pocketbaseClient';
import SavedCourses from '../src/app/savedCourses/page';


//Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(() => '/savedCourses'),
}));
  
jest.mock('../src/app/lib/functions', () => ({
    getUserCookies: jest.fn(),
}));
jest.mock('../src/app/lib/pocketbaseClient');
jest.mock('../src/app/lib/pocketbaseClient', () => ({
    collection: jest.fn().mockImplementation((collectionName) => {
        if (collectionName === 'users') {
            return {
              getOne: jest.fn().mockResolvedValue({
                id: "user123",
                savedCourses: ["1", "2"],  // Mocked saved course IDs
              }),
            };
          }
          if (collectionName === 'courses') {
            return {
              getOne: jest.fn().mockImplementation((courseId) => {
                const courses = {
                  "1": { id: "1", name: "Program Design and Data Structures", code: "CS 2201", averageRating: 4.5 },
                  "2": { id: "2", name: "Methods of Linear Algebra", code: "MATH 2410", averageRating: 4.0 },
                };
                return Promise.resolve(courses[courseId]);
              }),
              update: jest.fn(), // Mock update as a jest.fn()
            };
          }
        return { getOne: jest.fn() };  // Default mock for any other collection
    }),
}));
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

        const { getByText } = render(<SavedCourses />);
        expect(getByText('Loading...')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText("CS 2201")).toBeInTheDocument());
        await waitFor(() => {
            expect(getByText('CS 2201')).toBeInTheDocument();
            expect(getByText('MATH 2410')).toBeInTheDocument();
          });
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
        fireEvent.click(editButton);  // Click to enter edit mode

        const removeButton = screen.getAllByTestId('unsave-button');  // Assuming there are multiple courses
        fireEvent.click(removeButton[0]);

        expect(screen.getByText(/are you sure you want to remove this course/i)).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);  // Cancel the action

        await waitFor (() => expect(screen.queryByText(/are you sure you want to remove this course/i)).not.toBeInTheDocument());
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
      const viewCourseButton = screen.getAllByText(/View Course/i);
      fireEvent.click(viewCourseButton[0]);
  
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

    it("should save changes when 'Save Changes' is clicked", async () => {
        const mockPush = jest.fn();

        // Mock the course data
        const courses = [
        { id: "1", name: "Program Design and Data Structures", code: "CS 2201", averageRating: 4.5 },
        { id: "2", name: "Methods of Linear Algebra", code: "MATH 2410", averageRating: 4.0 },
        ];

        // Render the SavedCourses component with mocked courses
        await act(async () => {
        render(
        <AuthContext.Provider value={mockAuthContextValue}>
            <SavedCourses />
        </AuthContext.Provider>
        );
        });

        // Simulate the user clicking the "Edit" button to enable edit mode
        const editButton = screen.getByRole("button", { name: /edit/i });
        fireEvent.click(editButton);  // Enter edit mode

        // Simulate clicking "Save Changes"
        const saveButton = screen.getByRole("button", { name: /save changes/i });
        fireEvent.click(saveButton);

        // Assert that "Save Changes" toggles to "Edit" button
        expect(saveButton).toHaveTextContent("Edit");

        // Assert that the course is still present after saving changes (it should not be removed)
        expect(screen.getByText("CS 2201")).toBeInTheDocument();
        });
    
        it("should display a message when there are no saved courses", async () => {
            pb.collection.mockImplementation(() => ({
              getOne: jest.fn().mockResolvedValue({ savedCourses: [] }), // Simulate no saved courses
            }));
          
            render(
              <AuthContext.Provider value={mockAuthContextValue}>
                <SavedCourses />
              </AuthContext.Provider>
            );
          
            await waitFor(() => expect(screen.getByText(/you have no saved courses/i)).toBeInTheDocument());
        });

        // it("should handle error when fetching saved courses fails", async () => {
        //     const mockGetCookies = jest.fn().mockRejectedValue(new Error("Error fetching cookies"));
        //     jest.spyOn(functions, 'getUserCookies').mockImplementation(mockGetCookies);
        
        //     render(<SavedCourses />);
        
        //     await waitFor(() => {
        //       expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        //     });

        //     expect(screen.getByText("Error fetching saved courses")).toBeInTheDocument();
        //   });
        it("should remove course when 'Remove' is clicked in the confirmation dialog", async () => {
            // Mock user cookies with saved courses
            const mockGetCookies = jest.fn().mockResolvedValue({
                savedCourses: ['1'],
                id: 'user123' // Mock user ID for PocketBase
            });
            jest.spyOn(functions, 'getUserCookies').mockImplementation(mockGetCookies);
            
            // Mock PocketBase client and the 'getOne' method to return mock courses
            const mockCourses = [{ id: '1', code: 'CS101', name: 'Intro to Computer Science' }];
            const getOneMock = jest.fn(id => Promise.resolve(mockCourses.find(course => course.id === id)));
            jest.spyOn(pb.collection('courses'), 'getOne').mockImplementation(getOneMock);
            
            // Mock the update method to simulate a successful update
            const updateMock = jest.fn().mockResolvedValue({});
            const mockUsersCollection = {
                update: updateMock,
                getOne: jest.fn() // Optionally mock other methods if needed
              };

              jest.spyOn(pb, 'collection').mockImplementation((name) => {
                if (name === 'users') {
                  return mockUsersCollection;
                }
                return {}; // Mock other collections as needed
              });
          
            // Render the component
            render(<SavedCourses />);
            
            // Wait for the course to load
            await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
            
            const editButton = screen.getByRole("button", { name: /edit/i });
            fireEvent.click(editButton);  // Enter edit mode
            // Click the "Unsave Course" button to open the confirmation dialog
            fireEvent.click(screen.getByTestId("unsave-button"));
            
            // Click the "Remove" button in the confirmation dialog
            fireEvent.click(screen.getByText("Remove"));
            
            // Wait for the course to be removed from the list
            await waitFor(() => expect(screen.queryByText('Intro to Computer Science')).not.toBeInTheDocument());
          });
        
          it("should handle error when fetching saved courses fails", async () => {
            // Mock user cookies to simulate a user being logged in
            const mockGetCookies = jest.fn().mockResolvedValue({
                savedCourses: [],
                id: 'user123' // Mock user ID
            });
            jest.spyOn(functions, 'getUserCookies').mockImplementation(mockGetCookies);
            
            // Mock the PocketBase client to simulate an error when fetching courses
            const fetchSavedCoursesErrorMock = jest.fn().mockRejectedValue(new Error("Error fetching saved courses"));
            
            // Mock the pb.collection('users').getOne method to throw an error
            jest.spyOn(pb.collection('users'), 'getOne').mockImplementation(fetchSavedCoursesErrorMock);
            
            const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
            // Render the component
            render(<SavedCourses />);
            
            // Wait for the loading state to complete and for any error handling to occur
            await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
            
            await waitFor(() => expect(screen.getByText("Error fetching saved courses")).toBeInTheDocument());
    
            // Ensure the fetch error was properly logged
            expect(console.error).toHaveBeenCalledWith("Error fetching saved courses:", expect.any(Error));
            consoleErrorMock.mockRestore();
        });
        

});