import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '../../src/app/lib/contexts';
import Profile, { defaultProfilePic } from '../../src/app/profile/[userId]/page';
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
});
