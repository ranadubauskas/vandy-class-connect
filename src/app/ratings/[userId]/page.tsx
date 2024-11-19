"use client"
import { useParams, useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../lib/contexts';
import { getUserReviews } from '../../server';
import RatingCard from './ratingCard';

export default function Ratings() {
    const router = useRouter();
    const params = useParams();
    const userVal = useContext(AuthContext);

    const { userId } = params;

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            try {
                const revs = await getUserReviews(userId as string);
                setReviews(revs);
                setLoading(false);
            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, [userId]);

    const handleDeleteReview = (reviewId: string) => {
        setReviews(reviews.filter((review) => review.id !== reviewId));
    };

    return (
        <div className="min-h-screen p-10 reviews-container">
            {loading ? (
                <div className="text-white text-center text-2xl">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {reviews.length > 0 ? (
                        reviews.map((rev) => (
                            <RatingCard
                                key={rev.id}
                                rating={rev}
                                onDelete={() => {
                                    handleDeleteReview(rev.id);
                                }}
                            />
                        ))
                    ) : (
                        <p className="text-center col-span-full">No reviews available.</p>
                    )}
                </div>
            )}
        </div>
    );
}
