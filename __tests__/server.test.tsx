/* eslint-disable @typescript-eslint/no-require-imports */

jest.mock('next/headers', () => {
  const mockCookies = {
    set: jest.fn(),
  };
  return {
    cookies: jest.fn(() => mockCookies),
  };
});


jest.mock('../src/app/lib/pocketbaseClient', () => {
  const mockPb = {
    collection: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockPb,
  };
});


// Use 'require' instead of 'import' to control module loading order
import { deleteReview, editReview, editUser, getAllCourses, getCourseAndReviews, getCourseByID, getCoursesBySubject, getReviewByID, getUserByID, getUserReviews, register, signIn } from '../src/app/server';

describe('Server Functions', () => {
  let mockCookies;
  let mockPb;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies = require('next/headers').cookies();
    mockPb = require('../src/app/lib/pocketbaseClient').default;
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

      // Set up mock methods
      const mockUsersCollection = {
        authWithPassword: jest.fn().mockResolvedValue(mockUserAuthData),
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

    it('should throw an error if password length is less than 8 characters', async () => {
      const formData = new FormData();
      formData.set('username', 'testuser');
      formData.set('email', 'test-user@vanderbilt.edu');
      formData.set('password', 'short'); // Password too short
      formData.set('passwordConfirm', 'short');
      formData.set('firstName', 'Test');
      formData.set('lastName', 'User');
      formData.set('graduationYear', '2024');
  
      await expect(register(formData)).rejects.toThrow(
        'Password must be at least 8 characters long.'
      );
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
    it('should edit a review and update course average rating', async () => {
      const reviewId = 'reviewId';
      const courseId = 'courseId';
      const data = {
        rating: 5,
        content: 'Updated review content',
      };
  
      const mockReviewsCollection = {
        update: jest.fn().mockResolvedValue({}),
        getFullList: jest.fn().mockResolvedValue([
          // Mock existing reviews including the updated one
          { rating: 5 },
          { rating: 4 },
        ]),
      };
  
      const mockCoursesCollection = {
        update: jest.fn().mockResolvedValue({}),
      };
  
      mockPb.collection.mockImplementation((collectionName) => {
        if (collectionName === 'reviews') {
          return mockReviewsCollection;
        } else if (collectionName === 'courses') {
          return mockCoursesCollection;
        }
        return {};
      });
  
      const result = await editReview(reviewId, data, courseId);
  
      expect(mockPb.collection).toHaveBeenCalledWith('reviews');
      expect(mockReviewsCollection.update).toHaveBeenCalledWith(reviewId, data);
      expect(mockReviewsCollection.getFullList).toHaveBeenCalledWith({
        filter: `course="${courseId}"`,
      });
      expect(mockCoursesCollection.update).toHaveBeenCalledWith(courseId, {
        averageRating: 4.5, // (5 + 4) / 2
      });
      expect(result).toEqual({});
    });

    it('should throw an error if updating review fails', async () => {
      const reviewId = 'reviewId';
      const data = { content: 'Updated review content' };
      const courseId = 'courseId'


      const mockReviewsCollection = {
        update: jest.fn().mockRejectedValue(new Error('Update failed')),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'reviews') {
          return mockReviewsCollection;
        }
        return {};
      });

      await expect(editReview(reviewId, data, courseId)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteReview', () => {
    it('should delete a review and update course average rating', async () => {
      const reviewId = 'reviewId';
      const courseId = 'courseId';
  
      const mockReviewsCollection = {
        delete: jest.fn().mockResolvedValue({}),
        getFullList: jest.fn().mockResolvedValue([
          // Mock existing reviews after deletion
          { rating: 4 },
          { rating: 5 },
        ]),
      };
  
      const mockCoursesCollection = {
        update: jest.fn().mockResolvedValue({}),
      };
  
      // Mock pb.collection to return the appropriate mock collections
      mockPb.collection.mockImplementation((collectionName) => {
        if (collectionName === 'reviews') {
          return mockReviewsCollection;
        } else if (collectionName === 'courses') {
          return mockCoursesCollection;
        }
        return {};
      });
  
      const result = await deleteReview(reviewId, courseId);
  
      expect(mockPb.collection).toHaveBeenCalledWith('reviews');
      expect(mockReviewsCollection.delete).toHaveBeenCalledWith(reviewId);
      expect(mockReviewsCollection.getFullList).toHaveBeenCalledWith({
        filter: `course="${courseId}"`,
      });
      expect(mockCoursesCollection.update).toHaveBeenCalledWith(courseId, {
        averageRating: 4.5, // (4 + 5) / 2
      });
      expect(result).toEqual({});
    });

    it('should throw an error if deleting review fails', async () => {
      const reviewId = 'reviewId';
      const courseId = 'courseId'


      const mockReviewsCollection = {
        delete: jest.fn().mockRejectedValue(new Error('Delete failed')),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'reviews') {
          return mockReviewsCollection;
        }
        return {};
      });

      await expect(deleteReview(reviewId, courseId)).rejects.toThrow('Delete failed');
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
  
      const courses = await getAllCourses();
  
      expect(courses).toEqual([]);
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
  describe('getUserReviews', () => {
    it('should return expanded reviews for a valid user ID', async () => {
      const userID = 'validUserID';
      const mockUserWithReviews = {
        expand: { reviews: ['review1', 'review2'] },
      };

      const mockUsersCollection = {
        getOne: jest.fn().mockResolvedValue(mockUserWithReviews),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return mockUsersCollection;
        }
        return {};
      });

      const reviews = await getUserReviews(userID);

      expect(mockPb.collection).toHaveBeenCalledWith('users');
      expect(mockUsersCollection.getOne).toHaveBeenCalledWith(userID, {
        expand: 'reviews.course',
      });
      expect(reviews).toEqual(['review1', 'review2']);
    });

    it('should return an empty array if fetching user reviews fails', async () => {
      const userID = 'invalidUserID';

      const mockUsersCollection = {
        getOne: jest.fn().mockRejectedValue(new Error('User not found')),
      };

      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return mockUsersCollection;
        }
        return {};
      });

      const reviews = await getUserReviews(userID);

      expect(reviews).toEqual([]);
    });
    it('should return an empty array if fetching user reviews fails', async () => {
      const userID = 'invalidUserID';
  
      const mockUsersCollection = {
        getOne: jest.fn().mockRejectedValue(new Error('User not found')),
      };
  
      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return mockUsersCollection;
        }
        return {};
      });
  
      const reviews = await getUserReviews(userID);
  
      expect(reviews).toEqual([]);
    });
  });
  

  describe('getCourseByID', () => {
    it('should return the course when fetching by ID is successful', async () => {
      const courseID = 'validCourseID';
      const mockCourse = {
        id: courseID,
        name: 'Example Course',
        subject: 'CS',
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
  
      const course = await getCourseByID(courseID);
  
      expect(mockPb.collection).toHaveBeenCalledWith('courses');
      expect(mockCoursesCollection.getOne).toHaveBeenCalledWith(courseID);
      expect(course).toEqual(mockCourse);
    });
  
    it('should return null if fetching course by ID fails', async () => {
      const courseID = 'invalidCourseID';
  
      const mockCoursesCollection = {
        getOne: jest.fn().mockRejectedValue(new Error('Course not found')),
      };
  
      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'courses') {
          return mockCoursesCollection;
        }
        return {};
      });
  
      const course = await getCourseByID(courseID);
  
      expect(course).toBeNull();
    });
  });
  

  describe('getUserByID', () => {
    it('should return the user when fetching by ID is successful', async () => {
      const userID = 'validUserID';
      const mockUser = {
        id: userID,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      };
  
      const mockUsersCollection = {
        getOne: jest.fn().mockResolvedValue(mockUser),
      };
  
      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return mockUsersCollection;
        }
        return {};
      });
  
      const user = await getUserByID(userID);
  
      expect(mockPb.collection).toHaveBeenCalledWith('users');
      expect(mockUsersCollection.getOne).toHaveBeenCalledWith(userID);
      expect(user).toEqual(mockUser);
    });
  
    it('should return null if fetching user by ID fails', async () => {
      const userID = 'invalidUserID';
  
      const mockUsersCollection = {
        getOne: jest.fn().mockRejectedValue(new Error('User not found')),
      };
  
      mockPb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return mockUsersCollection;
        }
        return {};
      });
  
      const user = await getUserByID(userID);
  
      expect(user).toBeNull();
    });
  });

});