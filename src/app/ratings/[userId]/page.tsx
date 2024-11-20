"use client"
import localforage from 'localforage';
import { useParams, useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../lib/contexts';
import { getUserReviews } from '../../server';
import RatingCard from './ratingCard';
import {User, Course, Professor, Review} from '../../lib/interfaces';


interface CachedReviews {
    reviews: Review[];
    cachedAt: number;
}

export default function Ratings() {
    const router = useRouter();
    const params = useParams();
    const userVal = useContext(AuthContext);

    const { userId } = params;

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            try {
                const cacheKey = `user_reviews_${userId}`;
                const cacheExpiry = 5 * 60 * 1000; // Cache expires after 5 minutes
                const now = Date.now();

                // Check if data is in cache
                const cachedData = await localforage.getItem<CachedReviews>(cacheKey);

                if (cachedData && now - cachedData.cachedAt < cacheExpiry) {
                    // Use cached data
                    setReviews(cachedData.reviews);
                    setLoading(false);
                    return;
                }

                // Fetch data from server
                const revs = await getUserReviews(userId as string);
                setReviews(revs);

                // Cache the data
                await localforage.setItem<CachedReviews>(cacheKey, { reviews: revs, cachedAt: now });

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const handleDeleteReview = async (reviewId: string) => {
        const updatedReviews = reviews.filter((review) => review.id !== reviewId);
        setReviews(updatedReviews);
        // Update the cached data
        const cacheKey = `user_reviews_${userId}`;
        const now = Date.now();
        await localforage.setItem<CachedReviews>(cacheKey, { reviews: updatedReviews, cachedAt: now });
    };

    const handleEditReview = async (updatedReview: Review) => {
        const updatedReviews = reviews.map((review) =>
            review.id === updatedReview.id ? updatedReview : review
        );
        setReviews(updatedReviews);

        // Update the cached data
        const cacheKey = `user_reviews_${userId}`;
        const now = Date.now();
        await localforage.setItem<CachedReviews>(cacheKey, { reviews: updatedReviews, cachedAt: now });
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
                                onEdit={handleEditReview}
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
