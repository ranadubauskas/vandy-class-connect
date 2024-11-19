'use client';

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import StarRating from "../../components/StarRating";
import { AuthContext } from "../../lib/contexts";
import { deleteReview, editReview, getUserByID } from "../../server";

export default function RatingCard({ rating, onDelete }) {
    const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
    const userVal = useContext(AuthContext);

    if (!userVal) return null;

    const [user, setUser] = useState(null);
    const [isEditing, setEditing] = useState(false);
    const [comment, setComment] = useState(rating.comment);
    const [starRating, setStarRating] = useState(rating.rating);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const fetchedUser = await getUserByID(rating.user);
                setUser(fetchedUser);
            } catch (error) {
                console.error("Error fetching review: ", error);
            }
        };
        fetchReview();
    }, [rating]);

    const handleSave = () => {
        setEditing(false);
        editReview(rating.id, { comment, rating: starRating }, rating.expand.course.id);
    };

    const handleDelete = async () => {
        setEditing(false);
        await deleteReview(rating.id, rating.expand.course.id);
        onDelete();
    };

    return (
        <div className="relative bg-white rounded-lg shadow-md p-4 my-4 mx-auto max-w-sm sm:max-w-md w-full">
            {/* Actions */}
            <div className="absolute top-2 right-2 flex flex-col items-end space-y-2">
                {userVal?.userData?.id === user?.id && (
                    <>
                        {!isEditing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✏️ Edit
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="text-red-500 hover:text-red-700"
                        >
                            🗑️ Delete
                        </button>
                    </>
                )}
                {isEditing && (
                    <button
                        onClick={handleSave}
                        className="text-green-500 hover:text-green-700"
                    >
                        ✅ Save
                    </button>
                )}
            </div>

            {/* User Info */}
            <div className="flex flex-col items-center w-full mt-4">
                <Link href={`/profile/${user?.id}`}>
                    <img
                        src={
                            user
                                ? `${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${user.id}/${user.profilePic}`
                                : '/images/user.png'
                        }
                        alt="User Profile"
                        className="w-12 h-12 rounded-full object-cover"
                    />
                </Link>
                <Link href={`/profile/${user?.id}`}>
                    <h3 className="text-lg font-semibold hover:text-blue-700 hover:underline mt-2">
                        {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                    </h3>
                </Link>
            </div>

            {/* Course Info */}
            <div className="text-center mt-2">
                {rating ? (
                    <Link href={`/course?id=${rating.expand.course.id}&code=${rating.expand.course.code}`}>
                        <p className="text-gray-800 text-sm font-medium hover:text-blue-700 hover:underline">
                            {`${rating.expand.course.code} - ${rating.expand.course.name}`}
                        </p>
                    </Link>
                ) : (
                    <p className="text-gray-800 text-sm font-medium">Loading...</p>
                )}
            </div>

            {/* Rating */}
            <div className="flex justify-center items-center mt-2">
                <StarRating
                    rating={starRating}
                    readOnly={!isEditing}
                    size={24}
                    onRatingChange={(newRating) => setStarRating(newRating)}
                />
            </div>

            {/* Professor Name */}
            {rating.expand?.professors?.length > 0 && rating.expand.professors[0].firstName && (
                <div className="mt-1 mb-1 mx-auto w-fit px-3 py-1 border border-gray-300 rounded bg-gray-200 text-center text-sm">
                    <h3 className="text-gray-800 font-semibold">
                        Professor:{" "}
                        {rating.expand.professors.map((prof, idx) => (
                            <span key={prof.id} className="font-normal">
                                {prof.firstName} {prof.lastName}
                                {idx < rating.expand.professors.length - 1 ? ", " : ""}
                            </span>
                        ))}
                    </h3>
                </div>
            )}

            {/* Comment */}
            <div className="mt-4">
                {isEditing ? (
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Edit your comment"
                        rows={4}
                    />
                ) : (
                    <p
                        className="text-gray-700 text-center break-words whitespace-normal overflow-y-auto max-h-24"
                        style={{ lineHeight: '1.5' }}
                    >
                        {comment}
                    </p>
                )}
            </div>
        </div>
    );
}
