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
        <div className="min-h-screen bg-gradient-to-b from-indigo-300 to-indigo-900 p-6">
            <header className="flex items-center justify-between mb-8">
                <div className="text-3xl font-bold text-white">VandyClassConnect</div>
                <div className="flex space-x-4">
                <a href="#" className="text-white hover:text-gray-300" onClick = {()=> window.location.href = "/home" }>Home</a>
                <a href="#" className="text-white hover:text-gray-300">About</a>
                <a href="#" className="text-white hover:text-gray-300">Resources</a>
                <a href="#" className="text-white hover:text-gray-300" onClick = {()=> window.location.href = "/profile" }>Profile</a>
                <a className="text-white hover:text-gray-300" onClick = {()=> {logoutUser()}}>Log Out</a>
                </div>
            </header>
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

        <div className="flex flex-col items-center justify-center h-screen">
            <ul className="bg-white shadow-lg rounded-lg p-6 w-full max-w-5xl">
                <li className="text-2xl font-semibold mb-4 text-center">Profile</li>
                {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
                {!isEditing ? (
                    <>
                        <li>First Name: {firstName}</li>
                        <li>Last Name: {lastName}</li>
                        <li>Email: {email}</li>
                        <li>Graduation Year: {graduationYear}</li>
                        <li className="mt-6">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 shadow-md"
                            >
                                Edit Profile
                            </button>
                        </li>
                        <li className="mt-8 text-xl font-semibold">User Reviews</li>
                        {reviews && reviews.length > 0 ? (
                            <ul className="mt-4">
                                {reviews.map((review) => (
                                    <li key={review.id} className="border-b pb-2 mb-2">
                                        {isEditingReview === review.id ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={reviewEditData.course}
                                                    onChange={(e) => setReviewEditData({ ...reviewEditData, course: e.target.value })}
                                                    placeholder="Course"
                                                    className="border border-gray-300 rounded p-2 w-full"
                                                />
                                                <input
                                                    type="number"
                                                    value={reviewEditData.rating}
                                                    onChange={(e) => {
                                                        let value = parseFloat(e.target.value);
                                                        if (value > 5) value = 5; // Enforce maximum value of 5
                                                        if (value < 0) value = 0; // Enforce minimum value of 0
                                                        setReviewEditData({ ...reviewEditData, rating: value });
                                                    }}
                                                    placeholder="Rating (Out of 5)"
                                                    className="border border-gray-300 rounded p-2 w-full"
                                                    min="0"
                                                    max="5"
                                                    step="0.1"
                                                />
                                                <StarRating
                                                    rating={reviewEditData.rating}
                                                    onRatingChange={(newRating) => setReviewEditData({ ...reviewEditData, rating: newRating })}
                                                />
                                                <textarea
                                                    value={reviewEditData.comment}
                                                    onChange={(e) => setReviewEditData({ ...reviewEditData, comment: e.target.value })}
                                                    placeholder="Comment"
                                                    className="border border-gray-300 rounded p-2 w-full"
                                                />
                                                <button
                                                    onClick={() => handleSaveReview(review.id)}
                                                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                                                >
                                                    Save
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <p><strong>Course:</strong> {review.course}</p>
                                                <div className = "rating-content">
                                                    <p><strong>Rating:</strong> {review.rating}/5</p>
                                                    <StarRating rating={review.rating} readOnly={true} />
                                                </div>
                                               
                                                <p><strong>Comment:</strong> {review.comment}</p>
                                                <p><strong>Created:</strong> {new Date(review.created).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}</p>
                                                <p><strong>Updated:</strong> {new Date(review.updated).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}</p>
                                                <button
                                                    onClick={() => handleEditReview(review)}
                                                    className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 ml-2"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-4 text-gray-500">No reviews available.</p>
                        )}
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
                            <select
                                value={graduationYear}
                                onChange={(e) => setGraduationYear(e.target.value)}
                                className="border border-gray-300 rounded p-2 w-full mt-1"
                            >
                                <option value="" disabled hidden>
                                    Select Graduation Year
                                </option>
                                {years.map(year => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
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

    <div className="bg-white shadow-lg rounded-lg p-6 max-w-5xl mx-auto">
        <div className="text-2xl font-semibold mb-4 text-center">Profile</div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        {!isEditing ? (
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-gray-700">First Name</label>
                    <p>{firstName}</p>
                </div>
                <div>
                    <label className="block text-gray-700">Last Name</label>
                    <p>{lastName}</p>
                </div>
                <div>
                    <label className="block text-gray-700">Email</label>
                    <p>{email}</p>
                </div>
                <div>
                    <label className="block text-gray-700">Graduation Year</label>
                    <p>{graduationYear}</p>
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
                {/* add profile pic edit */}
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