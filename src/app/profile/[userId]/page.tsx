'use client';

import { useParams, useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from "../../lib/contexts";
import { editUser, getUserByID } from '../../server';
import './style.css';


const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const defaultProfilePic = '/images/user.png'; // Default picture path

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, index) => currentYear + index);

export default function Profile() {
    const router = useRouter();
    const params = useParams();

    const { userId } = params;


    const userVal = useContext(AuthContext);

    const { userData, getUser } = userVal || {};

    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [graduationYear, setGraduationYear] = useState('');
    const [profilePicPreviewURL, setProfilePicPreviewURL] = useState(defaultProfilePic);
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    const [otherUser, setOtherUser] = useState(null);

    const [isMyProfile, setIsMyProfile] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const fetchedUser = await getUserByID(userId as string);
            setOtherUser(fetchedUser);
            console.log("other user: ", fetchedUser);

            const isProfileMine = userId === userData?.id;
            setIsMyProfile(isProfileMine);

            setFirstName(isProfileMine ? userData?.firstName : fetchedUser.firstName);
            setLastName(isProfileMine ? userData?.lastName : fetchedUser.lastName);
            setEmail(isProfileMine ? userData?.email : fetchedUser.email);
            setGraduationYear(isProfileMine ? userData?.graduationYear : fetchedUser.graduationYear);

            const profilePicId = isProfileMine ? userData?.id : fetchedUser.id;
            const profilePicName = isProfileMine ? userData?.profilePic : fetchedUser.profilePic;

            if (profilePicName) {
                setProfilePicPreviewURL(`${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${profilePicId}/${profilePicName}`);
            } else {
                setProfilePicPreviewURL(defaultProfilePic);
            }
        };

        if (userVal && userId) {
            fetchUser();
        }
    }, [userVal, userId]);


    if (!userVal) {
        return <div>Loading...</div>; // Render a fallback UI if context is missing
    }

    const handleViewRatings = () => {
        if (typeof window !== 'undefined') {

            router.push(`/ratings/${otherUser.id}`);
        }
    };

    const handleViewTutoredCourses = () => {
        if (typeof window !== 'undefined') {

            router.push(`/TutoredCourses/${otherUser.id}`);
        }
    };

    const handleSave = async () => {
        try {
            const userId = userData?.id;
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
                    setProfilePicPreviewURL(defaultProfilePic);
                }

                await getUser(); // Refresh the user data
                setIsEditing(false);
            } else {
                console.error("Failed to update user");
            }
        } catch (error) {
            console.error("Error updating user:", error);
            setError("Failed to update profile. Please try again.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePicFile(file);
            const fileObjectURL = URL.createObjectURL(file);
            setProfilePicPreviewURL(fileObjectURL);
        } else {
            setProfilePicFile(null);
            setProfilePicPreviewURL(defaultProfilePic);
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
        <div>
            <div className="flex items-center justify-center h-[30vh]">
                <div className="flex mb-4 max-w-5xl w-full">
                    <div className="w-1/3 flex justify-start pl-2">
                        <button 
                        //onClick={handleViewTutoredCourses} 
                        className="bg-white text-blue-600 py-2 px-4 rounded-lg shadow-lg hover:bg-gray-200 transition-all duration-300 ease-in-out">
                            View {isMyProfile ? "My" : otherUser?.firstName + "'s"} Tutored Courses
                        </button>
                    </div>
                    <div className="w-1/3 h-12 flex flex-col items-center justify-center">
                        <img
                            src={getProfilePicUrl()}
                            alt="Profile Picture"
                            className="w-28 h-28 object-cover rounded-full mt-20"
                        />
                        <h2 className="text-white text-3xl font-semibold mt-10">{firstName} {lastName}</h2>
                    </div>
                    <div className="w-1/3 flex justify-end pr-2">
                        <button onClick={() => handleViewRatings()} className="bg-white text-blue-600 py-2 px-4 rounded-lg shadow-lg hover:bg-gray-200 transition-all duration-300 ease-in-out">
                            View {isMyProfile ? "My" : otherUser?.firstName + "'s"} Reviews
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 max-w-5xl mx-auto justify-center items-center">
                <div className="text-3xl font-semibold mb-4 text-center">Profile</div>

                {error && <p className="text-red-500 text-center">{error}</p>}

                {!isEditing ? (
                    <div className="grid grid-cols-2 gap-6 justify-items-center w-full text-center">
                        <div>
                            <label className="block font-bold text-xl">First Name</label>
                            <div className="text-lg">{firstName}</div> {/* Medium text for non-label elements */}
                        </div>
                        <div>
                            <label className="block font-bold text-xl">Last Name</label>
                            <div className="text-lg">{lastName}</div>
                        </div>
                        <div>
                            <label className="block font-bold text-xl">Email</label>
                            <div className="text-lg">{email}</div>
                        </div>
                        <div>
                            <label className="block font-bold text-xl">Graduation Year</label>
                            <div className="text-lg">{graduationYear}</div>
                        </div>
                        <div className="col-span-2 mt-6">
                            {isMyProfile ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 shadow-md w-full"
                                >
                                    Edit Profile
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                readOnly
                                className="border border-gray-300 rounded p-2 w-full mt-1 bg-gray-100 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Grade</label>
                            <select
                                value={graduationYear}
                                onChange={(e) => setGraduationYear(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            >
                                <option value="" disabled hidden>Select Grade</option>
                                {years.map(year => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className='col-span-2 flex flex-col items-center'>
                            Profile Pic:
                            <img
                                id="profPic"
                                src={getProfilePicUrl()}
                                alt="Profile Picture"
                                className="w-24 h-24 object-cover rounded-full mt-2"
                            />
                            <label className="mt-2 block bg-blue-500 text-white py-2 px-4 rounded cursor-pointer hover:bg-blue-600 shadow-md">
                                Choose File
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div className="col-span-2 mt-6">
                            <button
                                onClick={handleSave}
                                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 shadow-md w-full"
                            >
                                Save Profile
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}