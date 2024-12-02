import '@testing-library/jest-dom/extend-expect';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { RecordService } from 'pocketbase';
import { AuthContext } from '../../src/app/lib/contexts';
import { getUserCookies } from '../../src/app/lib/functions';
import pb from '../../src/app/lib/pocketbaseClient';
import SavedCourses from '../../src/app/savedCourses/page';


jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/savedCourses'),
}));

jest.mock('../../src/app/lib/functions', () => ({
  getUserCookies: jest.fn(),
}));


const mockPush = jest.fn();
const mockAuthContextValue = {
  userData: {
    id: '123',
    firstName: 'John',
    lastName: 'Smith',
    username: 'johnsmith',
    email: 'john.smith@example.com',
    graduationYear: '2024',
    profilePic: 'profilePicUrl',
  },
  getUser: jest.fn(),
  logoutUser: jest.fn(),
  loginUser: jest.fn(),
};

function createMockRecordService(
  collectionName: string
): jest.Mocked<RecordService<unknown>> {
  const mockRecordService = {
    collectionIdOrName: collectionName,
    baseCrudPath: '',
    baseCollectionPath: '',
    getOne: jest.fn(),
    getFullList: jest.fn(),
    getList: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    authWithPassword: jest.fn(),
    authWithOAuth2: jest.fn(),
    requestPasswordReset: jest.fn(),
    confirmPasswordReset: jest.fn(),
    requestVerification: jest.fn(),
    confirmVerification: jest.fn(),
    requestEmailChange: jest.fn(),
    confirmEmailChange: jest.fn(),
    listAuthMethods: jest.fn(),
    authRefresh: jest.fn(),
    externalAuths: jest.fn(),
    baseCollectionAuthPath: '',
    baseAuthPath: '',
  } as unknown as jest.Mocked<RecordService<unknown>>;

  return mockRecordService;
}


