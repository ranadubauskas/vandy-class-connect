/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock modules before importing anything that uses them
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../src/app/lib/contexts', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

jest.mock('../src/app/lib/pocketbaseClient', () => {
  const pb = {
    collection: jest.fn(),
  };
  return {
    __esModule: true,
    default: pb,
  };
});

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddReviewPage from '../src/app/addReview/page';
import { useAuth } from '../src/app/lib/contexts';
import pb from '../src/app/lib/pocketbaseClient';

describe('AddReviewPage Component', () => {
  const mockRouterPush = jest.fn();
  const mockGet = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCoursesCollection: any;
  let mockProfessorsCollection: any;
  let mockReviewsCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
    (useAuth as jest.Mock).mockReturnValue({
      userData: {
        id: 'currentUserId',
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    // Create mock collections
    mockCoursesCollection = {
      getOne: jest.fn(),
      update: jest.fn(),
    };
    mockProfessorsCollection = {
      getFullList: jest.fn(),
      create: jest.fn(),
    };
    mockReviewsCollection = {
      create: jest.fn(),
      getFullList: jest.fn(), // Ensure getFullList is mocked here
    };

    // Mock pb.collection to return the appropriate mock collection
    (pb.collection as jest.Mock).mockImplementation((collectionName: string) => {
      if (collectionName === 'courses') {
        return mockCoursesCollection;
      } else if (collectionName === 'professors') {
        return mockProfessorsCollection;
      } else if (collectionName === 'reviews') {
        return mockReviewsCollection;
      } else {
        return {
          getOne: jest.fn(),
          getFullList: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        };
      }
    });
  });

  it('should fetch course details on mount', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    await act(async () => {
      render(<AddReviewPage />);
    });

    await waitFor(() => {
      expect(mockCoursesCollection.getOne).toHaveBeenCalledWith('courseId');
      expect(screen.getByText('CS101: Introduction to Computer Science')).toBeInTheDocument();
    });
  });

  it('should handle file selection for syllabus upload', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    await act(async () => {
      render(<AddReviewPage />);
    });

    const file = new File(['syllabus content'], 'syllabus.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/Upload Syllabus:/i) as HTMLInputElement; // Cast input as HTMLInputElement
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(input.files![0]).toBe(file);
  });

  it('should display error if comment is missing when saving review', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    await act(async () => {
      render(<AddReviewPage />);
    });

    fireEvent.change(screen.getByPlaceholderText('Rating'), { target: { value: '4' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Save Review'));
    });

    expect(screen.getByText('Please provide a comment.')).toBeInTheDocument();
  });

  it('should create a new professor if not found', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockProfessorsCollection.getFullList.mockResolvedValue([]);
    mockProfessorsCollection.create.mockResolvedValue({ id: 'newProfessorId' });
    mockReviewsCollection.create.mockResolvedValue({ id: 'reviewId' });

    await act(async () => {
      render(<AddReviewPage />);
    });

    fireEvent.change(screen.getByPlaceholderText("Professor's First Name"), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText("Professor's Last Name"), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Rating'), { target: { value: '5' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your review here...'), { target: { value: 'Excellent course!' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Save Review'));
    });

    expect(mockProfessorsCollection.create).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      course: 'courseId',
    });
  });

  it('should navigate to course page after saving review successfully', async () => {
    mockGet.mockReturnValue('courseId');

    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };

    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockProfessorsCollection.getFullList.mockResolvedValue([]);
    mockProfessorsCollection.create.mockResolvedValue({ id: 'professorId' });
    mockReviewsCollection.create.mockResolvedValue({ id: 'reviewId' });
    mockCoursesCollection.update.mockResolvedValue({});
    mockReviewsCollection.getFullList.mockResolvedValue([{ rating: 4 }]); // Mock existing reviews

    await act(async () => {
      render(<AddReviewPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('CS101: Introduction to Computer Science')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Rating'), { target: { value: '4' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your review here...'), { target: { value: 'Great course!' } });
    fireEvent.change(screen.getByPlaceholderText("Professor's First Name"), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText("Professor's Last Name"), { target: { value: 'Doe' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Save Review'));
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/course?id=courseId');
    });
  });

  it('should upload syllabus file if provided', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };

    // Set up resolved values for mock functions
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockCoursesCollection.update
      .mockResolvedValueOnce({}) // For the first update call
      .mockResolvedValueOnce({}); // For the syllabus upload
    mockProfessorsCollection.getFullList.mockResolvedValue([]);
    mockProfessorsCollection.create.mockResolvedValue({ id: 'professorId' });
    mockReviewsCollection.create.mockResolvedValue({ id: 'reviewId' });
    mockReviewsCollection.getFullList.mockResolvedValue([]); // Add this line

    // Set up spies to capture any logs
    const consoleSpy = jest.spyOn(console, 'log');
    const consoleErrorSpy = jest.spyOn(console, 'error');

    await act(async () => {
      render(<AddReviewPage />);
    });

    // Fill in the form fields
    fireEvent.change(screen.getByPlaceholderText("Professor's First Name"), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText("Professor's Last Name"), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Rating'), { target: { value: '5' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your review here...'), { target: { value: 'Excellent course!' } });

    // Simulate file selection
    const syllabusFile = new File(['syllabus content'], 'syllabus.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/Upload Syllabus:/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [syllabusFile] } });
    });

    // Assert that the file input has been updated with the selected file
    expect(input.files[0]).toBe(syllabusFile);

    // Trigger the save action
    await act(async () => {
      fireEvent.click(screen.getByText('Save Review'));
    });

    // Verify that update was called with the correct arguments and FormData
    await waitFor(() => {
      expect(mockCoursesCollection.update).toHaveBeenCalledWith('courseId', expect.any(FormData));
    });

    // Check that FormData was properly set up with the syllabus file
    const formDataPassed = mockCoursesCollection.update.mock.calls[1][1];
    expect(formDataPassed.get('syllabus')).toEqual(syllabusFile);

    // Check for any unexpected console output
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    // Clean up the spies
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log an error if fetching course fails', async () => {
    mockGet.mockReturnValue('courseId');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockCoursesCollection.getOne.mockRejectedValue(new Error('Course not found'));

    await act(async () => {
      render(<AddReviewPage />);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching course:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should display error if rating is zero or negative when saving review', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    await act(async () => {
      render(<AddReviewPage />);
    });

    // Setting an invalid rating
    fireEvent.change(screen.getByPlaceholderText('Rating'), { target: { value: '0' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Save Review'));
    });

    expect(screen.getByText('Please provide a valid rating.')).toBeInTheDocument();
  });

  it('should set rating to 0 if invalid input is provided', async () => {
    mockGet.mockReturnValue('courseId');
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    await act(async () => {
      render(<AddReviewPage />);
    });

    // Entering invalid input for rating
    const ratingInput = screen.getByPlaceholderText('Rating') as HTMLInputElement;;
    fireEvent.change(ratingInput, { target: { value: 'invalid' } });

    expect(ratingInput.value).toBe('0');
  });
  it('should navigate back to the course page when clicking "Back to Course Page"', async () => {
    mockGet.mockReturnValue('courseId');

    // Mock valid course data to ensure the page renders correctly
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    await act(async () => {
      render(<AddReviewPage />);
    });

    await waitFor(() => {
      // Ensure the page content is loaded
      expect(screen.getByText('CS101: Introduction to Computer Science')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Back to Course Page'));

    expect(mockRouterPush).toHaveBeenCalledWith('/course?id=courseId');
  });

  it('should set professorId if existing professor is found', async () => {
    mockGet.mockReturnValue('courseId');

    // Mock course and professor data
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };
    const mockExistingProfessor = { id: 'existingProfessorId' };

    // Set up mocks to return existing professor data
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);
    mockProfessorsCollection.getFullList.mockResolvedValue([mockExistingProfessor]);
    mockReviewsCollection.create.mockResolvedValue({ id: 'reviewId' });

    await act(async () => {
      render(<AddReviewPage />);
    });

    // Fill out the form fields
    fireEvent.change(screen.getByPlaceholderText("Professor's First Name"), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText("Professor's Last Name"), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Rating'), { target: { value: '5' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your review here...'), { target: { value: 'Great course!' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Save Review'));
    });

    // Expect that professorId was set to the existing professor's ID
    expect(mockReviewsCollection.create).toHaveBeenCalledWith(expect.objectContaining({
      professors: ['existingProfessorId']
    }));
  });

  it('should update rating using handleRatingChange', async () => {
    mockGet.mockReturnValue('courseId');

    // Mock course data
    const mockCourseData = {
      id: 'courseId',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      professors: [],
      reviews: [],
    };
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    await act(async () => {
      render(<AddReviewPage />);
    });

    // Select the rating input using the new aria-label
    const ratingInput = screen.getByLabelText('Rating Input') as HTMLInputElement;
    fireEvent.change(ratingInput, { target: { value: '3' } });

    // Assert that the rating state was updated
    expect(ratingInput.value).toBe('3');
  });

  it('should update rating using handleRatingChange through StarRating component', async () => {
    mockGet.mockReturnValue('courseId');

    // Mock course data
    const mockCourseData = {
        id: 'courseId',
        code: 'CS101',
        name: 'Introduction to Computer Science',
        professors: [],
        reviews: [],
    };
    mockCoursesCollection.getOne.mockResolvedValue(mockCourseData);

    await act(async () => {
        render(<AddReviewPage />);
    });

    // Ensure the course content is rendered
    await waitFor(() => {
        expect(screen.getByText('CS101: Introduction to Computer Science')).toBeInTheDocument();
    });

    // Simulate a rating change by interacting with the StarRating component
    const starRating = screen.getByLabelText('Star Rating');
    fireEvent.click(starRating, { target: { value: '4' } });

    // Assert that the rating input has been updated
    const ratingInput = screen.getByLabelText('Rating Input') as HTMLInputElement;
    expect(ratingInput.value).toBe('4');
});




});
