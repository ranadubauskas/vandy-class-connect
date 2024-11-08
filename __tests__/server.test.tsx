// __tests__/server.test.tsx

import { cookies } from 'next/headers';

// Mocks
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

let mockPb: any = {};

jest.mock('pocketbase', () => {
  const MockPocketBase = jest.fn().mockImplementation(() => {
    mockPb = {
      collection: jest.fn(),
    };
    return mockPb;
  });

  return {
    __esModule: true,
    default: MockPocketBase,
  };
});

// Use 'require' instead of 'import' to control module loading order
const {
  signIn,
  register,
  editUser,
  getReviewByID,
  editReview,
  deleteReview,
  getAllCourses,
  getCoursesBySubject,
  getCourseAndReviews,
} = require('../src/app/server');

describe('Server Functions', () => {
  const mockCookies = {
    set: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockReturnValue(mockCookies);
  });

  describe('signIn', () => {
    it('should sign in a user and set cookies', async () => {
      const email = 'test-user@vanderbilt.edu';
      const password = 'Testpass123!';

      const mockUserAuthData = {
        record: {
          id: '1234',
          firstName: 'testFirstName',
          lastName: 'testLastName',
          email: 'test-user@vanderbilt.edu',
          graduationYear: '2024',
          username: 'testuser',
          profilePic: 'pic.jpg',
        },
      };

      const mockUserWithReviews = {
        expand: {
          reviews: ['review1', 'review2'],
        },
      };

      // Set up mock methods
      const mockUsersCollection = {
        authWithPassword: jest.fn().mockResolvedValue(mockUserAuthData),
        getOne: jest.fn().mockResolvedValue(mockUserWithReviews),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return mockUsersCollection;
        }
        return {};
      });

      const result = await signIn(email, password);

      expect(mockPb.collection).toHaveBeenCalledWith('users');
      expect(mockUsersCollection.authWithPassword).toHaveBeenCalledWith(email, password);
      expect(mockCookies.set).toHaveBeenCalledWith('id', '1234');
      expect(mockCookies.set).toHaveBeenCalledWith('firstName', 'testFirstName');
      expect(mockCookies.set).toHaveBeenCalledWith('lastName', 'testLastName');
      expect(mockCookies.set).toHaveBeenCalledWith('email', 'test-user@vanderbilt.edu');
      expect(mockCookies.set).toHaveBeenCalledWith('graduationYear', '2024');
      expect(mockCookies.set).toHaveBeenCalledWith('username', 'testuser');
      expect(result).toEqual({
        id: '1234',
        username: 'testuser',
        firstName: 'testFirstName',
        lastName: 'testLastName',
        email: 'test-user@vanderbilt.edu',
        graduationYear: '2024',
        profilePic: 'pic.jpg',
      });
    });

    it('should throw an error if email or password is missing', async () => {
      const email = 'test-user@vanderbilt.edu';
      const password = undefined; // Missing password

      await expect(signIn(email, password)).rejects.toThrow();
    });

    it('should handle authentication errors', async () => {
      const email = 'test@example.com';
      const password = 'Testpass123!';

      // Set up mock methods
      const mockUsersCollection = {
        authWithPassword: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return mockUsersCollection;
        }
        return {};
      });

      await expect(signIn(email, password)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register a new user and set cookies', async () => {
      const formData = new FormData();
      formData.set('username', 'testuser');
      formData.set('email', 'test-user@vanderbilt.edu');
      formData.set('password', 'Testpass123!');
      formData.set('passwordConfirm', 'Testpass123!');
      formData.set('firstName', 'testFirstName');
      formData.set('lastName', 'testLastName');
      formData.set('graduationYear', '2024');

      const mockUser = {
        id: '1234',
        username: 'testuser',
        firstName: 'testFirstName',
        lastName: 'testLastName',
        email: 'test-user@vanderbilt.edu',
        graduationYear: '2024',
        profilePic: null,
      };

      // Set up mock methods
      const mockUsersCollection = {
        create: jest.fn().mockResolvedValue(mockUser),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return mockUsersCollection;
        }
        return {};
      });

      const result = await register(formData);

      expect(mockPb.collection).toHaveBeenCalledWith('users');
      expect(mockUsersCollection.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test-user@vanderbilt.edu',
        emailVisibility: true,
        password: 'Testpass123!',
        passwordConfirm: 'Testpass123!',
        firstName: 'testFirstName',
        lastName: 'testLastName',
        graduationYear: '2024',
      });
      expect(mockCookies.set).toHaveBeenCalledWith('id', '1234');
      expect(mockCookies.set).toHaveBeenCalledWith('username', 'testuser');
      expect(mockCookies.set).toHaveBeenCalledWith('firstName', 'testFirstName');
      expect(mockCookies.set).toHaveBeenCalledWith('lastName', 'testLastName');
      expect(mockCookies.set).toHaveBeenCalledWith('email', 'test-user@vanderbilt.edu');
      expect(mockCookies.set).toHaveBeenCalledWith('graduationYear', '2024');
      expect(mockCookies.set).toHaveBeenCalledWith('profilePic', null);
      expect(mockCookies.set).toHaveBeenCalledWith('reviews', undefined);
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if required fields are missing', async () => {
      const formData = new FormData();
      formData.set('username', 'testuser');
      // Missing other required fields

      await expect(register(formData)).rejects.toThrow('Invalid input. Please provide all required fields.');
    });

    it('should throw an error if email is not a Vanderbilt email', async () => {
      const formData = new FormData();
      formData.set('username', 'testuser');
      formData.set('email', 'test-user@example.com'); // Non-Vanderbilt email
      formData.set('password', 'Testpass123!');
      formData.set('passwordConfirm', 'Testpass123!');
      formData.set('firstName', 'testFirstName');
      formData.set('lastName', 'testLastName');
      formData.set('graduationYear', '2024');

      await expect(register(formData)).rejects.toThrow('Only Vanderbilt email addresses are allowed.');
    });

    it('should throw an error if passwords do not match', async () => {
      const formData = new FormData();
      formData.set('username', 'testuser');
      formData.set('email', 'test-user@vanderbilt.edu');
      formData.set('password', 'Testpass123!');
      formData.set('passwordConfirm', 'DifferentPass!'); // Mismatched password
      formData.set('firstName', 'testFirstName');
      formData.set('lastName', 'testLastName');
      formData.set('graduationYear', '2024');

      await expect(register(formData)).rejects.toThrow('Passwords do not match.');
    });
  });

  describe('editUser', () => {
    it('should edit a user and update cookies', async () => {
      const userId = 'userId';
      const data = { firstName: 'Jane', lastName: 'Doe' };

      const mockUser = {
        id: '1234',
        username: 'testuser',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'test-user@vanderbilt.edu',
        graduationYear: '2024',
        profilePic: 'pic.jpg',
      };

      const mockUsersCollection = {
        update: jest.fn().mockResolvedValue(mockUser),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return mockUsersCollection;
        }
        return {};
      });

      const result = await editUser(userId, data);

      expect(mockPb.collection).toHaveBeenCalledWith('users');
      expect(mockUsersCollection.update).toHaveBeenCalledWith(userId, data);
      expect(mockCookies.set).toHaveBeenCalledWith('id', '1234');
      expect(mockCookies.set).toHaveBeenCalledWith('username', 'testuser');
      expect(mockCookies.set).toHaveBeenCalledWith('firstName', 'Jane');
      expect(mockCookies.set).toHaveBeenCalledWith('lastName', 'Doe');
      expect(mockCookies.set).toHaveBeenCalledWith('email', 'test-user@vanderbilt.edu');
      expect(mockCookies.set).toHaveBeenCalledWith('graduationYear', '2024');
      expect(mockCookies.set).toHaveBeenCalledWith('profilePic', 'pic.jpg');
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if update fails', async () => {
      const userId = 'userId';
      const data = { firstName: 'Jane', lastName: 'Doe' };

      const mockUsersCollection = {
        update: jest.fn().mockRejectedValue(new Error('Update failed')),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return mockUsersCollection;
        }
        return {};
      });

      await expect(editUser(userId, data)).rejects.toThrow('Update failed');
    });
  });

  describe('getReviewByID', () => {
    it('should return a review by ID', async () => {
      const reviewId = 'reviewId';
      const mockReview = { id: 'reviewId', content: 'Great course!' };

      const mockReviewsCollection = {
        getOne: jest.fn().mockResolvedValue(mockReview),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'reviews') {
          return mockReviewsCollection;
        }
        return {};
      });

      const review = await getReviewByID(reviewId);

      expect(mockPb.collection).toHaveBeenCalledWith('reviews');
      expect(mockReviewsCollection.getOne).toHaveBeenCalledWith(reviewId);
      expect(review).toEqual(mockReview);
    });

    it('should throw an error if fetching review fails', async () => {
      const reviewId = 'reviewId';

      const mockReviewsCollection = {
        getOne: jest.fn().mockRejectedValue(new Error('Review not found')),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'reviews') {
          return mockReviewsCollection;
        }
        return {};
      });

      await expect(getReviewByID(reviewId)).rejects.toThrow('Review not found');
    });
  });

  describe('editReview', () => {
    it('should edit a review', async () => {
      const reviewId = 'reviewId';
      const data = { content: 'Updated review content' };

      const mockReview = {
        id: 'reviewId',
        content: 'Updated review content',
      };

      const mockReviewsCollection = {
        update: jest.fn().mockResolvedValue(mockReview),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'reviews') {
          return mockReviewsCollection;
        }
        return {};
      });

      const review = await editReview(reviewId, data);

      expect(mockPb.collection).toHaveBeenCalledWith('reviews');
      expect(mockReviewsCollection.update).toHaveBeenCalledWith(reviewId, data);
      expect(review).toEqual(mockReview);
    });

    it('should throw an error if updating review fails', async () => {
      const reviewId = 'reviewId';
      const data = { content: 'Updated review content' };

      const mockReviewsCollection = {
        update: jest.fn().mockRejectedValue(new Error('Update failed')),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'reviews') {
          return mockReviewsCollection;
        }
        return {};
      });

      await expect(editReview(reviewId, data)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      const reviewId = 'reviewId';

      const mockReviewsCollection = {
        delete: jest.fn().mockResolvedValue({}),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'reviews') {
          return mockReviewsCollection;
        }
        return {};
      });

      const result = await deleteReview(reviewId);

      expect(mockPb.collection).toHaveBeenCalledWith('reviews');
      expect(mockReviewsCollection.delete).toHaveBeenCalledWith(reviewId);
      expect(result).toEqual({});
    });

    it('should throw an error if deleting review fails', async () => {
      const reviewId = 'reviewId';

      const mockReviewsCollection = {
        delete: jest.fn().mockRejectedValue(new Error('Delete failed')),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'reviews') {
          return mockReviewsCollection;
        }
        return {};
      });

      await expect(deleteReview(reviewId)).rejects.toThrow('Delete failed');
    });
  });

  describe('getAllCourses', () => {
    it('should return all courses when no subject is provided', async () => {
      const mockCourses = [
        { id: '1', name: 'Course 1', subject: 'CS' },
        { id: '2', name: 'Course 2', subject: 'MATH' },
      ];

      const mockCoursesCollection = {
        getFullList: jest.fn().mockResolvedValue(mockCourses),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'courses') {
          return mockCoursesCollection;
        }
        return {};
      });

      const courses = await getAllCourses();

      expect(mockPb.collection).toHaveBeenCalledWith('courses');
      expect(mockCoursesCollection.getFullList).toHaveBeenCalledWith({
        sort: '-created',
      });
      expect(courses).toEqual(mockCourses);
    });
  });

  describe('getCoursesBySubject', () => {
    it('should filter courses by subject', async () => {
      const subject = 'CS';
      const mockCourses = [{ id: '1', name: 'Course 1', subject: 'CS' }];

      const mockCoursesCollection = {
        getFullList: jest.fn().mockResolvedValue(mockCourses),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'courses') {
          return mockCoursesCollection;
        }
        return {};
      });

      const courses = await getCoursesBySubject(subject);

      expect(mockPb.collection).toHaveBeenCalledWith('courses');
      expect(mockCoursesCollection.getFullList).toHaveBeenCalledWith({
        filter: `subject="${subject}"`,
        sort: '-created',
      });
      expect(courses).toEqual(mockCourses);
    });

    it('should return an empty array if fetching courses fails', async () => {
      const mockCoursesCollection = {
        getFullList: jest.fn().mockRejectedValue(new Error('Fetch failed')),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'courses') {
          return mockCoursesCollection;
        }
        return {};
      });

      const courses = await getCoursesBySubject();

      expect(courses).toEqual([]);
    });
  });

  describe('getCourseAndReviews', () => {
    it('should return course and expanded reviews', async () => {
      const courseID = 'courseId';
      const mockCourse = {
        id: 'courseId',
        name: 'Course Name',
        expand: {
          reviews: ['review1', 'review2'],
        },
      };

      const mockCoursesCollection = {
        getOne: jest.fn().mockResolvedValue(mockCourse),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'courses') {
          return mockCoursesCollection;
        }
        return {};
      });

      const result = await getCourseAndReviews(courseID);

      expect(mockPb.collection).toHaveBeenCalledWith('courses');
      expect(mockCoursesCollection.getOne).toHaveBeenCalledWith(courseID, {
        expand: 'reviews',
      });
      expect(result).toEqual({
        course: mockCourse,
        reviews: ['review1', 'review2'],
      });
    });

    it('should return null if fetching course fails', async () => {
      const courseID = 'courseId';

      const mockCoursesCollection = {
        getOne: jest.fn().mockRejectedValue(new Error('Course not found')),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'courses') {
          return mockCoursesCollection;
        }
        return {};
      });

      const result = await getCourseAndReviews(courseID);

      expect(result).toBeNull();
    });
  });
});