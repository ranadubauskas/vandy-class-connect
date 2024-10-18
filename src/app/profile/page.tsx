'use client';
import { useContext, useEffect, useState } from 'react';
import StarRating from '../components/StarRating';
import { AuthContext } from "../lib/contexts";
import { deleteReview, editReview, editUser, getUserReviews } from '../server';
import './style.css';


const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const defaultProfilePic = '/images/user.png'; // Default picture path

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, index) => currentYear + index);

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
    const [error, setError] = useState('');
    const [reviews, setReviews] = useState([]);
    const [isEditingReview, setIsEditingReview] = useState<string | null>(null);
    const [reviewEditData, setReviewEditData] = useState<{ course: string, rating: number, comment: string }>({
        course: '',
        rating: 0,
        comment: ''
    });

    // Populate state with userVal data after it's loaded
    useEffect(() => {
        async function fetchData() {
            if (userVal) {
                setFirstName(userVal.firstName || '');
                setLastName(userVal.lastName || '');
                setEmail(userVal.email || '');
                setGraduationYear(userVal.graduationYear || '');
                try {
                    const revs = await getUserReviews(userVal.id);
                    setReviews(revs);
                } catch (err) {
                    console.error(err);
                }
                if (userVal.profilePic) {
                    setProfilePicPreviewURL(`${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${userVal.id}/${userVal.profilePic}`);
                } else {
                    setProfilePicPreviewURL(defaultProfilePic); // Use default profile picture if none is provided
                }
            }
        }
        fetchData();
    }, [userVal]);

    const handleSave = async () => {
        try {
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

                // Set the updated information from the user object
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
        } catch (error) {
            console.error("Error updating user:", error);
            setError("Failed to update profile. Please try again."); // Set error message to state
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

    const handleEditReview = (review) => {
        setIsEditingReview(review.id);
        setReviewEditData({
            course: review.course,
            rating: review.rating,
            comment: review.comment
        });
    };

    const handleSaveReview = async (reviewId: string) => {
        try {
            const updatedReview = await editReview(reviewId, reviewEditData);
            // Refresh the reviews list after updating
            const updatedReviews = reviews.map((rev) => (rev.id === updatedReview.id ? updatedReview : rev));
            setReviews(updatedReviews);
            setIsEditingReview(null);
        } catch (error) {
            console.error("Error saving review:", error);
            setError("Failed to update review.");
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        try {
            await deleteReview(reviewId);
            const updatedReviews = reviews.filter((review) => review.id !== reviewId);
            setReviews(updatedReviews);
        } catch (error) {
            console.error("Error deleting review:", error);
            setError("Failed to delete review.");
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
                        <button className="bg-white text-blue-600 py-2 px-4 rounded-lg shadow-lg">
                        View My Courses
                        </button>
                    </div>
                    <div className="w-1/3 h-12 flex flex-col items-center justify-center">
                            <img
                                src={getProfilePicUrl()}
                                alt="Profile Picture"
                                className="w-28 h-28 object-cover rounded-full mt-20"
                            />
                            {/* use poppins font, look at shadcn */}
                            <h2 className="text-white text-3xl font-semibold mt-10">{firstName} {lastName}</h2>
                    </div>
                    <div className="w-1/3 flex justify-end pr-2">
                        <button className="bg-white text-blue-600 py-2 px-4 rounded-lg shadow-lg">
                        View My Ratings
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 max-w-5xl mx-auto">
                <div className="text-2xl font-semibold mb-4 text-center">Profile</div>

                {error && <p className="text-red-500 text-center">{error}</p>}

                {!isEditing ? (
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700">First Name</label>
                            <div className='p-1 mt-1 bg-gray-500 bg-opacity-20 rounded-md'> {firstName} </div>
                        </div>
                        <div>
                            <label className="block text-gray-700">Last Name</label>
                            <div className='p-1 mt-1 bg-gray-500 bg-opacity-20 rounded-md'> {lastName} </div>
                        </div>
                        <div>
                            <label className="block text-gray-700">Email</label>
                            <div className='p-1 mt-1 bg-gray-500 bg-opacity-20 rounded-md'> {email} </div>
                        </div>
                        <div>
                            <label className="block text-gray-700">Graduation Year</label>
                            <div className='p-1 mt-1 bg-gray-500 bg-opacity-20 rounded-md'> {graduationYear} </div>
                        </div>
                        <div className="col-span-2 mt-6">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 shadow-md w-full"
                            >
                                Edit Profile
                            </button>
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
                                className="border border-gray-300 rounded p-2 w-full mt-1"
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
                                    <label className="mt-2 block bg-blue-500 text-white py-2 px-4 rounded cursor-pointer">
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