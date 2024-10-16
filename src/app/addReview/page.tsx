'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import PocketBase from 'pocketbase';
import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import StarRating from '../components/StarRating'; // Ensure this component supports partial stars
import { useAuth } from '../lib/contexts'; // Make sure to import the auth provider

const pb = new PocketBase('https://vandy-class-connect.pockethost.io');

export default function AddReviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');
    const { id: userId } = useAuth();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [syllabusFile, setSyllabusFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            try {
                const fetchedCourse = await pb.collection('courses').getOne(courseId);
                setCourse(fetchedCourse);
            } catch (error) {
                console.error('Error fetching course:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    // Handling syllabus file upload
    const handleFileChange = (e) => {
        setSyllabusFile(e.target.files[0]);
    };

    const handleSave = async () => {
        if (!rating || rating <= 0) {
            setError('Please provide a valid rating.');
            return;
        }

        if (!comment.trim()) {
            setError('Please provide a comment.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            // Step 1: Create the review in the 'reviews' collection
            const reviewData = {
                course: courseId,
                rating: parseFloat(rating), // Rating out of 5, including partial ratings
                comment,
                user: userId, // The user from cookies/context
            };

            const newReview = await pb.collection('reviews').create(reviewData);

            // Step 2: Update the 'courses' collection to include the new review
            const fetchedCourse = await pb.collection('courses').getOne(courseId, {
                expand: 'reviews',
            });

            // Append the new review ID to the existing list of review IDs
            const updatedReviews = [...(fetchedCourse.reviews || []), newReview.id];

            // Recalculate the average rating
            const totalRating = fetchedCourse.expand.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            const avgRating = (totalRating + newReview.rating) / (fetchedCourse.expand.reviews.length + 1); // Increment the count

            // Update the course with the new review list and average rating
            await pb.collection('courses').update(courseId, {
                reviews: updatedReviews,
                averageRating: avgRating, // Update average rating
            });

            // Step 3: Upload syllabus file if present
            if (syllabusFile) {
                const formData = new FormData();
                formData.append('syllabus', syllabusFile);

                await pb.collection('courses').update(courseId, formData);
            }

            // Redirect back to the course detail page
            router.push(`/course?id=${courseId}`);
        } catch (error) {
            console.error('Error saving review:', error);
            alert('Failed to add review');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!course) {
        return <div>Course not found</div>;
    }

    return (
        <div className="min-h-screen p-6">
            <NavBar />
            {/* Back to Course Link */}
            <div className="mb-8">
                <button
                    className="text-white text-lg"
                    onClick={() => router.push(`/course?id=${courseId}`)}
                >
                    ← Back to Course Page
                </button>
            </div>

            {/* Course Title */}
            <div className="mb-6">
                <h1 className="text-white text-4xl font-bold text-left">
                    {course.code}: {course.name}
                </h1>
            </div>

            {/* Add Review Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-3xl font-semibold">Add a Review</h2>

                {/* Rating Input Section with Stars */}
                <div className="flex items-center mt-4">
                    {/* Input for Rating */}
                    <input
                        type="number"
                        className="w-20 p-2 border border-gray-300 rounded mr-4"
                        max="5"
                        min="0"
                        step="0.1" // Allows for partial ratings like 3.4
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        placeholder="Rating"
                    />
                    {/* Dynamically render larger stars based on the input */}
                    <StarRating rating={rating} readOnly={true} size={40} /> {/* Make the stars larger */}

                    {/* Upload Syllabus Section */}
                    <div className="ml-8">
                        <label htmlFor="syllabus-upload" className="text-lg font-semibold mr-3">
                            Upload Syllabus:
                        </label>
                        <input
                            id="syllabus-upload"
                            type="file"
                            className="mt-2"
                            accept=".pdf"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                {/* Comment Input */}
                <div className="mt-4">
                    <textarea
                        className="w-full p-4 border border-gray-300 rounded-lg"
                        rows="5"
                        placeholder="Enter your review here..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                {/* Save Button */}
                <div className="mt-6">
                    <button
                        className={`bg-blue-500 text-white py-2 px-6 rounded-lg shadow-lg ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Review'}
                    </button>
                </div>
                {/* Error Message */}
                {error && <div className="text-red-500 mt-2 mb-1">{error}</div>}
            </div>
        </div>
    );
}
