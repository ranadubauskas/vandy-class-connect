import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '../../src/app/lib/contexts';
import Profile from '../../src/app/profile/[userId]/page';
import { editUser, getUserByID } from '../../src/app/server';

// Mock next/navigation hooks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useParams: jest.fn(),
}));

// Mock server functions
jest.mock('../../src/app/server', () => ({
    getUserByID: jest.fn(),
    editUser: jest.fn(),
}));

describe('Profile Component', () => {
    const mockPush = jest.fn();
    const mockGetUser = jest.fn();

    const mockUserData = {
        id: '1',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        graduationYear: '2025',
        profilePic: 'john.jpg',
    };

    const mockOtherUserData = {
        id: '2',
        username: 'janesmith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        graduationYear: '2024',
        profilePic: 'jane.jpg',
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock useRouter and useParams
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        (getUserByID as jest.Mock).mockImplementation((id: string) => {
            if (id === '1') {
                return Promise.resolve(mockUserData);
            } else if (id === '2') {
                return Promise.resolve(mockOtherUserData);
            } else {
                // Handle other cases or return a default value
                return Promise.resolve(null);
            }
        });

        // Mock editUser to return updated data based on the formData
        (editUser as jest.Mock).mockImplementation((userId, formData) => {
            const updatedUser = {
                ...mockUserData,
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                graduationYear: formData.get('graduationYear'),
                // Include other fields as necessary
            };
            return Promise.resolve(updatedUser);
        });

        // Mock getUser to refresh user data in context
        mockGetUser.mockResolvedValue(undefined);
    });


    const renderWithAuthProvider = (
        ui: React.ReactElement,
        userData = mockUserData
    ) => {
        return render(
            <AuthContext.Provider
                value={{
                    userData,
                    getUser: mockGetUser,
                    logoutUser: jest.fn(), // Add this
                    loginUser: jest.fn(),  // Add this
                }}
            >
                {ui}
            </AuthContext.Provider>
        );
    };


    it('should render loading state when AuthContext is missing', () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });

        render(
            <AuthContext.Provider value={null}>
                <Profile />
            </AuthContext.Provider>
        );
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render own profile with edit option', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        // Wait for user data to load
        await waitFor(() => {
            expect(screen.getByText('Profile')).toBeInTheDocument();
        });

        // Check that user data is displayed
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('2025')).toBeInTheDocument();

        // Check that "Edit Profile" button is displayed
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    it('should render other user\'s profile without edit option', async () => {
        // Mock useParams to return a different userId
        (useParams as jest.Mock).mockReturnValue({ userId: '2' });

        renderWithAuthProvider(<Profile />);

        // Wait for user data to load
        await waitFor(() => {
            expect(screen.getByText('Profile')).toBeInTheDocument();
        });

        // Check that other user's data is displayed
        expect(screen.getByText('Jane')).toBeInTheDocument();
        expect(screen.getByText('Smith')).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
        expect(screen.getByText('2024')).toBeInTheDocument();

        // Check that "Edit Profile" button is not displayed
        expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    });

    it('should switch to edit mode when "Edit Profile" button is clicked', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit Profile'));

        await waitFor(() => {
            expect(screen.getByText('First Name')).toBeInTheDocument();
        });

        // Check that input fields are displayed with current values
        expect(screen.getByLabelText('First Name')).toHaveValue('John');
        expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
        expect(screen.getByLabelText('Email')).toHaveValue('john.doe@example.com');
        expect(screen.getByLabelText('Grade')).toHaveValue('2025');
    });

    it('should save profile changes when "Save Profile" button is clicked', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit Profile'));

        await waitFor(() => {
            expect(screen.getByLabelText('First Name')).toBeInTheDocument();
        });

        // Change first name and last name
        fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Johnny' } });
        fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe Jr.' } });

        fireEvent.click(screen.getByText('Save Profile'));

        // Wait for the component to update and display the new names
        await waitFor(() => {
            expect(screen.getByText('Johnny')).toBeInTheDocument();
            expect(screen.getByText('Doe Jr.')).toBeInTheDocument();
        });
    });

    it('should display error message if profile update fails', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        (editUser as jest.Mock).mockRejectedValue(new Error('Update failed'));

        renderWithAuthProvider(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit Profile'));

        fireEvent.click(screen.getByText('Save Profile'));

        await waitFor(() => {
            expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
        });
    });

    it('should navigate to reviews page when "View My Reviews" button is clicked', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('View My Reviews')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('View My Reviews'));

        expect(mockPush).toHaveBeenCalledWith('/ratings/1');
    });

    it('should navigate to other user\'s reviews page when "View Jane\'s Reviews" button is clicked', async () => {
        // Mock useParams to return a different userId
        (useParams as jest.Mock).mockReturnValue({ userId: '2' });

        renderWithAuthProvider(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("View Jane's Reviews")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("View Jane's Reviews"));

        expect(mockPush).toHaveBeenCalledWith('/ratings/2');
    });
});
