/* eslint-disable @typescript-eslint/no-explicit-any */
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
        collection: jest.fn().mockImplementation((collectionName) => {
            return {
                getOne: jest.fn(), // Mock getOne as a jest.fn()
                update: jest.fn(), // Mock update as a jest.fn()
                create: jest.fn(),
                getFullList: jest.fn(),
            };
        }),
    };
    return {
        __esModule: true,
        default: pb,
    };
});

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddReviewPage from '../../src/app/addReview/page';
import { useAuth } from '../../src/app/lib/contexts';
import pb from '../../src/app/lib/pocketbaseClient';

describe('AddReviewPage Component', () => {
    const mockRouterPush = jest.fn();
    const mockGet = jest.fn();

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

    it('should update the rating when handleRatingChange is called', async () => {
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

        const ratingInput = screen.getByLabelText('Rating Input') as HTMLInputElement;

        // Simulate a rating change
        fireEvent.change(ratingInput, { target: { value: '3' } });

        // Verify that the rating input reflects the updated value
        expect(ratingInput.value).toBe('3');
    });

});
