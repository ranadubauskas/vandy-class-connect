'use client';

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import RatingBox from "../../components/ratingBox";
import StarRating from "../../components/StarRating";
import { AuthContext } from "../../lib/contexts";
import { deleteReview, editReview, getUserByID } from "../../server";

export default function RatingCard({ rating, onDelete }) {
    const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
    const userVal = useContext(AuthContext);

    if (!userVal) return;
    console.log(userVal)

    const [user, setUser] = useState(null);
    const [isEditing, setEditing] = useState(false);
    const [comment, setComment] = useState(rating.comment);
    const [starRating, setStarRating] = useState(rating.rating);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const fetchedUser = await getUserByID(rating.user)
                setUser(fetchedUser);

                console.log("course: ", rating.expand.course.name);
            }
            catch (error) {
                console.log("Error fetching review: ", error);
            }
        }
        fetchReview()
    }, [rating])

    const handleSave = () => {
        setEditing(false);

        editReview(rating.id, {
            comment: comment,
            rating: starRating,
        }, rating.expand.course.id)
        setComment(comment);
    }

    const handleDelete = async () => {
        setEditing(false);
        await deleteReview(rating.id, rating.expand.course.id);
        onDelete();
    }

    return (
        <div className="relative min-h-64 min-w-64 bg-white rounded-lg shadow-md p-6 my-4">
            <div className="flex items-center justify-center">
                <Link href={`/profile/${user?.id}`} className="w-12 h-12 rounded-full object-cover transform hover:scale-110 transition-transform duration-200">
                    <img
                        src={user ? `${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${user.id}/${user.profilePic}` : '/images/user.png'}
                        alt="User Profile"
                        className="w-12 h-12 rounded-full object-cover"
                    />
                </Link>
            </div>

            <div className="flex items-center justify-center">
                <Link href={`/profile/${user?.id}`} className="transform hover:text-blue-700 hover:scale-110 transition-transform duration-200 hover:underline mt-1 mb-1">
                    <div className="text-xl font-semibold">{user ? user.firstName + " " + user.lastName : "Loading..."}</div>
                </Link>
            </div>

            <div className='flex justify-center items-center text-center'>
                <div>
                    <div className="text-lg font-semibold">{rating ? rating.expand.course.code : "Loading"}</div>
                    <div className=" text-lg font-medium">{rating ? rating.expand.course.name : "Loading"}</div>
                </div>
            </div>
            <div className='flex justify-center items-center'>
                <div className="mr-2">
                    <RatingBox rating={starRating} size="small" />
                </div>

                <StarRating rating={starRating} readOnly={!isEditing} size={36} onRatingChange={(newRating) => { setStarRating(newRating) }} />
            </div>

             {/* Professor Name Box */}
            
             {rating.expand?.professors?.length > 0 && rating.expand.professors[0].firstName && (
                <div className="mt-1 mb-1 mx-auto w-fit px-3 py-1 border border-gray-300 rounded bg-gray-100 text-center text-sm">
                    <h3 className="text-gray-800 font-semibold">
                        Professor: {rating.expand.professors.map((prof, idx) => (
                            <span key={prof.id} className="font-normal">
                                {prof.firstName} {prof.lastName}
                                {idx < rating.expand.professors.length - 1 ? ", " : ""}
                            </span>
                        ))}
                    </h3>
                </div>
            )}

            {isEditing ?
                (<div>
                    {userVal?.userData.id === user?.id && isEditing ? (
                        <button
                            className="absolute bottom-2 right-2 text-green-500 hover:text-green-700 transform hover:scale-110 transition-transform duration-200"
                            onClick={() => handleSave()}
                            aria-label="Save review"
                        >
                            ✅ Save
                        </button>
                    ) : null}

                    <button
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 transform hover:scale-110 transition-transform duration-200"
                        onClick={() => handleDelete()}
                        aria-label="Save review"
                    >
                        🗑️ Delete
                    </button>

                    <textarea
                        className="w-full mt-4 p-2 border border-gray-300 rounded-lg min-h-36"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Edit your comment"
                    />

                </div>)

                :
                (<div>
                    {userVal?.userData?.id === user?.id ? (<button
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transform hover:scale-110 transition-transform duration-200"
                        onClick={() => setEditing(true)}
                        aria-label="Edit review">
                        ✏️ Edit
                    </button>) : (<></>)}

                    <p className="text-gray-700 break-words whitespace-normal h-24 overflow-y-auto text-center">{comment}</p>

                </div>
                )
            }

        </div>
    );
}