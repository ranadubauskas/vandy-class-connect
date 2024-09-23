'use client';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from "../lib/contexts";
import { editUser } from '../server';


const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const defaultProfilePic = '/images/user.png'; // Default picture path

export default function Profile() {
    const userVal = useContext(AuthContext);

    const { getUser, logoutUser } = userVal;

    // State to control edit mode and the user data
    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState(userVal.firstName || '');
    const [lastName, setLastName] = useState(userVal.lastName || '');
    const [email, setEmail] = useState(userVal.email || '');
    const [graduationYear, setGraduationYear] = useState(userVal.graduationYear || '');
    const [profilePicPreviewURL, setProfilePicPreviewURL] = useState(defaultProfilePic);
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

    // Populate state with userVal data after it's loaded
    useEffect(() => {
        if (userVal) {
            setFirstName(userVal.firstName || '');
            setLastName(userVal.lastName || '');
            setEmail(userVal.email || '');
            setGraduationYear(userVal.graduationYear || '');
            if (userVal.profilePic) {
                setProfilePicPreviewURL(`${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${userVal.id}/${userVal.profilePic}`);
            } else {
                setProfilePicPreviewURL(defaultProfilePic); // Use default profile picture if none is provided
            }
        }
    }, [userVal]);

    const handleSave = async () => {
        const userId = userVal.id;
        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('email', email);
        formData.append('graduationYear', graduationYear);

        if (profilePicFile) {
            formData.append('profilePic', profilePicFile); 
        }

        const updatedUser = await editUser(userId, formData); 
        
        if (updatedUser) {
            console.log("User updated successfully", updatedUser);
            
            // Set the updated information
            setFirstName(updatedUser.firstName);
            setLastName(updatedUser.lastName);
            setEmail(updatedUser.email);
            setGraduationYear(updatedUser.graduationYear);
            
            if (profilePicFile) {
                const newProfilePicURL = URL.createObjectURL(profilePicFile);
                setProfilePicPreviewURL(newProfilePicURL);
            } else if (updatedUser.profilePic) {
                setProfilePicPreviewURL(`${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${userId}/${updatedUser.profilePic}`);
            } else {
                setProfilePicPreviewURL(defaultProfilePic); // Revert to default if no new pic is uploaded
            }
            
            await getUser(); // Refresh the user data
            setIsEditing(false);            
        } else {
            console.error("Failed to update user");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePicFile(file); // Save the file for uploading
            const fileObjectURL = URL.createObjectURL(file);
            setProfilePicPreviewURL(fileObjectURL); // Show the preview of the new profile picture
        } else {
            setProfilePicFile(null);
            setProfilePicPreviewURL(defaultProfilePic); // Revert to default if no file is selected
        }
    };

    const getProfilePicUrl = (): string => {
        if (profilePicPreviewURL && profilePicPreviewURL.startsWith('blob:')) {
            // Return the blob URL for the locally selected file
            return profilePicPreviewURL;
        }
        // If there's a profile picture in the PocketBase, use it; otherwise, use default
        return profilePicPreviewURL || defaultProfilePic;
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="absolute top-4 right-4">
                <button
                    type="button"
                    onClick={logoutUser}
                    className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 shadow-md"
                >
                    Log Out
                </button>
            </div>
            <ul className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
                <li className="text-2xl font-semibold mb-4 text-center">Profile</li>
                {!isEditing ? (
                    <>
                        <li>First Name: {firstName}</li>
                        <li>Last Name: {lastName}</li>
                        <li>Email: {email}</li>
                        <li>Graduation Year: {graduationYear}</li>
                        <li className="mt-4">
                            Profile Pic:
                            <img
                                src={getProfilePicUrl()}
                                alt="Profile Picture"
                                className="w-24 h-24 object-cover rounded-full mt-2"
                            />
                        </li>
                        <li className="mt-6">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 shadow-md"
                            >
                                Edit Profile
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li>
                            First Name:
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            />
                        </li>
                        <li>
                            Last Name:
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            />
                        </li>
                        <li>
                            Email:
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            />
                        </li>
                        <li>
                            Graduation Year:
                            <input
                                type="number"
                                value={graduationYear}
                                onChange={(e) => setGraduationYear(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            />
                        </li>
                        <li className="mt-4">
                            Profile Pic:
                            <img
                                id="profPic"
                                src={getProfilePicUrl()}
                                alt="Profile Picture"
                                className="w-24 h-24 object-cover rounded-full mt-2"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="mt-2"
                            />
                        </li>
                        <li className="mt-6">
                            <button
                                onClick={handleSave}
                                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 shadow-md"
                            >
                                Save
                            </button>
                        </li>
                    </>
                )}
            </ul>
        </div>
    );
}