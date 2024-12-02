import '@testing-library/jest-dom/extend-expect';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '../../src/app/lib/contexts';
import Profile from '../../src/app/profile/[userId]/page';
import { editUser, getUserByID } from '../../src/app/server';
const { describe, test, expect } = require('@jest/globals');

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

    it("should set profile picture preview to default when no file is selected", async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => screen.getByText("Edit Profile"));
        fireEvent.click(screen.getByText("Edit Profile"));

        fireEvent.change(screen.getByLabelText("Choose File"), { target: { files: null } });

        // Cast to HTMLImageElement to access the src property
        const profilePics = screen.getAllByAltText("Profile Picture");
        const profilePicPreview = profilePics[0] as HTMLImageElement; // Adjust index as needed
        expect(profilePicPreview.src).toContain('/images/user.png');
    });

    it("should display error message if profile update fails in handleSave", async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        (editUser as jest.Mock).mockRejectedValue(new Error("Update failed")); // Simulate failure
        renderWithAuthProvider(<Profile />);

        await waitFor(() => screen.getByText("Edit Profile"));
        fireEvent.click(screen.getByText("Edit Profile"));

        await act(async () => {
            fireEvent.click(screen.getByText("Save Profile"));
        });

        expect(screen.getByText("Failed to update profile. Please try again.")).toBeInTheDocument();
    });

    it("should fetch and display user's own profile data", async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => {
            expect(screen.getByText("John")).toBeInTheDocument();
            expect(screen.getByText("Doe")).toBeInTheDocument();
            expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
            expect(screen.getByText("2025")).toBeInTheDocument();
        });
    });

    it('should navigate to saved courses when "View My Courses" button is clicked', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => screen.getByText('View My Courses'));

        fireEvent.click(screen.getByText('View My Courses'));

        expect(mockPush).toHaveBeenCalledWith('/savedCourses/');
    });

    it("should successfully update the user's profile", async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => screen.getByText('Edit Profile'));
        fireEvent.click(screen.getByText('Edit Profile'));

        // Change first name, last name, and graduation year
        fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Johnny' } });
        fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe Jr.' } });
        fireEvent.change(screen.getByLabelText('Graduation Year'), { target: { value: '2026' } });

        // Mock file selection
        const file = new File(['dummy content'], 'profile.png', { type: 'image/png' });
        const input = screen.getByLabelText('Choose File');
        const createObjectURLMock = jest.fn().mockReturnValue('blob:profile-pic-url');
        global.URL.createObjectURL = createObjectURLMock;
        fireEvent.change(input, { target: { files: [file] } });

        // Click Save Profile
        await act(async () => {
            fireEvent.click(screen.getByText('Save Profile'));
        });

        // Check that editUser was called with correct parameters
        expect(editUser).toHaveBeenCalled();
        const [userIdCalled, formDataCalled] = (editUser as jest.Mock).mock.calls[0];
        expect(userIdCalled).toBe('1');
        expect(formDataCalled.get('firstName')).toBe('Johnny');
        expect(formDataCalled.get('lastName')).toBe('Doe Jr.');
        expect(formDataCalled.get('graduationYear')).toBe('2026');
        expect(formDataCalled.get('profilePic')).toBe(file);

        // Ensure state is updated
        await waitFor(() => {
            expect(screen.getByText('Johnny')).toBeInTheDocument();
            expect(screen.getByText('Doe Jr.')).toBeInTheDocument();
            expect(screen.getByText('2026')).toBeInTheDocument();
        });

        // Ensure getUser is called to refresh context
        expect(mockGetUser).toHaveBeenCalled();
    });

    it('should update profile picture preview when a file is selected', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => screen.getByText('Edit Profile'));
        fireEvent.click(screen.getByText('Edit Profile'));

        const file = new File(['dummy content'], 'profile.png', { type: 'image/png' });
        const input = screen.getByLabelText('Choose File');
        const createObjectURLMock = jest.fn().mockReturnValue('blob:profile-pic-url');
        global.URL.createObjectURL = createObjectURLMock;

        fireEvent.change(input, { target: { files: [file] } });

        // Check that the profile picture preview is updated
        const profilePics = screen.getAllByAltText('Profile Picture');
        const profilePicPreview = profilePics[0] as HTMLImageElement;
        expect(profilePicPreview.src).toBe('blob:profile-pic-url');
    });

    it('should navigate to user reviews when "View My Reviews" button is clicked', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => screen.getByText('View My Reviews'));

        fireEvent.click(screen.getByText('View My Reviews'));

        expect(mockPush).toHaveBeenCalledWith('/ratings/1');
    });

    it('should update state when input fields are changed', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => screen.getByText('Edit Profile'));
        fireEvent.click(screen.getByText('Edit Profile'));

        // Change input fields
        fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Johnny' } });
        fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe Jr.' } });
        fireEvent.change(screen.getByLabelText('Graduation Year'), { target: { value: '2026' } });

        // Verify that state has updated
        expect(screen.getByLabelText('First Name')).toHaveValue('Johnny');
        expect(screen.getByLabelText('Last Name')).toHaveValue('Doe Jr.');
        expect(screen.getByLabelText('Graduation Year')).toHaveValue('2026');
    });

    it('should display error when user is not authenticated in handleSave', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });

        // Render with no userData to simulate unauthenticated user
        renderWithAuthProvider(<Profile />, null);

        await waitFor(() => screen.getByText('Loading...'));

        // Attempt to click Edit Profile (should not be present)
        expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    });

    it('should reset profile picture preview when no file is selected', async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '1' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => screen.getByText('Edit Profile'));
        fireEvent.click(screen.getByText('Edit Profile'));

        // Initially select a file
        const file = new File(['dummy content'], 'profile.png', { type: 'image/png' });
        const input = screen.getByLabelText('Choose File');
        const createObjectURLMock = jest.fn().mockReturnValue('blob:profile-pic-url');
        global.URL.createObjectURL = createObjectURLMock;
        fireEvent.change(input, { target: { files: [file] } });

        // Then reset the file input
        fireEvent.change(input, { target: { files: null } });

        // Check that profilePicPreviewURL is reset to default
        const profilePics = screen.getAllByAltText('Profile Picture');
        const profilePicPreview = profilePics[0] as HTMLImageElement;
        expect(profilePicPreview.src).toContain('/images/user.png');
    });

    it("should fetch and display another user's profile data", async () => {
        (useParams as jest.Mock).mockReturnValue({ userId: '2' });
        renderWithAuthProvider(<Profile />);

        await waitFor(() => {
            expect(screen.getByText('Jane')).toBeInTheDocument();
            expect(screen.getByText('Smith')).toBeInTheDocument();
            expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
            expect(screen.getByText('2024')).toBeInTheDocument();
        });

        // Ensure that the Edit Profile button is not rendered
        expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    });
});
