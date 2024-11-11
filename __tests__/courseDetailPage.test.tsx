// CourseDetailPage.test.tsx

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import CourseDetailPage from '../src/app/course/page';
import { useAuth } from '../src/app/lib/contexts';
import pb from '../src/app/lib/pocketbaseClient';

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
    writable: true,
  });

  // Mock window.open
  global.window.open = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../src/app/lib/contexts', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../src/app/lib/pocketbaseClient', () => {
  const PocketBase = jest.fn().mockImplementation(() => ({
    collection: jest.fn(),
    files: {
      getUrl: jest.fn(),
    },
    autoCancellation: jest.fn(),
  }));

  const pbInstance = new PocketBase();

  return {
    __esModule: true,
    default: pbInstance,
  };
});

describe('CourseDetailPage Component', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCoursesCollection: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockUsersCollection: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockReviewReportsCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });

    (useAuth as jest.Mock).mockReturnValue({
      userData: {
        id: 'currentUserId',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        profilePic: 'profile.jpg',
      },
    });

    mockCoursesCollection = {
      getOne: jest.fn(),
      update: jest.fn(),
    };

    mockUsersCollection = {
      getOne: jest.fn(),
      update: jest.fn(),
    };

    mockReviewReportsCollection = {
      create: jest.fn(),
    };

    pb.collection = jest.fn().mockImplementation((collectionName: string) => {
      if (collectionName === 'courses') {
        return mockCoursesCollection;
      }
      if (collectionName === 'users') {
        return mockUsersCollection;
      }
      if (collectionName === 'reviewReports') {
        return mockReviewReportsCollection;
      }
      return {
        getOne: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      };
    });

    (pb.files.getUrl as jest.Mock).mockImplementation((record, filename) => {
      if (filename === 'review-syllabus.pdf') {
        return 'http://example.com/review-syllabus.pdf';
      }
      return 'http://example.com/syllabus.pdf';
    });
  });

  it('should display the syllabus download button when course has a syllabus', async () => {
    mockGet.mockReturnValue('courseId');

    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      syllabus: 'syllabus.pdf',
      expand: { reviews: [], professors: [] },
      tutors: [],
    };

    (mockCoursesCollection.getOne as jest.Mock).mockResolvedValue(mockCourseData);
    (pb.files.getUrl as jest.Mock).mockReturnValue('http://example.com/syllabus.pdf');

    await act(async () => {
      render(<CourseDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('CS101: Introduction to Computer Science')).toBeInTheDocument();
    });

    expect(pb.files.getUrl).toHaveBeenCalledWith(mockCourseData, 'syllabus.pdf');

    // Verify the "Download Syllabus" button is rendered
    expect(screen.getByText('Download Syllabus')).toBeInTheDocument();

    // Click the "Download Syllabus" button
    fireEvent.click(screen.getByText('Download Syllabus'));

    expect(window.open).toHaveBeenCalledWith('http://example.com/syllabus.pdf', '_blank');
  });

  it('should handle error when reporting a review', async () => {
    mockGet.mockReturnValue('courseId');

    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: {
        reviews: [
          {
            id: 'review1',
            rating: 5,
            comment: 'Excellent course!',
            expand: {
              user: {
                id: 'user1',
                firstName: 'Alice',
                lastName: 'Doe',
                profilePicture: 'user1.jpg',
                email: 'alice@example.com',
              },
            },
          },
        ],
        professors: [],
      },
      tutors: [],
    };

    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    const error = new Error('Create failed');
    mockReviewReportsCollection.create.mockRejectedValue(error);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(<CourseDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Excellent course!')).toBeInTheDocument();
    });

    // Simulate clicking on 'Report Review' button
    const reportButton = screen.getByLabelText('Report Review');
    fireEvent.click(reportButton);

    // Wait for the error to be handled
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error reporting review:', error);
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle error when adding tutor', async () => {
    mockGet.mockReturnValue('courseId');

    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: { reviews: [], professors: [] },
      tutors: [],
    };

    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    const error = new Error('Update failed');
    mockCoursesCollection.update.mockRejectedValue(error);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(<CourseDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Tutor this Course')).toBeInTheDocument();
    });

    // Click on 'Tutor this Course' button
    await act(async () => {
      fireEvent.click(screen.getByText('Tutor this Course'));
    });

    // Wait for the error to be handled
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding tutor:', error);
    });

    consoleErrorSpy.mockRestore();
  });

  it('should filter reviews by selected professor', async () => {
    mockGet.mockReturnValue('courseId');

    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: {
        reviews: [
          {
            id: 'review1',
            rating: 5,
            comment: 'Great course!',
            expand: {
              professors: [
                { id: 'prof1', firstName: 'John', lastName: 'Smith' },
              ],
              user: { id: 'user1', firstName: 'Alice', lastName: 'Doe' },
            },
          },
          {
            id: 'review2',
            rating: 4,
            comment: 'Not bad.',
            expand: {
              professors: [
                { id: 'prof2', firstName: 'Emily', lastName: 'Johnson' },
              ],
              user: { id: 'user2', firstName: 'Bob', lastName: 'Smith' },
            },
          },
        ],
        professors: [
          { id: 'prof1', firstName: 'John', lastName: 'Smith' },
          { id: 'prof2', firstName: 'Emily', lastName: 'Johnson' },
        ],
      },
      tutors: [],
    };

    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    await act(async () => {
      render(<CourseDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Filter by Professor:')).toBeInTheDocument();
    });

    // Select professor "John Smith"
    fireEvent.change(screen.getByLabelText('Filter by Professor:'), {
      target: { value: 'John Smith' },
    });

    await waitFor(() => {
      expect(screen.getByText('Great course!')).toBeInTheDocument();
      expect(screen.queryByText('Not bad.')).not.toBeInTheDocument();
    });

    // expect(
    //   screen.getByText((content, element) => element.textContent === 'Professor: John Smith')
    // ).toBeInTheDocument();

    // expect(
    //   screen.getByText((content, element) => element.textContent === 'Professor:')
    // ).toBeInTheDocument();
    
    // expect(
    //   screen.getByText((content, element) => element.textContent === 'John')
    // ).toBeInTheDocument();
    
    // expect(
    //   screen.getByText((content, element) => element.textContent === 'Smith')
    // ).toBeInTheDocument();

    // Now select professor "Emily Johnson"
    fireEvent.change(screen.getByLabelText('Filter by Professor:'), {
      target: { value: 'Emily Johnson' },
    });

    await waitFor(() => {
      expect(screen.getByText('Not bad.')).toBeInTheDocument();
      expect(screen.queryByText('Great course!')).not.toBeInTheDocument();
    });
  });

  it('should render professor names in reviews', async () => {
    mockGet.mockReturnValue('courseId');

    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: {
        reviews: [
          {
            id: 'review1',
            rating: 5,
            comment: 'Great course!',
            expand: {
              professors: [
                { id: 'prof1', firstName: 'John', lastName: 'Smith' },
              ],
              user: { id: 'user1', firstName: 'Alice', lastName: 'Doe' },
            },
          },
        ],
        professors: [{ id: 'prof1', firstName: 'John', lastName: 'Smith' }],
      },
      tutors: [],
    };

    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    await act(async () => {
      render(<CourseDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Great course!')).toBeInTheDocument();
    });
  });

  it('should open syllabus when "Download Syllabus" button is clicked in a review', async () => {
    mockGet.mockReturnValue('courseId');

    const mockReviewSyllabusUrl = 'http://example.com/review-syllabus.pdf';

    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: {
        reviews: [
          {
            id: 'review1',
            rating: 5,
            comment: 'Excellent course!',
            syllabus: 'review-syllabus.pdf',
            expand: {
              user: {
                id: 'user1',
                firstName: 'Alice',
                lastName: 'Doe',
                profilePicture: 'user1.jpg',
                email: 'alice@example.com',
              },
            },
          },
        ],
        professors: [],
      },
      tutors: [],
    };

    (mockCoursesCollection.getOne as jest.Mock).mockResolvedValue(mockCourseData);
    (pb.files.getUrl as jest.Mock).mockReturnValue('http://example.com/review-syllabus.pdf');

    await act(async () => {
      render(<CourseDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Excellent course!')).toBeInTheDocument();
    });

    // Click the syllabus download button in the review
    const downloadButton = screen.getByTitle('Download Syllabus');
    fireEvent.click(downloadButton);

    expect(pb.files.getUrl).toHaveBeenCalledWith(
      mockCourseData.expand.reviews[0],
      'review-syllabus.pdf'
    );
    expect(window.open).toHaveBeenCalledWith(mockReviewSyllabusUrl, '_blank');
  });

  it('should display "Email copied" message after copying an email', async () => {
    mockGet.mockReturnValue('courseId');
  
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: { reviews: [], professors: [] },
      tutors: ['user1'],
    };
  
    const mockTutorData = {
      id: 'user1',
      firstName: 'TutorFirst',
      lastName: 'TutorLast',
      email: 'tutor@example.com',
      profilePicture: 'tutor.jpg',
    };
  
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockUsersCollection.getOne.mockResolvedValue(mockTutorData);
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    await waitFor(() => {
      expect(screen.getByText('Find a Tutor')).toBeInTheDocument();
    });
  
    // Click to show tutors
    fireEvent.click(screen.getByText('Find a Tutor'));
  
    // Wait for tutor list to display
    await waitFor(() => {
      expect(screen.getByText('Copy Email')).toBeInTheDocument();
    });
  
    // Click the "Copy Email" button
    fireEvent.click(screen.getByText('Copy Email'));
  
    // Check for "Email copied" message
    await waitFor(() => {
      expect(screen.getByText('Email copied')).toBeInTheDocument();
    });
  });

  it('should toggle visibility of tutor list on "Find a Tutor" button click', async () => {
    mockGet.mockReturnValue('courseId');
  
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: { reviews: [], professors: [] },
      tutors: ['user1'], // IDs of tutors
    };
  
    const mockTutorData = {
      id: 'user1',
      firstName: 'TutorFirst',
      lastName: 'TutorLast',
      email: 'tutor@example.com',
      profilePicture: 'tutor.jpg',
    };
  
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockUsersCollection.getOne.mockResolvedValue(mockTutorData);
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    await waitFor(() => {
      expect(screen.getByText('Find a Tutor')).toBeInTheDocument();
    });
  
    // Click to show tutors
    fireEvent.click(screen.getByText('Find a Tutor'));
  
    await waitFor(() => {
      expect(screen.getByText('Tutors')).toBeInTheDocument();
      expect(screen.getByText('TutorFirst TutorLast')).toBeInTheDocument(); // Verify tutor name
    });
  
    // Click again to hide tutors
    fireEvent.click(screen.getByText('Find a Tutor'));
  
    await waitFor(() => {
      expect(screen.queryByText('Tutors')).not.toBeInTheDocument();
    });
  });

  it('should display message if user is already a tutor', async () => {
    mockGet.mockReturnValue('courseId');
  
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: { reviews: [], professors: [] },
      tutors: ['currentUserId'],
    };
  
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    await waitFor(() => {
      expect(screen.getByText('Tutor this Course')).toBeInTheDocument();
    });
  
    // Click "Tutor this Course" button
    fireEvent.click(screen.getByText('Tutor this Course'));
  
    await waitFor(() => {
      expect(screen.getByText('You have already added yourself as a tutor for this course.')).toBeInTheDocument();
    });
  });

  it('should filter reviews based on selected professor', async () => {
    mockGet.mockReturnValue('courseId');
  
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: {
        reviews: [
          {
            id: 'review1',
            rating: 4,
            comment: 'Review for Prof. John Doe',
            expand: {
              professors: [{ id: 'prof1', firstName: 'John', lastName: 'Doe' }],
              user: { id: 'user1', firstName: 'Alice', lastName: 'Smith' },
            },
          },
          {
            id: 'review2',
            rating: 5,
            comment: 'Review for Prof. Emily Doe',
            expand: {
              professors: [{ id: 'prof2', firstName: 'Emily', lastName: 'Doe' }],
              user: { id: 'user2', firstName: 'Bob', lastName: 'Jones' },
            },
          },
        ],
        professors: [
          { id: 'prof1', firstName: 'John', lastName: 'Doe' },
          { id: 'prof2', firstName: 'Emily', lastName: 'Doe' },
        ],
      },
    };
  
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    await waitFor(() => {
      expect(screen.getByText('Filter by Professor:')).toBeInTheDocument();
    });
  
    // Filter by Prof. John Doe
    fireEvent.change(screen.getByLabelText('Filter by Professor:'), { target: { value: 'John Doe' } });
  
    await waitFor(() => {
      expect(screen.getByText('Review for Prof. John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Review for Prof. Emily Doe')).not.toBeInTheDocument();
    });
  });

  it('should add the current user as a tutor when "Tutor this Course" is clicked', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: { reviews: [], professors: [] },
      tutors: [],
    };
    const mockUserData = { id: 'currentUserId', courses_tutored: [] };
  
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockCoursesCollection.update.mockResolvedValue({});
    mockUsersCollection.getOne.mockResolvedValue(mockUserData);
    mockUsersCollection.update.mockResolvedValue({});
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    await waitFor(() => {
      expect(screen.getByText('Tutor this Course')).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByText('Tutor this Course'));
  
    await waitFor(() => {
      expect(mockCoursesCollection.update).toHaveBeenCalledWith('courseId', {
        tutors: ['currentUserId'],
      });
      expect(mockUsersCollection.update).toHaveBeenCalledWith('currentUserId', {
        courses_tutored: ['courseId'],
      });
      expect(screen.getByText('Successfully added as a tutor for this course.')).toBeInTheDocument();
    });
  });

  it('should show "Email copied" message when email is copied', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: { reviews: [], professors: [] },
      tutors: ['user1'],
    };
    const mockTutorData = {
      id: 'user1',
      firstName: 'TutorFirst',
      lastName: 'TutorLast',
      email: 'tutor@example.com',
    };
  
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockUsersCollection.getOne.mockResolvedValue(mockTutorData);
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    fireEvent.click(screen.getByText('Find a Tutor'));
  
    await waitFor(() => {
      expect(screen.getByText('Tutors')).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByText('Copy Email'));
  
    await waitFor(() => {
      expect(screen.getByText('Email copied')).toBeInTheDocument();
    });
  });

  it('should open syllabus URL in a new tab when "Download Syllabus" button is clicked', async () => {
    mockGet.mockReturnValue('courseId');
  
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      syllabus: 'syllabus.pdf',
      expand: { reviews: [], professors: [] },
      tutors: [],
    };
  
    (mockCoursesCollection.getOne as jest.Mock).mockResolvedValue(mockCourseData);
    (pb.files.getUrl as jest.Mock).mockReturnValue('http://example.com/syllabus.pdf');
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    await waitFor(() => {
      expect(screen.getByText('Download Syllabus')).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByText('Download Syllabus'));
    expect(window.open).toHaveBeenCalledWith('http://example.com/syllabus.pdf', '_blank');
  });

  it('should log an error message if fetching the course fails', async () => {
    const error = new Error('Fetch course failed');
    mockCoursesCollection.getOne.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching course:', error);
    });
  
    consoleErrorSpy.mockRestore();
  });

  it('should display a popup message when a review is successfully reported', async () => {
    mockGet.mockReturnValue('courseId');
  
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: {
        reviews: [
          {
            id: 'review1',
            rating: 5,
            comment: 'Excellent course!',
            expand: {
              user: {
                id: 'user1',
                firstName: 'Alice',
                lastName: 'Doe',
                profilePicture: 'user1.jpg',
                email: 'alice@example.com',
              },
            },
          },
        ],
        professors: [],
      },
      tutors: [],
    };
  
    // Mocking the responses
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockReviewReportsCollection.create.mockResolvedValue({});
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    // Wait for the page to load course data and display the review
    await waitFor(() => {
      expect(screen.getByText('Excellent course!')).toBeInTheDocument();
    });
  
    // Simulate reporting a review by clicking the "Report Review" button
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Report Review'));
    });
  
    // Check if the popup message appears
    await waitFor(() => {
      expect(screen.getByText('Review has been reported and will be reviewed further.')).toBeInTheDocument();
    });
  });

  it('should fetch the current user when adding them as a tutor', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      tutors: [],
      expand: { reviews: [], professors: [] },
    };
    const mockUserData = {
      id: 'currentUserId',
      firstName: 'John',
      lastName: 'Doe',
      courses_tutored: [],
    };
  
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockCoursesCollection.update.mockResolvedValue({});
    mockUsersCollection.getOne.mockResolvedValue(mockUserData);
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    fireEvent.click(screen.getByText('Tutor this Course'));
  
    await waitFor(() => {
      expect(mockUsersCollection.getOne).toHaveBeenCalledWith('currentUserId');
    });
  });

  it('should update the user with the new course they are tutoring and show success message', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      tutors: [],
      expand: { reviews: [], professors: [] },
    };
    const mockUserData = {
      id: 'currentUserId',
      courses_tutored: [],
    };
  
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockCoursesCollection.update.mockResolvedValue({});
    mockUsersCollection.getOne.mockResolvedValue(mockUserData);
    mockUsersCollection.update.mockResolvedValue({});
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    fireEvent.click(screen.getByText('Tutor this Course'));
  
    await waitFor(() => {
      expect(mockUsersCollection.update).toHaveBeenCalledWith('currentUserId', {
        courses_tutored: ['courseId'],
      });
      expect(screen.getByText('Successfully added as a tutor for this course.')).toBeInTheDocument();
    });
  });

  it('should navigate to home when "Back to Search Page" button is clicked', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockGet.mockReturnValue('courseId');
  
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      syllabus: 'syllabus.pdf',
      expand: { reviews: [], professors: [] },
      tutors: [],
    };
  
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    // Wait for "Back to Search Page" button to appear
    await waitFor(() => {
      expect(screen.getByText(/Back to Search Page/i)).toBeInTheDocument();
    });
  
    // Click on "Back to Search Page" button
    fireEvent.click(screen.getByText(/Back to Search Page/i));
  
    // Verify navigation
    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('should navigate to add review page with course ID when "Add a Review" button is clicked', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockGet.mockReturnValue('courseId');
  
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: { reviews: [], professors: [] },
      tutors: [],
    };
  
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText('Add a Review')).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByText('Add a Review'));
  
    expect(mockPush).toHaveBeenCalledWith('/addReview?id=courseId');
  });

  it('should close the popup message when "Close" button is clicked', async () => {
    mockGet.mockReturnValue('courseId');
  
    // Updated mock data with a review to ensure the Report Review button appears
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: { 
        reviews: [{ id: 'review1', comment: 'Great course!', rating: 5, expand: { user: { id: 'user1' } } }],
        professors: []
      },
      tutors: [],
    };
  
    // Set up mock responses for course and review report creation
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockReviewReportsCollection.create.mockResolvedValue({});
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    // Wait for the Report Review button to appear
    const reportButton = await screen.findByLabelText('Report Review');
    
    // Simulate clicking the Report Review button to trigger the popup
    fireEvent.click(reportButton);
  
    // Verify the popup message appears
    await waitFor(() => {
      expect(screen.getByText('Review has been reported and will be reviewed further.')).toBeInTheDocument();
    });
  
    // Click the "Close" button to close the popup
    fireEvent.click(screen.getByText('Close'));
  
    // Ensure the popup is removed from the DOM
    await waitFor(() => {
      expect(screen.queryByText('Review has been reported and will be reviewed further.')).not.toBeInTheDocument();
    });
  });

  it('should close the tutor list modal when clicking outside or on the close button', async () => {
    mockGet.mockReturnValue('courseId');
  
    // Updated mock data with a tutor having complete details
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: { reviews: [], professors: [] },
      tutors: ['user1'],
    };
  
    const mockTutorData = [
      { id: 'user1', firstName: 'John', lastName: 'Doe', profilePicture: '/path/to/profile.jpg' }
    ];
  
    // Set up mock responses for course and tutor details
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockUsersCollection.getOne.mockResolvedValueOnce(mockTutorData[0]);
  
    await act(async () => {
      render(<CourseDetailPage />);
    });
  
    await waitFor(() => {
      expect(screen.getByText('Find a Tutor')).toBeInTheDocument();
    });
  
    // Open the tutor list modal
    fireEvent.click(screen.getByText('Find a Tutor'));
  
    await waitFor(() => {
      expect(screen.getByText('Tutors')).toBeInTheDocument();
    });
  
    // Click on the backdrop to close the modal
    fireEvent.click(document.querySelector('.fixed.inset-0.bg-black.opacity-50'));
  
    await waitFor(() => {
      expect(screen.queryByText('Tutors')).not.toBeInTheDocument();
    });
  
    // Re-open the modal to test the close button
    fireEvent.click(screen.getByText('Find a Tutor'));
  
    await waitFor(() => {
      expect(screen.getByText('Tutors')).toBeInTheDocument();
    });
  
    // Click the close button within the modal
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
  
    await waitFor(() => {
      expect(screen.queryByText('Tutors')).not.toBeInTheDocument();
    });
  });


 





});
