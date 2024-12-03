'use client';
import localforage from 'localforage';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Loading from "../components/Loading";
import StarRating from '../components/StarRating';
import { useAuth } from '../lib/contexts';
import pb from "../lib/pocketbaseClient";

function AddReviewComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');
    const code = searchParams.get('code');
    const { userData } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0); // Initialize to 0
    const [comment, setComment] = useState('');
    const [professorFirstName, setProfessorFirstName] = useState('');
    const [professorLastName, setProfessorLastName] = useState('');
    const [syllabusFile, setSyllabusFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isEditingRating, setIsEditingRating] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const maxWordCount = 400;
    const userId = userData?.id;

    // State variable for anonymous review
    const [isAnonymous, setIsAnonymous] = useState(false);

    // State variable for star size
    const [starSize, setStarSize] = useState(40);

    const handleCommentChange = (e) => {
        const newComment = e.target.value;
        const words = newComment.trim().split(/\s+/).filter(Boolean);
        setComment(newComment);
        setWordCount(words.length);
    };

    useEffect(() => {
        if (!courseId) {
            setLoading(false);
            return;
        }

        const fetchCourseFromCache = async () => {
            try {
                const cachedCourse = await localforage.getItem(`course_${code}`);
                if (cachedCourse) {
                    setCourse(cachedCourse);
                } else {
                    await fetchCourseFromServer();
                }
            } catch (error) {
                console.error('Error fetching course from cache:', error);
                await fetchCourseFromServer();
            } finally {
                setLoading(false);
            }
        };

        const fetchCourseFromServer = async () => {
            try {
                const fetchedCourse = await pb.collection('courses').getFirstListItem(
                    `code="${code}"`,
                    {
                        expand: 'reviews.user,reviews.professors,professors',
                        autoCancellation: false,
                    }
                );
                setCourse(fetchedCourse);
                // Cache the course data
                await localforage.setItem(`course_${code}`, fetchedCourse);
            } catch (error) {
                console.error('Error fetching course:', error);
            }
        };
        fetchCourseFromCache();

    }, [courseId, code]);

    // Adjust star size based on screen width
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) { // sm breakpoint
                setStarSize(30);
            } else {
                setStarSize(40);
            }
        };

        window.addEventListener('resize', handleResize);

        // Set initial size
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Handling syllabus file upload
    const handleFileChange = (e) => {
        setSyllabusFile(e.target.files[0]);
    };

    const handleSave = async () => {
        if (!course) {
            setError('Course data is still loading. Please wait a moment and try again.');
            return;
        }
        if (wordCount > maxWordCount) {
            setError(`Your comment exceeds the maximum word limit of ${maxWordCount} words.`);
            return;
        }
        if (rating === null || isNaN(rating) || rating <= 0) {
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
            // Check if the professor exists
            const professorFilter = `firstName="${professorFirstName.trim()}" && lastName="${professorLastName.trim()}"`;
            const existingProfessors = await pb.collection('professors').getFullList({
                filter: professorFilter,
                autoCancellation: false
            });

            let professorId;
            if (existingProfessors.length > 0) {
                // Professor exists
                professorId = existingProfessors[0].id;
            } else {
                // Create new professor
                const newProfessor = await pb.collection('professors').create({
                    firstName: professorFirstName.trim(),
                    lastName: professorLastName.trim(),
                    course: courseId,
                });
                professorId = newProfessor.id;
            }

            // Create the review
            const reviewData = {
                course: courseId,
                rating,
                comment,
                user: userData.id,
                syllabus: syllabusFile,
                professors: [professorId],
                anonymous: isAnonymous,
            };

            const newReview = await pb.collection('reviews').create(reviewData);

            // Update the course
            const existingProfessorIds = course.professors || [];
            const updatedProfessors = [...new Set([...existingProfessorIds, professorId])];

            const existingReviewIds = course.reviews || [];
            const updatedReviews = [...existingReviewIds, newReview.id];

            // Fetch existing reviews to calculate the average rating
            const existingReviews = await pb.collection('reviews').getFullList({
                filter: `course="${courseId}"`,
                autoCancellation: false
            });

            const totalRating = existingReviews.reduce((sum, review) => sum + (review.rating || 0), 0) + newReview.rating;
            const avgRating = totalRating / (existingReviews.length + 1);

            await pb.collection('courses').update(courseId, {
                reviews: updatedReviews,
                averageRating: avgRating,
                professors: updatedProfessors,
            });

            // Upload syllabus file if present
            if (syllabusFile) {
                const formData = new FormData();
                formData.append('syllabus', syllabusFile);
                await pb.collection('courses').update(courseId, formData);
            }

            const fetchedUserReviews = await pb.collection('reviews').getFullList({
                filter: `user="${userId}"`,
                autoCancellation: false,
            });

            const updatedUserReviews = [...fetchedUserReviews, newReview];
            await localforage.setItem(`user_reviews_${userId}`, updatedUserReviews);

            const cachedCourse = await localforage.getItem(`course_${code}`);
            if (cachedCourse) {
                // Fetch the updated course data with expansions
                const updatedCourse = await pb.collection('courses').getFirstListItem(
                    `code="${code}"`,
                    {
                        expand: 'reviews.user,reviews.professors,professors',
                        autoCancellation: false,
                    }
                );
                // Update the cache
                await localforage.setItem(`course_${code}`, updatedCourse);
            }
            router.push(`/course?code=${code}&id=${courseId}`);
        } catch (error) {
            console.error('Error saving review:', error);
            setError('Error saving review.');
        } finally {
            setSaving(false);
        }
    };
    const cleanupCache = async () => {
        try {
            await localforage.removeItem(`user_reviews_${userId}`);
        } catch (error) {
            console.error('Error cleaning up user reviews cache:', error);
        }
    };


    if (!course && !loading) {
        return <div>Course not found</div>;
    }

    const handleRatingChange = (newRating) => {
        setRating(newRating); // Update the rating state
        setInputValue(newRating.toString());
        setIsEditingRating(false);
        setHoverRating(0);
    };

    // Compute the displayRating based on current state
    const displayRating = isEditingRating
        ? (inputValue === '' ? 0 : parseFloat(inputValue) || 0)
        : (hoverRating > 0 ? hoverRating : rating);

    return (
        <div className="min-h-screen p-6">
            {/* Back to Course Link */}
            <div className="mb-8">
                <button
                    className="text-white text-lg"
                    onClick={() => router.back()}
                    aria-label="Back to Course Page"
                >
                    ← Back to Course Page
                </button>
            </div>

            {/* Course Title */}
            <div className="mb-6">
                <h1 className="text-white text-4xl font-bold text-left">
                    {course ? `${course.code}: ${course.name}` : 'Loading Course...'}
                </h1>
            </div>

            {/* Add Review Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-3xl font-semibold hover:bg-gray-300 transition duration-300">Add a Review</h2>

                {/* Rating Input Section with Stars */}
                <div className="flex flex-wrap items-start mt-4">
                    <div className="flex items-center flex-nowrap flex-grow">
                        <label htmlFor="rating" className="text-lg font-semibold mr-2 flex-shrink-0">
                            Rating:<span className="text-red-500">*</span>
                        </label>
                        {/* Input for Rating */}
                        <input
                            type="number"
                            className="w-20 p-2 border border-gray-300 rounded mr-2 flex-shrink-0"
                            max="5"
                            min="0"
                            step="0.1"
                            value={isEditingRating ? inputValue : (hoverRating > 0 ? hoverRating : rating)}
                            aria-label="Rating Input"
                            onChange={(e) => {
                                if (isEditingRating) {
                                    setInputValue(e.target.value);
                                }
                            }}
                            placeholder="Rating"
                            onFocus={() => {
                                setIsEditingRating(true);
                                setInputValue(''); // Clear the input field on focus
                            }}
                            onBlur={() => {
                                if (isEditingRating) {
                                    const parsedValue = parseFloat(inputValue);
                                    if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 5) {
                                        setRating(parsedValue);
                                        setError('');
                                    } else {
                                        setError('Please provide a valid rating between 0 and 5.');
                                        // Reset inputValue to previous rating
                                        setInputValue(rating.toString());
                                    }
                                    setIsEditingRating(false);
                                }
                            }}
                        />
                        {/* Dynamically render larger stars based on the input */}
                        <div className="flex-shrink-0">
                            <StarRating
                                rating={displayRating}
                                onRatingChange={handleRatingChange}
                                onHover={(newHoverRating) => setHoverRating(newHoverRating)}
                                onLeave={() => setHoverRating(0)}
                                size={starSize}
                            />
                        </div>
                    </div>

                    {/* Upload Syllabus Section */}
                    <div className="w-full sm:w-auto mt-4 sm:mt-0 flex-shrink-0">
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

                <div className="flex items-center mt-4 space-x-4">
                    <input
                        type="text"
                        className="w-2/5 p-2 border border-gray-300 rounded"
                        placeholder="Professor's First Name"
                        value={professorFirstName}
                        onChange={(e) => setProfessorFirstName(e.target.value)}
                    />
                    <input
                        type="text"
                        className="w-2/5 p-2 border border-gray-300 rounded"
                        placeholder="Professor's Last Name"
                        value={professorLastName}
                        onChange={(e) => setProfessorLastName(e.target.value)}
                    />
                </div>

                {/* Anonymous Checkbox */}
                <div className="mt-4">
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                        />
                        <span className="ml-2 text-gray-700">Post review anonymously</span>
                    </label>
                </div>

                {/* Comment Input */}
                <div className="relative mt-4">
                    <textarea
                        className="w-full p-4 border border-gray-300 rounded-lg mt-1"
                        rows={5}
                        placeholder="Enter your review here..."
                        value={comment}
                        onChange={handleCommentChange}
                    />
                    {/* Position the asterisk outside the top-right corner of the textarea */}
                    <span className="absolute top-0 -right-4 text-red-500 text-xl">*</span>
                    <div className="text-right mt-1 text-sm">
                        <span className={wordCount > maxWordCount ? 'text-red-500' : 'text-gray-500'}>
                            {wordCount}/{maxWordCount} words
                        </span>
                    </div>
                    {wordCount > maxWordCount && (
                        <div className="text-red-500 mt-2">
                            Your comment exceeds the maximum word limit of {maxWordCount} words.
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="mt-6">
                    <button
                        className={`bg-blue-500 text-white py-2 px-6 rounded-lg shadow-lg hover:bg-blue-700 ${saving || !course ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleSave}
                        disabled={saving || !course}
                    >
                        {saving ? 'Saving...' : 'Save Review'}
                    </button>
                    {loading && !course && (
                        <div className="text-gray-500 mt-2">
                            Loading course data...
                        </div>
                    )}
                </div>
                {/* Error Message */}
                {error && <div className="text-red-500 mt-2 mb-1">{error}</div>}
            </div>
        </div>
    );
}

export default function AddReviewPage() {
    return (
        <Suspense fallback={<Loading />}>
            <AddReviewComponent />
        </Suspense>
    );
}
