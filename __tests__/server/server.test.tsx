import '@testing-library/jest-dom/extend-expect';
import {
    deleteReview,
    editReview,
    editUser,
    getAllCourses,
    getCourseAndReviews,
    getCourseByID,
    getCoursesBySubject,
    getReviewByID,
    getUserByID,
    getUserReviews,
    register,
    signIn,
} from '../../src/app/server';
const { describe, test, expect } = require('@jest/globals');

jest.mock('../../src/app/lib/pocketbaseClient', () => {
    const mockPb = {
        collection: jest.fn().mockReturnThis(),
        authWithPassword: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        getOne: jest.fn(),
        getFullList: jest.fn(),
    };
    return {
        __esModule: true,
        default: mockPb,
    };
});


jest.mock('next/headers', () => {
    const mockCookies = {
        set: jest.fn(),
        get: jest.fn(),
    };
    return {
        __esModule: true,
        cookies: jest.fn(() => mockCookies),
    };
});

describe('Server Functions', () => {
    let mockPb: any;
    let mockCookies: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPb = require('../../src/app/lib/pocketbaseClient').default;
        mockCookies = require('next/headers').cookies();
    });

    describe('getUserReviews', () => {
        it('should return reviews when successful', async () => {
            const userId = 'user123';
            const mockReviews = [{ id: 'rev1' }, { id: 'rev2' }];

            mockPb.collection().getFullList.mockResolvedValue(mockReviews);

            const reviews = await getUserReviews(userId);

            expect(mockPb.collection).toHaveBeenCalledWith('reviews');
            expect(mockPb.collection().getFullList).toHaveBeenCalledWith(200, {
                filter: `user = "${userId}"`,
                expand: 'user,course,professors',
            });
            expect(reviews).toEqual(mockReviews);
        });

        it('should throw an error when getFullList fails', async () => {
            const userId = 'user123';
            const error = new Error('Some error');
            mockPb.collection().getFullList.mockRejectedValue(error);

            await expect(getUserReviews(userId)).rejects.toThrow(error);

            expect(mockPb.collection).toHaveBeenCalledWith('reviews');
            expect(mockPb.collection().getFullList).toHaveBeenCalledWith(200, {
                filter: `user = "${userId}"`,
                expand: 'user,course,professors',
            });
        });
    });

    describe('signIn', () => {
        it('should sign in user and set cookies', async () => {
            const email = 'test@vanderbilt.edu';
            const password = 'password123';

            const userAuthData = {
                record: {
                    id: 'user123',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: email,
                    graduationYear: '2023',
                    username: 'johndoe',
                    profilePic: 'profile.jpg',
                    admin: false,
                },
            };
            const userReviews = [{ id: 'rev1' }, { id: 'rev2' }];

            mockPb.collection().authWithPassword.mockResolvedValue(userAuthData);
            mockPb.collection().getFullList.mockResolvedValue(userReviews);

            const result = await signIn(email, password);

            expect(mockPb.collection).toHaveBeenCalledWith('users');
            expect(mockPb.collection().authWithPassword).toHaveBeenCalledWith(email, password);

            expect(mockCookies.set).toHaveBeenCalledWith('id', 'user123');
            expect(mockCookies.set).toHaveBeenCalledWith('firstName', 'John');
            expect(mockCookies.set).toHaveBeenCalledWith('lastName', 'Doe');
            expect(mockCookies.set).toHaveBeenCalledWith('email', email);
            expect(mockCookies.set).toHaveBeenCalledWith('graduationYear', '2023');
            expect(mockCookies.set).toHaveBeenCalledWith('username', 'johndoe');
            expect(mockCookies.set).toHaveBeenCalledWith('admin', false);

            expect(result).toEqual({
                id: 'user123',
                username: 'johndoe',
                firstName: 'John',
                lastName: 'Doe',
                email: email,
                graduationYear: '2023',
                profilePic: 'profile.jpg',
                admin: false,
            });
        });

        it('should throw error when email or password is missing', async () => {
            await expect(signIn('', 'password')).rejects.toThrow('Invalid email or password');
            await expect(signIn('email', '')).rejects.toThrow('Invalid email or password');
        });

        it('should throw error when authWithPassword fails', async () => {
            const email = 'test@vanderbilt.edu';
            const password = 'password123';
            const error = new Error('Auth failed');

            mockPb.collection().authWithPassword.mockRejectedValue(error);

            await expect(signIn(email, password)).rejects.toThrow(error);

            expect(mockPb.collection().authWithPassword).toHaveBeenCalledWith(email, password);
        });
    });

    describe('register', () => {
        it('should register a new user and set cookies', async () => {
            const formData = new FormData();
            formData.append('username', 'johndoe');
            formData.append('email', 'john.doe@vanderbilt.edu');
            formData.append('password', 'password123');
            formData.append('passwordConfirm', 'password123');
            formData.append('firstName', 'John');
            formData.append('lastName', 'Doe');
            formData.append('graduationYear', '2023');

            const newUser = {
                id: 'user123',
                username: 'johndoe',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@vanderbilt.edu',
                graduationYear: '2023',
                reviews: undefined,
            };

            mockPb.collection().create.mockResolvedValue(newUser);

            const result = await register(formData);

            expect(mockPb.collection).toHaveBeenCalledWith('users');
            expect(mockPb.collection().create).toHaveBeenCalledWith({
                username: 'johndoe',
                email: 'john.doe@vanderbilt.edu',
                emailVisibility: true,
                password: 'password123',
                passwordConfirm: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                graduationYear: '2023',
            });

            expect(mockCookies.set).toHaveBeenCalledWith('id', 'user123');
            expect(mockCookies.set).toHaveBeenCalledWith('username', 'johndoe');
            expect(mockCookies.set).toHaveBeenCalledWith('firstName', 'John');
            expect(mockCookies.set).toHaveBeenCalledWith('lastName', 'Doe');
            expect(mockCookies.set).toHaveBeenCalledWith('email', 'john.doe@vanderbilt.edu');
            expect(mockCookies.set).toHaveBeenCalledWith('graduationYear', '2023');
            expect(mockCookies.set).toHaveBeenCalledWith('reviews', undefined);

            expect(result).toEqual({
                id: 'user123',
                username: 'johndoe',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@vanderbilt.edu',
                graduationYear: '2023',
            });
        });

        it('should throw error if required fields are missing', async () => {
            const formData = new FormData();
            formData.append('username', 'johndoe');
            // Missing other required fields

            await expect(register(formData)).rejects.toThrow('Invalid input. Please provide all required fields.');
        });

        it('should throw error if email is not Vanderbilt email', async () => {
            const formData = new FormData();
            formData.append('username', 'johndoe');
            formData.append('email', 'john.doe@gmail.com');
            formData.append('password', 'password123');
            formData.append('passwordConfirm', 'password123');
            formData.append('firstName', 'John');
            formData.append('lastName', 'Doe');
            formData.append('graduationYear', '2023');

            await expect(register(formData)).rejects.toThrow('Only Vanderbilt email addresses are allowed.');
        });

        it('should throw error if password length less than 8', async () => {
            const formData = new FormData();
            formData.append('username', 'johndoe');
            formData.append('email', 'john.doe@vanderbilt.edu');
            formData.append('password', 'short');
            formData.append('passwordConfirm', 'short');
            formData.append('firstName', 'John');
            formData.append('lastName', 'Doe');
            formData.append('graduationYear', '2023');

            await expect(register(formData)).rejects.toThrow('Password must be at least 8 characters long.');
        });

        it('should throw error if passwords do not match', async () => {
            const formData = new FormData();
            formData.append('username', 'johndoe');
            formData.append('email', 'john.doe@vanderbilt.edu');
            formData.append('password', 'password123');
            formData.append('passwordConfirm', 'password321');
            formData.append('firstName', 'John');
            formData.append('lastName', 'Doe');
            formData.append('graduationYear', '2023');

            await expect(register(formData)).rejects.toThrow('Passwords do not match.');
        });

        it('should throw error if create fails', async () => {
            const formData = new FormData();
            formData.append('username', 'johndoe');
            formData.append('email', 'john.doe@vanderbilt.edu');
            formData.append('password', 'password123');
            formData.append('passwordConfirm', 'password123');
            formData.append('firstName', 'John');
            formData.append('lastName', 'Doe');
            formData.append('graduationYear', '2023');

            const error = new Error("Username or email already exists");
            mockPb.collection().create.mockRejectedValue(error);

            await expect(register(formData)).rejects.toThrow(error);
        });

    });

    describe('editUser', () => {
        it('should edit user and update cookies', async () => {
            const userId = 'user123';
            const data = { firstName: 'Jane', lastName: 'Doe' };
            const updatedUser = {
                id: 'user123',
                username: 'johndoe',
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'john.doe@vanderbilt.edu',
                graduationYear: '2023',
                profilePic: 'profile.jpg',
            };

            mockPb.collection().update.mockResolvedValue(updatedUser);

            const result = await editUser(userId, data);

            expect(mockPb.collection).toHaveBeenCalledWith('users');
            expect(mockPb.collection().update).toHaveBeenCalledWith(userId, data);

            expect(mockCookies.set).toHaveBeenCalledWith('id', 'user123');
            expect(mockCookies.set).toHaveBeenCalledWith('username', 'johndoe');
            expect(mockCookies.set).toHaveBeenCalledWith('firstName', 'Jane');
            expect(mockCookies.set).toHaveBeenCalledWith('lastName', 'Doe');
            expect(mockCookies.set).toHaveBeenCalledWith('email', 'john.doe@vanderbilt.edu');
            expect(mockCookies.set).toHaveBeenCalledWith('graduationYear', '2023');
            expect(mockCookies.set).toHaveBeenCalledWith('profilePic', 'profile.jpg');

            expect(result).toEqual(updatedUser);
        });

        it('should throw error if update fails', async () => {
            const userId = 'user123';
            const data = { firstName: 'Jane', lastName: 'Doe' };
            const error = new Error('Update failed');

            mockPb.collection().update.mockRejectedValue(error);

            await expect(editUser(userId, data)).rejects.toThrow(error);
        });

    });

    describe('getReviewByID', () => {
        it('should return review when successful', async () => {
            const reviewId = 'rev123';
            const review = { id: 'rev123', content: 'Great course' };

            mockPb.collection().getOne.mockResolvedValue(review);

            const result = await getReviewByID(reviewId);

            expect(mockPb.collection).toHaveBeenCalledWith('reviews');
            expect(mockPb.collection().getOne).toHaveBeenCalledWith(reviewId);
            expect(result).toEqual(review);
        });

        it('should throw error if getOne fails', async () => {
            const reviewId = 'rev123';
            const error = new Error('Not found');

            mockPb.collection().getOne.mockRejectedValue(error);

            await expect(getReviewByID(reviewId)).rejects.toThrow(error);
        });
    });

    describe('editReview', () => {
        it('should edit review and update course average rating', async () => {
            const reviewId = 'rev123';
            const data = { content: 'Updated content' };
            const courseId = 'course123';

            const updatedReview = { id: reviewId, ...data };
            const existingReviews = [{ rating: 5 }, { rating: 4 }, { rating: 3 }];

            mockPb.collection().update.mockResolvedValueOnce(updatedReview); // For review update
            mockPb.collection().getFullList.mockResolvedValue(existingReviews);
            mockPb.collection().update.mockResolvedValueOnce({}); // For course update

            const result = await editReview(reviewId, data, courseId);

            expect(mockPb.collection).toHaveBeenCalledWith('reviews');
            expect(mockPb.collection().update).toHaveBeenCalledWith(reviewId, data);

            expect(mockPb.collection().getFullList).toHaveBeenCalledWith({
                filter: `course="${courseId}"`,
            });

            const expectedAvgRating = (5 + 4 + 3) / 3;

            expect(mockPb.collection).toHaveBeenCalledWith('courses');
            expect(mockPb.collection().update).toHaveBeenCalledWith(courseId, {
                averageRating: expectedAvgRating,
            });

            expect(result).toEqual(updatedReview);
        });

        it('should throw error if update fails', async () => {
            const reviewId = 'rev123';
            const data = { content: 'Updated content' };
            const courseId = 'course123';
            const error = new Error('Update failed');

            mockPb.collection().update.mockRejectedValue(error);

            await expect(editReview(reviewId, data, courseId)).rejects.toThrow(error);
        });

        it('should handle empty existingReviews array in editReview', async () => {
            const reviewId = 'rev123';
            const data = { content: 'Updated content', rating: 4 };
            const courseId = 'course123';

            const updatedReview = { id: reviewId, ...data };
            const existingReviews = [updatedReview]; // Include the updated review

            mockPb.collection().update.mockResolvedValueOnce(updatedReview); // For review update
            mockPb.collection().getFullList.mockResolvedValue(existingReviews);
            mockPb.collection().update.mockResolvedValueOnce({}); // For course update

            const result = await editReview(reviewId, data, courseId);

            expect(mockPb.collection).toHaveBeenCalledWith('reviews');
            expect(mockPb.collection().update).toHaveBeenCalledWith(reviewId, data);

            expect(mockPb.collection().getFullList).toHaveBeenCalledWith({
                filter: `course="${courseId}"`,
            });

            const expectedAvgRating = data.rating; // Only the new review

            expect(mockPb.collection).toHaveBeenCalledWith('courses');
            expect(mockPb.collection().update).toHaveBeenCalledWith(courseId, {
                averageRating: expectedAvgRating,
            });

            expect(result).toEqual(updatedReview);
        });
    });

    describe('deleteReview', () => {
        it('should delete review and update course average rating', async () => {
            const reviewId = 'rev123';
            const courseId = 'course123';

            const existingReviews = [{ rating: 5 }, { rating: 4 }];

            mockPb.collection().delete.mockResolvedValue({});
            mockPb.collection().getFullList.mockResolvedValue(existingReviews);
            mockPb.collection().update.mockResolvedValue({});

            const result = await deleteReview(reviewId, courseId);

            expect(mockPb.collection).toHaveBeenCalledWith('reviews');
            expect(mockPb.collection().delete).toHaveBeenCalledWith(reviewId);

            expect(mockPb.collection().getFullList).toHaveBeenCalledWith({
                filter: `course="${courseId}"`,
            });

            const expectedAvgRating = (5 + 4) / 2;

            expect(mockPb.collection).toHaveBeenCalledWith('courses');
            expect(mockPb.collection().update).toHaveBeenCalledWith(courseId, {
                averageRating: expectedAvgRating,
            });

            expect(result).toEqual({});
        });

        it('should throw error if delete fails', async () => {
            const reviewId = 'rev123';
            const courseId = 'course123';
            const error = new Error('Delete failed');

            mockPb.collection().delete.mockRejectedValue(error);

            await expect(deleteReview(reviewId, courseId)).rejects.toThrow(error);
        });

        it('should handle empty existingReviews array in deleteReview', async () => {
            const reviewId = 'rev123';
            const courseId = 'course123';

            const existingReviews = []; // Empty array after deletion

            mockPb.collection().delete.mockResolvedValue({});
            mockPb.collection().getFullList.mockResolvedValue(existingReviews);
            mockPb.collection().update.mockResolvedValue({});

            const result = await deleteReview(reviewId, courseId);

            expect(mockPb.collection).toHaveBeenCalledWith('reviews');
            expect(mockPb.collection().delete).toHaveBeenCalledWith(reviewId);

            expect(mockPb.collection().getFullList).toHaveBeenCalledWith({
                filter: `course="${courseId}"`,
            });

            const expectedAvgRating = 0; // No reviews left

            expect(mockPb.collection).toHaveBeenCalledWith('courses');
            expect(mockPb.collection().update).toHaveBeenCalledWith(courseId, {
                averageRating: expectedAvgRating,
            });

            expect(result).toEqual({});
        });

    });

    describe('getAllCourses', () => {
        it('should return courses when successful', async () => {
            const courses = [{ id: 'course1' }, { id: 'course2' }];

            mockPb.collection().getFullList.mockResolvedValue(courses);

            const result = await getAllCourses();

            expect(mockPb.collection).toHaveBeenCalledWith('courses');
            expect(mockPb.collection().getFullList).toHaveBeenCalledWith({
                sort: '-created',
            });
            expect(result).toEqual(courses);
        });

        it('should return empty array if getFullList fails', async () => {
            const error = new Error('Failed');

            mockPb.collection().getFullList.mockRejectedValue(error);

            const result = await getAllCourses();

            expect(result).toEqual([]);
        });
    });

    describe('getCoursesBySubject', () => {
        it('should return courses filtered by subject', async () => {
            const subject = 'CS';
            const courses = [{ id: 'course1' }, { id: 'course2' }];

            mockPb.collection().getFullList.mockResolvedValue(courses);

            const result = await getCoursesBySubject(subject);

            expect(mockPb.collection).toHaveBeenCalledWith('courses');
            expect(mockPb.collection().getFullList).toHaveBeenCalledWith({
                filter: `subject="${subject}"`,
                sort: '-created',
            });
            expect(result).toEqual(courses);
        });

        it('should return empty array if getFullList fails', async () => {
            const error = new Error('Failed');

            mockPb.collection().getFullList.mockRejectedValue(error);

            const result = await getCoursesBySubject('CS');

            expect(result).toEqual([]);
        });
    });

    describe('getCourseAndReviews', () => {
        it('should return course and expanded reviews when successful', async () => {
            const courseID = 'course123';
            const fetchedCourse = {
                id: courseID,
                name: 'Course Name',
                expand: { reviews: [{ id: 'rev1' }, { id: 'rev2' }] },
            };

            mockPb.collection().getOne.mockResolvedValue(fetchedCourse);

            const result = await getCourseAndReviews(courseID);

            expect(mockPb.collection).toHaveBeenCalledWith('courses');
            expect(mockPb.collection().getOne).toHaveBeenCalledWith(courseID, {
                expand: 'reviews',
            });
            expect(result).toEqual({ course: fetchedCourse, reviews: fetchedCourse.expand.reviews });
        });

        it('should return null if getOne fails', async () => {
            const courseID = 'course123';
            const error = new Error('Not found');

            mockPb.collection().getOne.mockRejectedValue(error);

            const result = await getCourseAndReviews(courseID);

            expect(result).toBeNull();
        });
        it('should handle undefined fetchedCourse.expand in getCourseAndReviews', async () => {
            const courseID = 'course123';
            const fetchedCourse = {
                id: courseID,
                name: 'Course Name',
            };

            mockPb.collection().getOne.mockResolvedValue(fetchedCourse);

            const result = await getCourseAndReviews(courseID);

            expect(mockPb.collection).toHaveBeenCalledWith('courses');
            expect(mockPb.collection().getOne).toHaveBeenCalledWith(courseID, {
                expand: 'reviews',
            });
            expect(result).toEqual({ course: fetchedCourse, reviews: [] });
        });
    });

    describe('getCourseByID', () => {
        it('should return course when successful', async () => {
            const courseID = 'course123';
            const fetchedCourse = { id: courseID, name: 'Course Name' };

            mockPb.collection().getOne.mockResolvedValue(fetchedCourse);

            const result = await getCourseByID(courseID);

            expect(mockPb.collection).toHaveBeenCalledWith('courses');
            expect(mockPb.collection().getOne).toHaveBeenCalledWith(courseID);
            expect(result).toEqual(fetchedCourse);
        });

        it('should return null if getOne fails', async () => {
            const courseID = 'course123';
            const error = new Error('Not found');

            mockPb.collection().getOne.mockRejectedValue(error);

            const result = await getCourseByID(courseID);

            expect(result).toBeNull();
        });
    });

    describe('getUserByID', () => {
        it('should return user when successful', async () => {
            const userId = 'user123';
            const user = { id: userId, firstName: 'John', lastName: 'Doe' };

            mockPb.collection().getOne.mockResolvedValue(user);

            const result = await getUserByID(userId);

            expect(mockPb.collection).toHaveBeenCalledWith('users');
            expect(mockPb.collection().getOne).toHaveBeenCalledWith(userId);
            expect(result).toEqual(user);
        });

        it('should return null if getOne fails', async () => {
            const userId = 'user123';
            const error = new Error('Not found');

            mockPb.collection().getOne.mockRejectedValue(error);

            const result = await getUserByID(userId);

            expect(result).toBeNull();
        });
    });
});
