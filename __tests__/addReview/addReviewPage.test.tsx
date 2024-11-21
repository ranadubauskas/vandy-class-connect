/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom/extend-expect';
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddReviewPage from '../../src/app/addReview/page';
import { useAuth } from '../../src/app/lib/contexts';
import pb from '../../src/app/lib/pocketbaseClient';
import localforage from 'localforage';

// Mock modules before importing anything that uses them
jest.mock('next/navigation', () => ({
    __esModule: true,
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('../../src/app/lib/contexts', () => ({
    __esModule: true,
    useAuth: jest.fn(),
}));

jest.mock('../../src/app/lib/pocketbaseClient', () => {
    const pb = {
        collection: jest.fn(),
    };
    return {
        __esModule: true,
        default: pb,
    };
});

jest.mock('localforage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

describe('AddReviewPage Component', () => {
    const mockRouterPush = jest.fn();
    const mockRouterBack = jest.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockUsersCollection: any;
    let mockCoursesCollection: any;
    let mockProfessorsCollection: any;
    let mockReviewsCollection: any;

    beforeEach(() => {
        jest.clearAllMocks();
        global.alert = jest.fn();

        (useRouter as jest.Mock).mockReturnValue({
            push: mockRouterPush,
            back:  mockRouterBack,
        });

        // Adjust the mock for useSearchParams
        (useSearchParams as jest.Mock).mockReturnValue({
            get: (key: string) => {
                if (key === 'id') return 'courseId';
                if (key === 'code') return 'CS101';
                return null;
            },
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
            getFirstListItem: jest.fn(),
            update: jest.fn(),
        };
        mockProfessorsCollection = {
            getFullList: jest.fn(),
            create: jest.fn(),
        };
        mockReviewsCollection = {
            create: jest.fn(),
            getFullList: jest.fn(),
        };
        mockUsersCollection = {
            getOne: jest.fn(),
            update: jest.fn(),
        };

        // Mock pb.collection to return the appropriate mock collection
        (pb.collection as jest.Mock).mockImplementation((collectionName: string) => {
            if (collectionName === 'courses') {
                return mockCoursesCollection;
            } else if (collectionName === 'professors') {
                return mockProfessorsCollection;
            } else if (collectionName === 'reviews') {
                return mockReviewsCollection;
            } else if (collectionName === 'users') {
                return mockUsersCollection;
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
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };
        (localforage.getItem as jest.Mock).mockResolvedValue(null);
        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);

        await act(async () => {
            render(<AddReviewPage />);
        });

        await waitFor(() => {
            expect(mockCoursesCollection.getFirstListItem).toHaveBeenCalledWith(
                'code="CS101"',
                {
                    expand: 'reviews.user,reviews.professors,professors',
                    autoCancellation: false,
                }
            );
            expect(screen.getByText('CS101: Introduction to Computer Science')).toBeInTheDocument();
        });
    });

    it('should handle file selection for syllabus upload', async () => {
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };

        (localforage.getItem as jest.Mock).mockResolvedValue(null);
        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);

        await act(async () => {
            render(<AddReviewPage />);
        });

        const file = new File(['syllabus content'], 'syllabus.pdf', { type: 'application/pdf' });
        const input = screen.getByLabelText(/Upload Syllabus:/i) as HTMLInputElement;
        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
        });

        expect(input.files![0]).toBe(file);
    });

    it('should display error if comment is missing when saving review', async () => {
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };

        (localforage.getItem as jest.Mock).mockResolvedValue(null);
        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);

        await act(async () => {
            render(<AddReviewPage />);
        });

        fireEvent.change(screen.getByPlaceholderText('Rating'), { target: { value: '4' } });

        await act(async () => {
            fireEvent.click(screen.getByText('Save Review'));
        });

        expect(screen.getByText('Please provide a comment.')).toBeInTheDocument();
    });

    it('should navigate to course page after saving review successfully', async () => {
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };

        (localforage.getItem as jest.Mock).mockResolvedValue(null);
        const mockUserData = { id: 'userId', reviews: [] };

        // Set up resolved values for all mock functions
        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);
        mockProfessorsCollection.getFullList.mockResolvedValue([]);
        mockProfessorsCollection.create.mockResolvedValue({ id: 'professorId' });
        mockReviewsCollection.create.mockResolvedValue({ id: 'reviewId' });
        mockCoursesCollection.update.mockResolvedValue({});
        mockReviewsCollection.getFullList.mockResolvedValue([{ rating: 4 }]);
        mockUsersCollection.getOne.mockResolvedValue(mockUserData);
        mockUsersCollection.update.mockResolvedValue(mockUserData);

        (useAuth as jest.Mock).mockReturnValue({
            userData: {
                id: 'userId',
                firstName: 'John',
                lastName: 'Doe',
            },
        });

        await act(async () => {
            render(<AddReviewPage />);
        });

        await waitFor(() => {
            expect(screen.getByText('CS101: Introduction to Computer Science')).toBeInTheDocument();
        });

        // Fill in form fields
        fireEvent.change(screen.getByPlaceholderText('Rating'), { target: { value: '4' } });
        fireEvent.change(screen.getByPlaceholderText('Enter your review here...'), { target: { value: 'Great course!' } });
        fireEvent.change(screen.getByPlaceholderText("Professor's First Name"), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText("Professor's Last Name"), { target: { value: 'Doe' } });

        // Trigger the save action
        await act(async () => {
            fireEvent.click(screen.getByText('Save Review'));
        });

        // Verify that router.push was called with the correct URL
        await waitFor(() => {
            expect(mockRouterPush).toHaveBeenCalledWith('/course?id=courseId&code=CS101');
        });

        // Verify that the user's reviews were updated
        await waitFor(() => {
            expect(mockUsersCollection.update).toHaveBeenCalledWith('userId', expect.objectContaining({
                reviews: expect.arrayContaining(['reviewId']),
            }));
        });
    });

    it('should upload syllabus file if provided', async () => {
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };

        // Set up resolved values for all mock functions
        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);
        mockCoursesCollection.update
            .mockResolvedValueOnce({}) // First update for course data
            .mockResolvedValueOnce({}); // Second update for syllabus upload
        mockProfessorsCollection.getFullList.mockResolvedValue([]);
        mockProfessorsCollection.create.mockResolvedValue({ id: 'professorId' });
        mockReviewsCollection.create.mockResolvedValue({ id: 'reviewId' });
        mockReviewsCollection.getFullList.mockResolvedValue([]); // Mock empty existing reviews
        const mockUserData = { id: 'userId', reviews: [] };
        mockUsersCollection.getOne.mockResolvedValue(mockUserData);
        mockUsersCollection.update.mockResolvedValue(mockUserData);

        (useAuth as jest.Mock).mockReturnValue({
            userData: {
                id: 'userId',
                firstName: 'John',
                lastName: 'Doe',
            },
        });

        await act(async () => {
            render(<AddReviewPage />);
        });

        // Fill in form fields to prepare for saving
        fireEvent.change(screen.getByPlaceholderText("Professor's First Name"), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText("Professor's Last Name"), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText('Rating'), { target: { value: '5' } });
        fireEvent.change(screen.getByPlaceholderText('Enter your review here...'), { target: { value: 'Excellent course!' } });

        // Mock file selection for syllabus upload
        const syllabusFile = new File(['syllabus content'], 'syllabus.pdf', { type: 'application/pdf' });
        const input = screen.getByLabelText(/Upload Syllabus:/i) as HTMLInputElement;
        await act(async () => {
            fireEvent.change(input, { target: { files: [syllabusFile] } });
        });

        expect(input.files![0]).toBe(syllabusFile);

        // Trigger the save action
        await act(async () => {
            fireEvent.click(screen.getByText('Save Review'));
        });

        // Check that the first update was called with the new review data
        await waitFor(() => {
            expect(mockCoursesCollection.update).toHaveBeenCalledWith('courseId', expect.objectContaining({
                reviews: expect.any(Array),
                averageRating: expect.any(Number),
                professors: expect.any(Array),
            }));
        });

        // Check that FormData was used in `update` for the syllabus file upload
        const formDataPassed = mockCoursesCollection.update.mock.calls[1][1];
        expect(formDataPassed.get('syllabus')).toEqual(syllabusFile);

        // Verify that the user update call includes the new review
        await waitFor(() => {
            expect(mockUsersCollection.update).toHaveBeenCalledWith('userId', expect.objectContaining({
                reviews: expect.arrayContaining(['reviewId']),
            }));
        });
    });

    it('should display error if rating is zero or negative when saving review', async () => {
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };
        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);

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
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };
        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);

        await act(async () => {
            render(<AddReviewPage />);
        });

        // Entering invalid input for rating
        const ratingInput = screen.getByPlaceholderText('Rating') as HTMLInputElement;
        fireEvent.change(ratingInput, { target: { value: 'invalid' } });

        expect(ratingInput.value).toBe('0');
    });

    it('should navigate back to the course page when clicking "Back to Course Page"', async () => {
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };

        (localforage.getItem as jest.Mock).mockResolvedValue(null);
        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);


        await act(async () => {
            render(<AddReviewPage />);
        });

        await waitFor(() => {
            expect(screen.getByText('CS101: Introduction to Computer Science')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText('Back to Course Page'));

        expect(mockRouterBack).toHaveBeenCalled();
    });

    it('should create a new professor if not found', async () => {
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };
        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);
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

    it('should set professorId if existing professor is found', async () => {
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };
        const mockExistingProfessor = { id: 'existingProfessorId' };

        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);
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
        const mockCourseData = {
            id: 'courseId',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            professors: [],
            reviews: [],
        };
        mockCoursesCollection.getFirstListItem.mockResolvedValue(mockCourseData);

        await act(async () => {
            render(<AddReviewPage />);
        });

        const ratingInput = screen.getByLabelText('Rating Input') as HTMLInputElement;
        fireEvent.change(ratingInput, { target: { value: '3' } });

        // Assert that the rating state was updated
        expect(ratingInput.value).toBe('3');
    });

    it('should log an error if fetching course fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        mockCoursesCollection.getFirstListItem.mockRejectedValue(new Error('Course not found'));

        await act(async () => {
            render(<AddReviewPage />);
        });

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching course:', expect.any(Error));
        });

        consoleErrorSpy.mockRestore();
    });
});