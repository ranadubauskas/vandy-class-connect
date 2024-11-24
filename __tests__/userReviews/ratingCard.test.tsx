import '@testing-library/jest-dom/extend-expect';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthContext } from '../../src/app/lib/contexts';
import RatingCard from '../../src/app/ratings/[userId]/ratingCard';
import { deleteReview, editReview } from '../../src/app/server';
const { describe, test, expect } = require('@jest/globals');

jest.mock('../../src/app/server', () => ({
  editReview: jest.fn(),
  deleteReview: jest.fn(),
}));

describe('RatingCard Component', () => {
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
  ];

  const mockReview = mockReviews[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles error when saving edited review', async () => {
    (editReview as jest.Mock).mockRejectedValue(new Error('Save failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthContext.Provider value={mockUserVal}>
        <RatingCard
          rating={mockReview}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
        />
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByTestId('edit-button'));

    // Change comment
    const commentTextarea = screen.getByPlaceholderText('Edit your comment');
    fireEvent.change(commentTextarea, { target: { value: 'Updated comment' } });

    // Click save button
    fireEvent.click(screen.getByText('✅ Save'));

    // Wait for error handling
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving review: ', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles error when deleting review', async () => {
    (deleteReview as jest.Mock).mockRejectedValue(new Error('Delete failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onDeleteMock = jest.fn();

    render(
      <AuthContext.Provider value={mockUserVal}>
        <RatingCard
          rating={mockReview}
          onDelete={onDeleteMock}
          onEdit={jest.fn()}
        />
      </AuthContext.Provider>
    );

    // Click delete button
    fireEvent.click(screen.getByTestId('delete-button'));

    // Wait for error handling
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting review: ', expect.any(Error));
    });

    // Ensure onDelete is not called
    expect(onDeleteMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('uses default profile picture when user has no profilePic', () => {
    const mockReviewWithoutProfilePic = {
      ...mockReview,
      expand: {
        ...mockReview.expand,
        user: {
          ...mockReview.expand.user,
          profilePic: '',
        },
      },
    };

    render(
      <AuthContext.Provider value={mockUserVal}>
        <RatingCard
          rating={mockReviewWithoutProfilePic}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
        />
      </AuthContext.Provider>
    );

    const img = screen.getByAltText('User Profile') as HTMLImageElement;
    expect(img.src).toContain('/images/user.png');
  });

  it('does not render edit and delete buttons when user is not the owner', () => {
    const otherUserReview = {
      ...mockReview,
      expand: {
        ...mockReview.expand,
        user: {
          id: 'otherUser',
          firstName: 'Alice',
          lastName: 'Johnson',
          profilePic: 'alice.jpg',
        },
      },
    };

    render(
      <AuthContext.Provider value={mockUserVal}>
        <RatingCard
          rating={otherUserReview}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
        />
      </AuthContext.Provider>
    );

    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
  });

  it('renders multiple professors with commas', () => {
    const reviewWithMultipleProfessors = {
      ...mockReview,
      expand: {
        ...mockReview.expand,
        professors: [
          { id: 'prof1', firstName: 'Jane', lastName: 'Doe' },
          { id: 'prof2', firstName: 'Bob', lastName: 'Smith' },
        ],
      },
    };

    render(
      <AuthContext.Provider value={mockUserVal}>
        <RatingCard
          rating={reviewWithMultipleProfessors}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
        />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Professor:')).toBeInTheDocument();
    expect(screen.getByText(/Jane\s+Doe,/)).toBeInTheDocument();
    expect(screen.getByText(/Bob\s+Smith/)).toBeInTheDocument();
  });

  it('successfully saves edited review and calls onEdit', async () => {
    const mockReview = mockReviews[0];
  
    (editReview as jest.Mock).mockResolvedValue({
      ...mockReview,
      comment: 'Updated comment',
      rating: 5, // Adjusted to match the unchanged rating
    });
  
    const onEditMock = jest.fn();
  
    render(
      <AuthContext.Provider value={mockUserVal}>
        <RatingCard
          rating={mockReview}
          onDelete={jest.fn()}
          onEdit={onEditMock}
        />
      </AuthContext.Provider>
    );
  
    // Click edit button
    fireEvent.click(screen.getByTestId('edit-button'));
  
    // Change comment
    fireEvent.change(screen.getByPlaceholderText('Edit your comment'), {
      target: { value: 'Updated comment' },
    });
  
    // Click save button
    fireEvent.click(screen.getByText('✅ Save'));
  
    // Wait for onEdit to be called
    await waitFor(() => {
      expect(onEditMock).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: 'Updated comment',
          rating: 5, // Adjusted expected rating
        })
      );
    });
  });
  

  it('successfully deletes review and calls onDelete', async () => {
    (deleteReview as jest.Mock).mockResolvedValue({ success: true });
  
    const onDeleteMock = jest.fn();
  
    render(
      <AuthContext.Provider value={mockUserVal}>
        <RatingCard
          rating={mockReview}
          onDelete={onDeleteMock}
          onEdit={jest.fn()}
        />
      </AuthContext.Provider>
    );
  
    // Click delete button
    fireEvent.click(screen.getByTestId('delete-button'));
  
    // Wait for onDelete to be called
    await waitFor(() => {
      expect(onDeleteMock).toHaveBeenCalled();
    });
  });
  

  
  
});
