
'use client';

import RatingBox from '@/app/components/ratingBox';
import { useParams, useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { MdCancel } from "react-icons/md";
import { AuthContext } from "../../lib/contexts";
import { Course, User } from '../../lib/interfaces';
import { deleteTutor, editUser, getUserByID } from '../../server';
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

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [graduationYear, setGraduationYear] = useState<string>('');
    const [profilePicPreviewURL, setProfilePicPreviewURL] = useState<string>(defaultProfilePic);
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const [otherUser, setOtherUser] = useState<User | null>(null);

    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [showTutors, setShowTutors] = useState<boolean>(false);
    const [tutorDetails, setTutorDetails] = useState<Course[]>([]);
    const [resigning, setResigning] = useState<string>('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Fetch User from Server
                const fetchedUser = await getUserByID(userId as string);

                initializeUserData(fetchedUser);
            } catch (error) {
                console.error('Error fetching user:', error);
                setError('Failed to load profile data.');
            } finally {
                setLoading(false);
            }
        };

        const initializeUserData = (user: User) => {
            const isProfileMine = userId === userData?.id;
            setIsMyProfile(isProfileMine);

            setFirstName(user.firstName);
            setLastName(user.lastName);
            setEmail(user.email);
            setGraduationYear(user.graduationYear);

            const profilePicId = isProfileMine ? userData?.id : user.id;
            const profilePicName = isProfileMine ? userData?.profilePic : user.profilePic;

            if (profilePicName) {
                setProfilePicPreviewURL(`${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${profilePicId}/${profilePicName}`);
            } else {
                setProfilePicPreviewURL(defaultProfilePic);
            }
            setOtherUser(user);

            // Set Tutor Details if Available
            const coursesTutored = user.expand?.courses_tutored || [];
            setTutorDetails(coursesTutored);
        };

        if (userVal && userData && userId) {
            // Initial fetch
            fetchUser();
        }
    }, [userVal, userData, userId]);

    const handleViewRatings = () => {
        if (otherUser && typeof window !== 'undefined') {
            router.push(`/ratings/${otherUser.id}`);
        }
    };

    const handleResign = async (tutorId: string) => {
        setTutorDetails(tutorDetails.filter((tutor) => tutor.id !== tutorId));
        await deleteTutor(userId, tutorId);
    };

    const handleSave = async () => {
        try {
            if (!userData) {
                throw new Error('User not authenticated');
            }

            const formData = new FormData();
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            formData.append('graduationYear', graduationYear);

            if (profilePicFile) {
                formData.append('profilePic', profilePicFile);
            }

            // Call the editUser function with the user's ID and formData
            const updatedUser = await editUser(userData.id, formData);

            if (updatedUser) {
                // Update the state with the updated user data
                setFirstName(updatedUser.firstName);
                setLastName(updatedUser.lastName);
                setGraduationYear(updatedUser.graduationYear);

                // Update the profile picture preview URL
                if (updatedUser.profilePic) {
                    setProfilePicPreviewURL(
                        `${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${userData.id}/${updatedUser.profilePic}`
                    );
                } else {
                    setProfilePicPreviewURL(defaultProfilePic);
                }

                // Refresh the user data in context
                if (getUser) {
                    await getUser();
                }
                setIsEditing(false);

                // No need to update cache since caching is removed
            } else {
                console.error('Failed to update user');
                setError('Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            setError('Failed to update profile. Please try again.');
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

    if (loading || !userVal || !userData) {
        return (
            <div data-testid="loading-indicator" className="text-center text-2xl mt-10 text-white">
                Loading...
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-center h-[30vh]">
                <div className="flex mb-4 max-w-5xl w-full">
                    <div className="w-1/3 flex justify-start pl-2">
                        <button
                            onClick={() => { setShowTutors(true) }}
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
                    </div>
                    <div className="w-1/3 flex justify-end pr-2">
                        <button onClick={() => handleViewRatings()} className="bg-white text-blue-600 py-2 px-4 rounded-lg shadow-lg hover:bg-gray-200 transition-all duration-300 ease-in-out">
                            View {isMyProfile ? "My" : otherUser?.firstName + "'s"} Reviews
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 m-10 max-w-5xl mx-auto justify-center items-center">
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
                            <label htmlFor="firstName" className="block text-gray-700">First Name</label>
                            <input
                                type="text"
                                id='firstName'
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-gray-700">Last Name</label>
                            <input
                                type="text"
                                id='lastName'
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-gray-700">Email</label>
                            <input
                                type="email"
                                id='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                readOnly
                                className="border border-gray-300 rounded p-2 w-full mt-1 bg-gray-100 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label htmlFor="graduationYear" className="block text-gray-700">Graduation Year</label>
                            <select
                                id="graduationYear"
                                value={graduationYear}
                                onChange={(e) => setGraduationYear(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            >
                                <option value="" disabled hidden>Select Year</option>
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

            {showTutors && (
                <>
                    {/* Backdrop Overlay */}
                    <div
                        className="fixed inset-0 bg-black opacity-50 z-40"
                        onClick={() => setShowTutors(false)} // Clicking outside closes the modal
                    />

                    {/* Popup Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="relative bg-white w-full max-w-lg p-6 rounded-lg shadow-lg overflow-auto">
                            <div className="flex justify-between">
                                <h3 className="font-semibold text-lg">
                                    {isMyProfile ? "My" : firstName + "'s"} Tutored Courses
                                </h3>
                                <MdCancel
                                    aria-label="Close"
                                    onClick={() => setShowTutors(false)}
                                    className="text-gray-600 hover:text-gray-900 transition duration-300 cursor-pointer text-2xl sm:text-3xl"
                                />
                            </div>
                            <div className="p-4">
                                {tutorDetails.length > 0 ? (
                                    tutorDetails.map((tutor, index) => (
                                        <div
                                            key={index}
                                            className="flex flex-col sm:flex-row items-center justify-between mb-4"
                                        >

                                            <div className="flex items-center transform hover:scale-110 transition-transform duration-200" onClick={() => router.push(`/course?code=${tutor.code}&id=${tutor.id}`)}>
                                                <RatingBox rating={tutor.averageRating} size="small" />
                                                <div className="flex-grow ml-2">
                                                    <span className="font-semibold hover:text-blue-700 hover:underline">
                                                        {tutor.code}
                                                    </span>
                                                </div>

                                            </div>
                                            {isMyProfile ? <button
                                                onClick={() => { handleResign(tutor.id) }}
                                                className="mt-2 sm:mt-0 text-red-500 hover:text-blue-900 transition duration-300"
                                            >
                                                Resign
                                            </button> : <></>}

                                        </div>
                                    ))
                                ) : (
                                    <p>Nothing here. Sign up to be a tutor!</p>
                                )}
                                {/* Display copied message */}
                                {resigning && (
                                    <p className="text-green-500 mt-2 text-center">
                                        {resigning}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}