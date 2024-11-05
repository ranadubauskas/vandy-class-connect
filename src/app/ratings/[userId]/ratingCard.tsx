'use client';

import { useEffect, useState, useContext } from "react";
import { getUserByID, getCourseByID } from "../../server";
import StarRating from "../../components/StarRating";
import { AuthContext } from "../../lib/contexts";

export default function RatingCard({ rating }) {
    const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
    const userVal = useContext(AuthContext);

    if(!userVal) return;
    console.log(userVal)

    const[user, setUser] = useState(null);
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

    return (
        <div className="relative min-h-64 min-w-64 bg-white rounded-lg shadow-md p-6 my-4">
            {userVal.id === user?.id ? (<button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    // onClick={() => handleEdit(reviewID)} // Adjust with your edit function
                    aria-label="Edit review"
                >
                ✏️
            </button>) : (<></>)}
            

            <div className='flex justify-center items-center'>
                <StarRating rating={rating.rating} readOnly={true} />
            </div>

            <div className='flex justify-center items-center text-center'>
                <div className="text-lg font-semibold">
                    <div>{rating ? rating.expand.course.code : "Loading"}</div>
                    <div className=" text-md font-medium">{rating ? rating.expand.course.name : "Loading"}</div>
                </div>
            </div>

            <div className="flex items-center justify-center">
                <img
                    src={user ? `${NEXT_PUBLIC_POCKETBASE_URL}/api/files/users/${user.id}/${user.profilePic}` : '/images/user.png'}
                    alt="User Profile"
                    className="w-12 h-12 rounded-full object-cover"
                />
            </div>
            <div className="flex items-center justify-center">
                <div className="text-lg font-semibold">{user ? user.firstName + " " + user.lastName : "Loading..."}</div>
            </div>
            <p className="text-gray-700">{rating.comment}</p>
        </div>
    );
}