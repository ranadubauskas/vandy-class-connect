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


    // const parseReiews = async (reviews) => {
    //     try {
    //         reviews[]
    //         const fetchedReviews = await Promise.all(
    //             reviewIds.map(async (id) => {
    //                 const review = await getReviewByID(id);
    //                 console.log(review);
    //                 return review;
    //             })
    //         );
    //         setReviews(fetchedReviews);
    //     } catch (err) {
    //         console.error("Error fetching reviews:", err);
    //         setError("Failed to fetch reviews.");
    //     }
    // };





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
                {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
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
    );
}