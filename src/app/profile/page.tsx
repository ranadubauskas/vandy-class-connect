'use client';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from "../lib/contexts";
import { editUser } from '../server';


const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const defaultProfilePic = '/images/user.png';

export default function Profile() {
    const userVal = useContext(AuthContext);
    console.log('name: '+ userVal.firstName);
    console.log('email: ' + userVal.email);

    const {getUser} = userVal

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
            if (userVal.profilePic){
                setProfilePicPreviewURL(userVal.profilePic);
            }

            
        }

    }, [userVal]);





    const handleSave = async () => {
        console.log("save clicked");
        console.log("new first name " + firstName);
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
            console.log("User updated successfully anme", updatedUser.firstName);
            
            setFirstName(updatedUser.firstName);
            setLastName(updatedUser.lastName);
            setEmail(updatedUser.email);
            setGraduationYear(updatedUser.graduationYear);
            setProfilePicPreviewURL(`${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${userVal.id}/${profilePicPreviewURL}`);
            
            //TODO: Get user data from returned user object in getUser() instead
            await getUser();
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
            // const picPreview = document.getElementById("profPic");
            // picPreview.src = fileObjectURL;
            //picPreview.src = fileObjectURL;
            console.log("setting it to: " + profilePicPreviewURL);
        } else {
            setProfilePicFile(null);
            setProfilePicPreviewURL('');
        }
    };

    const getProfilePicUrl = (previewURL: string | null): string => {
        // console.log("URL: " + previewURL);
        // if (!previewURL) {
        //     console.log("NO");
        //     return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=0D8ABC&color=fff`;
        // }
        if (previewURL && previewURL.startsWith('blob:')) {
            // Return the blob URL for the locally selected file
            return previewURL;
        }
        // If filename already includes the PocketBase URL, avoid double prefixing
        return `${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${userVal.id}/${profilePicPreviewURL}`;
    };
    


    return (
        <div className="flex items-center justify-center h-screen">
            <ul>
                <li>Profile:</li>
                {!isEditing ? (
                    // Show the user information in read-only mode
                    <>
                        <li>First Name: {firstName}</li>
                        <li>Last Name: {lastName}</li>
                        <li>Email: {email} </li>
                        <li>Graduation Year: {graduationYear}</li>
                        <li>
                            Profile Pic:
                            <img
                                src= {getProfilePicUrl(profilePicPreviewURL)}
                                alt="Profile Picture"
                                className="w-24 h-24 object-cover rounded-full mt-2"
                            />
                        </li>
                        <li>
                            <button
                                onClick={() => setIsEditing(true)} // Enable edit mode
                                className="bg-blue-500 text-white py-2 px-4 rounded mt-4 hover:bg-blue-600"
                            >
                                Edit Profile
                            </button>
                        </li>
                    </>
                ) : (
                    // Show the input fields when in edit mode
                    <>
                        <li>
                            First Name:
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="border border-gray-300 rounded p-2"
                            />
                        </li>
                        <li>
                            Last Name:
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="border border-gray-300 rounded p-2"
                            />
                        </li>
                        <li>
                            Email:
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border border-gray-300 rounded p-2"
                            />
                        </li>
                        <li>
                            Graduation Year:
                            <input
                                type="number"
                                value={graduationYear}
                                onChange={(e) => setGraduationYear(e.target.value)}
                                className="border border-gray-300 rounded p-2"
                            />
                        </li>
                        <li>
                            Profile Pic:
                            <img
                                id="profPic"
                                src= {getProfilePicUrl(profilePicPreviewURL)}
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
                        <li>
                            <button
                                onClick={handleSave} // Save the changes
                                className="bg-blue-500 text-white py-2 px-4 rounded mt-4 hover:bg-blue-600"
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


