import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import CourseDetailPage from '../../src/app/course/page';
import { useAuth } from '../../src/app/lib/contexts';
import pb from '../../src/app/lib/pocketbaseClient';

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

jest.mock('../../src/app/lib/contexts', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../src/app/lib/pocketbaseClient', () => {
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
});