describe('SavedCourses page', () => {
  beforeEach(() => {
    jest.restoreAllMocks(); // Reset all mocks before each test
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (getUserCookies as jest.Mock).mockResolvedValue({
      id: '123',
      firstName: 'John',
      lastName: 'Smith',
    });
  });

  it('should render the saved courses list correctly', async () => {
    jest.spyOn(pb, 'collection').mockImplementation((collectionName: string) => {
      const mockService = createMockRecordService(collectionName);
    
      if (collectionName === 'users') {
        mockService.getOne.mockResolvedValue({
          id: 'user123',
          savedCourses: ['1', '2'],
        });
      }
    
      if (collectionName === 'courses') {
        mockService.getOne.mockImplementation((courseId: string) => {
          const courses = {
            '1': {
              id: '1',
              name: 'Program Design and Data Structures',
              code: 'CS 2201',
              averageRating: 4.5,
            },
            '2': {
              id: '2',
              name: 'Methods of Linear Algebra',
              code: 'MATH 2410',
              averageRating: 4.0,
            },
          };
          return Promise.resolve(courses[courseId]);
        });
      }
    
      return mockService;
    });
    

    render(<SavedCourses />);

    await waitFor(() => {
      expect(screen.getByText('CS 2201')).toBeInTheDocument();
      expect(screen.getByText('MATH 2410')).toBeInTheDocument();
    });
  });

  it('should open confirmation dialog when removing a course', async () => {
    jest.spyOn(pb, 'collection').mockImplementation((collectionName: string) => {
      const mockService = createMockRecordService(collectionName);
    
      if (collectionName === 'users') {
        mockService.getOne.mockResolvedValue({
          id: 'user123',
          savedCourses: ['1', '2'],
        });
      }
    
      if (collectionName === 'courses') {
        mockService.getOne.mockImplementation((courseId: string) => {
          const courses = {
            '1': {
              id: '1',
              name: 'Program Design and Data Structures',
              code: 'CS 2201',
              averageRating: 4.5,
            },
            '2': {
              id: '2',
              name: 'Methods of Linear Algebra',
              code: 'MATH 2410',
              averageRating: 4.0,
            },
          };
          return Promise.resolve(courses[courseId]);
        });
      }
    
      return mockService;
    });

    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <SavedCourses />
      </AuthContext.Provider>
    );

    // Wait for courses to load
    await waitFor(() => expect(screen.getByText('CS 2201')).toBeInTheDocument());

    // Click the unsave-button
    const removeButtons = screen.getAllByTestId('unsave-button');
    fireEvent.click(removeButtons[0]);

    // Verify that the confirmation dialog appears
    expect(
      screen.getByText(/are you sure you want to remove this course/i)
    ).toBeInTheDocument();

    // Close the dialog
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Ensure the dialog is closed
    await waitFor(() =>
      expect(
        screen.queryByText(/are you sure you want to remove this course/i)
      ).not.toBeInTheDocument()
    );
  });

  it('should handle case when userCookies is null', async () => {
    // Mock getUserCookies to return null
    (getUserCookies as jest.Mock).mockResolvedValue(null);

    render(<SavedCourses />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that the message is displayed
    expect(
      screen.getByText('You have no saved courses yet.')
    ).toBeInTheDocument();
  });

  it('should display message when there are no saved courses', async () => {
    // Spy on pb.collection and mock its implementation
    jest.spyOn(pb, 'collection').mockImplementation((collectionName: string) => {
      const mockService = createMockRecordService(collectionName);
    
      if (collectionName === 'users') {
        mockService.getOne.mockResolvedValue({
          id: 'user123',
          savedCourses: ['1', '2'],
        });
      }
    
      if (collectionName === 'courses') {
        mockService.getOne.mockImplementation((courseId: string) => {
          const courses = {
            '1': {
              id: '1',
              name: 'Program Design and Data Structures',
              code: 'CS 2201',
              averageRating: 4.5,
            },
            '2': {
              id: '2',
              name: 'Methods of Linear Algebra',
              code: 'MATH 2410',
              averageRating: 4.0,
            },
          };
          return Promise.resolve(courses[courseId]);
        });
      }
    
      return mockService;
    });
    

    render(<SavedCourses />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('should display "Removing Course..." when course is being removed', async () => {
    const updateMock = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({}), 1000))
      );

      jest.spyOn(pb, 'collection').mockImplementation((collectionName: string) => {
        const mockService = createMockRecordService(collectionName);
      
        if (collectionName === 'users') {
          mockService.getOne.mockResolvedValue({
            id: 'user123',
            savedCourses: ['1', '2'],
          });
        }
      
        if (collectionName === 'courses') {
          mockService.getOne.mockImplementation((courseId: string) => {
            const courses = {
              '1': {
                id: '1',
                name: 'Program Design and Data Structures',
                code: 'CS 2201',
                averageRating: 4.5,
              },
              '2': {
                id: '2',
                name: 'Methods of Linear Algebra',
                code: 'MATH 2410',
                averageRating: 4.0,
              },
            };
            return Promise.resolve(courses[courseId]);
          });
        }
      
        return mockService;
      });
      

    render(<SavedCourses />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('CS 2201')).toBeInTheDocument();
    });

    // Click the unsave-button
    const removeButtons = screen.getAllByTestId('unsave-button');
    fireEvent.click(removeButtons[0]);

    // The confirmation dialog should appear
    expect(
      screen.getByText(/are you sure you want to remove this course/i)
    ).toBeInTheDocument();

    // Click the Remove button
    const removeConfirmButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeConfirmButton);

    // Wait for "Removing Course..." to be displayed
    await waitFor(() => {
      expect(screen.getByText('Removing Course...')).toBeInTheDocument();
    });
  });

  it('should navigate to course page when "View Course" button is clicked', async () => {
    jest.spyOn(pb, 'collection').mockImplementation((collectionName: string) => {
      const mockService = createMockRecordService(collectionName);
    
      if (collectionName === 'users') {
        mockService.getOne.mockResolvedValue({
          id: 'user123',
          savedCourses: ['1', '2'],
        });
      }
    
      if (collectionName === 'courses') {
        mockService.getOne.mockImplementation((courseId: string) => {
          const courses = {
            '1': {
              id: '1',
              name: 'Program Design and Data Structures',
              code: 'CS 2201',
              averageRating: 4.5,
            },
            '2': {
              id: '2',
              name: 'Methods of Linear Algebra',
              code: 'MATH 2410',
              averageRating: 4.0,
            },
          };
          return Promise.resolve(courses[courseId]);
        });
      }
    
      return mockService;
    });
    
    render(<SavedCourses />);

    // Wait for the courses to load
    await waitFor(() => expect(screen.getByText('MATH 2410')).toBeInTheDocument());

    // Click on "View Course" button
    const viewButtons = screen.getAllByText('View Course');
    fireEvent.click(viewButtons[0]);

    // Check that router.push was called with the correct URL
    expect(mockPush).toHaveBeenCalledWith('/course?id=2');
  });

  it('should set error message when fetchCookies fails', async () => {
    // Mock getUserCookies to throw an error
    (getUserCookies as jest.Mock).mockRejectedValue(
      new Error('Error fetching cookies')
    );

    render(<SavedCourses />);

    // Wait for error message to appear
    await waitFor(() =>
      expect(
        screen.getByText('Error fetching saved courses')
      ).toBeInTheDocument()
    );
  });

  it('should remove a course from saved courses', async () => {
    const updateMock = jest.fn().mockResolvedValue({});

    jest.spyOn(pb, 'collection').mockImplementation((collectionName: string) => {
      const mockService = createMockRecordService(collectionName);
    
      if (collectionName === 'users') {
        mockService.getOne.mockResolvedValue({
          id: 'user123',
          savedCourses: ['1', '2'],
        });
      }
    
      if (collectionName === 'courses') {
        mockService.getOne.mockImplementation((courseId: string) => {
          const courses = {
            '1': {
              id: '1',
              name: 'Program Design and Data Structures',
              code: 'CS 2201',
              averageRating: 4.5,
            },
            '2': {
              id: '2',
              name: 'Methods of Linear Algebra',
              code: 'MATH 2410',
              averageRating: 4.0,
            },
          };
          return Promise.resolve(courses[courseId]);
        });
      }
    
      return mockService;
    });

    render(<SavedCourses />);

    // Wait for the courses to load
    await waitFor(() => expect(screen.getByText('MATH 2410')).toBeInTheDocument());

    // Get the number of saved courses before removal
    const coursesBefore = screen.getAllByText(/View Course/i).length;

    // Click the unsave-button
    const removeButtons = screen.getAllByTestId('unsave-button');
    fireEvent.click(removeButtons[0]);

    // Confirm removal in the dialog
    const removeConfirmButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeConfirmButton);
  });
});
