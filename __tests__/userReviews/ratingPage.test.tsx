import '@testing-library/jest-dom/extend-expect';
import { act, fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import localforage from 'localforage';
import { useParams } from 'next/navigation';
import { AuthContext } from '../../src/app/lib/contexts';
import Ratings from '../../src/app/ratings/[userId]/page';
import { deleteReview, getUserReviews } from '../../src/app/server';
const { describe, test, expect } = require('@jest/globals');

// Mocking necessary modules
jest.mock('localforage');
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useParams: jest.fn(),
}));
jest.mock('../../src/app/server', () => ({
  getUserReviews: jest.fn(),
  deleteReview: jest.fn(),
  editReview: jest.fn(),
}));

describe('Ratings Component', () => {
  const mockUserId = 'user123';
  const mockUserVal = {
    userData: {
      id: 'user123',
      firstName: 'John',
      lastName: 'Smith',
      username: 'johnsmith',
      email: 'john.smith@example.com',
      graduationYear: '2025',
      profilePic: 'default-profile-pic.jpg',
    },
    getUser: jest.fn(),
    logoutUser: jest.fn(),
    loginUser: jest.fn(),
  };

  const mockReviews = [
    {
      id: 'review1',
      comment: 'Great course!',
      rating: 5,
      expand: {
        course: { id: 'course1', code: 'CSE101', name: 'Intro to Computer Science' },
        professors: [{ id: 'prof1', firstName: 'Jane', lastName: 'Doe' }],
        user: { id: 'user123', firstName: 'John', lastName: 'Smith', profilePic: 'pic.jpg' },
      },
    },
    // Add more mock reviews as needed
  ];

  const mockCachedReviews = {
    reviews: mockReviews,
    cachedAt: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useParams to return a specific userId
    (useParams as jest.Mock).mockReturnValue({ userId: mockUserId });

    // Mock getUserReviews to return mock reviews
    (getUserReviews as jest.Mock).mockResolvedValue(mockReviews);

    // Mock localforage methods
    (localforage.getItem as jest.Mock).mockResolvedValue(null);
    (localforage.setItem as jest.Mock).mockResolvedValue(null);
    (deleteReview as jest.Mock).mockResolvedValue({ success: true });

  });

  it('renders loading state initially', () => {
    render(
      <AuthContext.Provider value={mockUserVal}>
        <Ratings />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('fetches and displays reviews', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });

    // Wait for the reviews to be fetched and rendered
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that the reviews are rendered
    const reviewComments = screen.getAllByTestId('review-comment');
    expect(reviewComments.length).toBe(mockReviews.length);

    mockReviews.forEach((review, index) => {
      expect(reviewComments[index]).toHaveTextContent(review.comment);
    });
  });

  it('handles delete review', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });

    // Wait for the reviews to be fetched and rendered
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Simulate deleting a review by clicking the delete button
    const deleteButtons = screen.getAllByTestId('delete-button');
    fireEvent.click(deleteButtons[0]);

    // Check that the cache was updated
    expect(localforage.setItem).toHaveBeenCalled();
  });

  it('handles edit review', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });

    // Wait for the reviews to be fetched and rendered
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Simulate editing a review
    const editButtons = screen.getAllByTestId('edit-button');
    fireEvent.click(editButtons[0]);

    const saveButton = screen.getByText('✅ Save');
    const commentTextarea = screen.getByPlaceholderText('Edit your comment');

    // Update the comment
    fireEvent.change(commentTextarea, { target: { value: 'Updated comment' } });

    fireEvent.click(saveButton);

    // Wait for the review to be updated
    await waitFor(() => {
      expect(screen.getByText('Updated comment')).toBeInTheDocument();
    });

    // Check that the cache was updated
    expect(localforage.setItem).toHaveBeenCalled();
  });

  it('uses cached data when available and not expired', async () => {
    const mockCachedData = {
      reviews: mockReviews,
      cachedAt: Date.now(),
    };
  
    // Mock localforage to return cached data
    (localforage.getItem as jest.Mock).mockResolvedValue(mockCachedData);
  
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });
  
    // Wait for the component to process cached data
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    // Ensure that getUserReviews is not called since cached data is used
    expect(getUserReviews).not.toHaveBeenCalled();
  
    // Check that the reviews are rendered
    const reviewComments = screen.getAllByTestId('review-comment');
    expect(reviewComments.length).toBe(mockReviews.length);
  
    mockReviews.forEach((review, index) => {
      expect(reviewComments[index]).toHaveTextContent(review.comment);
    });
  });

  it('fetches data from server when cache is not available', async () => {
    // Mock localforage to return null, simulating no cached data
    (localforage.getItem as jest.Mock).mockResolvedValue(null);
  
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });
  
    // Wait for the data to be fetched
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    // Ensure that getUserReviews is called
    expect(getUserReviews).toHaveBeenCalledWith(mockUserId);
  
    // Check that the reviews are rendered
    const reviewComments = screen.getAllByTestId('review-comment');
    expect(reviewComments.length).toBe(mockReviews.length);
  
    mockReviews.forEach((review, index) => {
      expect(reviewComments[index]).toHaveTextContent(review.comment);
    });
  });

  it('fetches and uses cached data when available and valid', async () => {
    const mockCachedData = {
      reviews: mockReviews,
      cachedAt: Date.now(),
    };
  
    (localforage.getItem as jest.Mock).mockResolvedValue(mockCachedData);
  
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });
  
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    expect(getUserReviews).not.toHaveBeenCalled();
    expect(screen.getByText(mockReviews[0].comment)).toBeInTheDocument();
  });

  it('does not fetch data when userId is not provided', async () => {
    (useParams as jest.Mock).mockReturnValue({ userId: null });

    render(
      <AuthContext.Provider value={mockUserVal}>
        <Ratings />
      </AuthContext.Provider>
    );

    expect(getUserReviews).not.toHaveBeenCalled();
    expect(localforage.getItem).not.toHaveBeenCalled();
  });

  it('fetches new data when cached data is expired', async () => {
    const expiredCachedData = { ...mockCachedReviews, cachedAt: Date.now() - 6 * 60 * 1000 };
    (localforage.getItem as jest.Mock).mockResolvedValue(expiredCachedData);

    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(getUserReviews).toHaveBeenCalledWith(mockUserId);
    expect(screen.getByText(mockReviews[0].comment)).toBeInTheDocument();
  });

  it('successfully fetches and caches data from the server', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(getUserReviews).toHaveBeenCalledWith(mockUserId);
    expect(localforage.setItem).toHaveBeenCalledWith(
      `user_reviews_${mockUserId}`,
      expect.objectContaining({
        reviews: mockReviews,
        cachedAt: expect.any(Number),
      })
    );
    expect(screen.getByText(mockReviews[0].comment)).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getUserReviews as jest.Mock).mockRejectedValue(new Error('Server error'));

    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.queryByText(mockReviews[0].comment)).not.toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('ignores stale cached data', async () => {
    const staleCachedData = { ...mockCachedReviews, cachedAt: Date.now() - 10 * 60 * 1000 };
  
    (localforage.getItem as jest.Mock).mockResolvedValue(staleCachedData);
  
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });
  
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    expect(getUserReviews).toHaveBeenCalledWith(mockUserId);
    expect(screen.getByText(mockReviews[0].comment)).toBeInTheDocument();
  });

  it('caches data after fetching from the server', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });
  
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    expect(getUserReviews).toHaveBeenCalledWith(mockUserId);
    expect(localforage.setItem).toHaveBeenCalledWith(
      `user_reviews_${mockUserId}`,
      expect.objectContaining({
        reviews: mockReviews,
        cachedAt: expect.any(Number),
      })
    );
  });

  it('handles server fetch failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getUserReviews as jest.Mock).mockRejectedValue(new Error('Server error'));
  
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });
  
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('updates cache after editing a review', async () => {
    render(
      <AuthContext.Provider value={mockUserVal}>
        <Ratings />
      </AuthContext.Provider>
    );
  
    await waitForElementToBeRemoved(() => screen.getByText('Loading...'));
  
    fireEvent.click(screen.getByTestId('edit-button'));
    fireEvent.change(screen.getByPlaceholderText('Edit your comment'), {
      target: { value: 'Updated comment' },
    });
    fireEvent.click(screen.getByText('✅ Save'));
  
    // Wait for the component to re-render
    await waitFor(() => {
      expect(screen.getByText('Updated comment')).toBeInTheDocument();
    });
  
    expect(localforage.setItem).toHaveBeenCalled();
  });
  
  
  
  it('updates cache after deleting a review', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={mockUserVal}>
          <Ratings />
        </AuthContext.Provider>
      );
    });
  
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    const deleteButton = screen.getByTestId('delete-button');
    await act(async () => {
      fireEvent.click(deleteButton);
    });
  
    await waitFor(() => {
      expect(localforage.setItem).toHaveBeenCalled();
    });
  });

  // it('updates state and cache when a review is deleted', async () => {
  //   // Mock localforage.setItem
  //   localforage.setItem = jest.fn().mockResolvedValue(null);
  
  //   render(
  //     <AuthContext.Provider value={mockUserVal}>
  //       <Ratings />
  //     </AuthContext.Provider>
  //   );
  
  //   // Wait for the reviews to load
  //   await waitFor(() => {
  //     expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  //   });
  
  //   // Ensure the review is displayed
  //   expect(screen.getByText('Great course!')).toBeInTheDocument();
  
  //   // Click the delete button
  //   fireEvent.click(screen.getByTestId('delete-button'));
  
  //   // Wait for the review to be removed from the DOM
  //   await waitFor(() => {
  //     expect(screen.queryByText('Great course!')).not.toBeInTheDocument();
  //   });
  
  //   // Check that localforage.setItem was called with updated reviews
  //   expect(localforage.setItem).toHaveBeenCalledWith(
  //     `user_reviews_${mockUserId}`,
  //     expect.objectContaining({
  //       reviews: [], // The reviews array should be empty after deletion
  //       cachedAt: expect.any(Number),
  //     })
  //   );
  // });

  it('displays "No reviews available." when there are no reviews', async () => {
    // Mock getUserReviews to return an empty array
    (getUserReviews as jest.Mock).mockResolvedValue([]);
  
    render(
      <AuthContext.Provider value={mockUserVal}>
        <Ratings />
      </AuthContext.Provider>
    );
  
    // Wait for the reviews to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    // Check that the "No reviews available." message is displayed
    expect(screen.getByText('No reviews available.')).toBeInTheDocument();
  });

  it('handles errors during data fetching', async () => {
    // Mock getUserReviews to throw an error
    (getUserReviews as jest.Mock).mockRejectedValue(new Error('Fetch failed'));
  
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
    render(
      <AuthContext.Provider value={mockUserVal}>
        <Ratings />
      </AuthContext.Provider>
    );
  
    // Wait for the component to stop loading
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    // Ensure that an error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
  
    // Ensure that no reviews are displayed
    expect(screen.queryByText('Great course!')).not.toBeInTheDocument();
  
    consoleErrorSpy.mockRestore();
  });

  it('uses cached data when cache is valid', async () => {
    const freshCachedData = {
      reviews: mockReviews,
      cachedAt: Date.now(),
    };
  
    (localforage.getItem as jest.Mock).mockResolvedValue(freshCachedData);
  
    render(
      <AuthContext.Provider value={mockUserVal}>
        <Ratings />
      </AuthContext.Provider>
    );
  
    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    // Ensure that getUserReviews was not called because cached data was used
    expect(getUserReviews).not.toHaveBeenCalled();
  
    // Ensure that the reviews are displayed
    expect(screen.getByText('Great course!')).toBeInTheDocument();
  });

  it('fetches new data when cache is expired', async () => {
    const expiredCachedData = {
      reviews: mockReviews,
      cachedAt: Date.now() - 10 * 60 * 1000, // 10 minutes ago
    };
  
    (localforage.getItem as jest.Mock).mockResolvedValue(expiredCachedData);
  
    render(
      <AuthContext.Provider value={mockUserVal}>
        <Ratings />
      </AuthContext.Provider>
    );
  
    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    // Ensure that getUserReviews was called because the cache was expired
    expect(getUserReviews).toHaveBeenCalledWith(mockUserId);
  
    // Ensure that the reviews are displayed
    expect(screen.getByText('Great course!')).toBeInTheDocument();
  });

  it('updates state and cache when a review is deleted', async () => {
    // Mock localforage.setItem
    localforage.setItem = jest.fn().mockResolvedValue(null);
  
    // Mock deleteReview to resolve successfully
    (deleteReview as jest.Mock).mockResolvedValue({ success: true });
  
    render(
      <AuthContext.Provider value={mockUserVal}>
        <Ratings />
      </AuthContext.Provider>
    );
  
    // Wait for the reviews to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  
    // Ensure the review is displayed
    expect(screen.getByText('Great course!')).toBeInTheDocument();
  
    // Click the delete button
    fireEvent.click(screen.getByTestId('delete-button'));
  
    // Wait for the review to be removed from the DOM
    await waitFor(() => {
      expect(screen.queryByText('Great course!')).not.toBeInTheDocument();
    });
  
    // Check that localforage.setItem was called with updated reviews
    expect(localforage.setItem).toHaveBeenCalledWith(
      `user_reviews_${mockUserId}`,
      expect.objectContaining({
        reviews: [], // The reviews array should be empty after deletion
        cachedAt: expect.any(Number),
      })
    );
  });

  
  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
});
