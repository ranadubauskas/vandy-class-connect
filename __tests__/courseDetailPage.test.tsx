// __tests__/courseDetailPage.test.tsx

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import CourseDetailPage from '../src/app/course/page';
import { useAuth } from '../src/app/lib/contexts';
import pb from '../src/app/lib/pocketbaseClient';

// Mock dependencies
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
  let mockCoursesCollection: any;
  let mockUsersCollection: any;
  let mockReviewReportsCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });

    // Mock useAuth with sample user data
    (useAuth as jest.Mock).mockReturnValue({
      userData: {
        id: 'currentUserId',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        profilePic: 'profile.jpg',
      },
    });

    // Create mock collections and store references
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

    // Mock PocketBase instance and its methods
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

    pb.files.getUrl = jest.fn();
  });

  it('should display loading state initially', () => {
    mockGet.mockReturnValue('courseId');
    render(<CourseDetailPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render course details correctly', async () => {
    mockGet.mockReturnValue('courseId');

    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      syllabus: 'syllabus.pdf',
      expand: { reviews: [], professors: [] },
      tutors: [],
      averageRating: 4.5,
    };

    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    pb.files.getUrl = jest.fn() as jest.MockedFunction<typeof pb.files.getUrl>;

    await act(async () => {
      render(<CourseDetailPage />);
    });

    // Wrap assertions that involve state updates in waitFor
    await waitFor(() => {
      expect(screen.getByText('CS101: Introduction to Computer Science')).toBeInTheDocument();
    });

    expect(screen.getByText('Add a Review')).toBeInTheDocument();
  });

  it('should handle "Add a Review" button click', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('Add a Review')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add a Review'));
    expect(mockPush).toHaveBeenCalledWith('/addReview?id=courseId');
  });

  it('should display tutors when "Find a Tutor" is clicked', async () => {
    mockGet.mockReturnValue('courseId');

    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      expand: { reviews: [], professors: [] },
      tutors: ['tutorId1', 'tutorId2'],
    };

    const mockTutor1 = {
      id: 'tutorId1',
      firstName: 'Tutor',
      lastName: 'One',
      email: 'tutor1@example.com',
      profilePicture: 'tutor1.jpg',
    };

    const mockTutor2 = {
      id: 'tutorId2',
      firstName: 'Tutor',
      lastName: 'Two',
      email: 'tutor2@example.com',
      profilePicture: 'tutor2.jpg',
    };

    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockUsersCollection.getOne.mockImplementation((userId: string) =>
      userId === 'tutorId1' ? Promise.resolve(mockTutor1) : Promise.resolve(mockTutor2)
    );

    await act(async () => {
      render(<CourseDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Find a Tutor')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Find a Tutor'));

    await waitFor(() => {
      expect(screen.getByText('Tutors')).toBeInTheDocument();
      expect(screen.getByText('Tutor One')).toBeInTheDocument();
      expect(screen.getByText('Tutor Two')).toBeInTheDocument();
    });
  });
});
