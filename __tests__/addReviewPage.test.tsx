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
  
    // ... previous tests ...
  
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
  });
  