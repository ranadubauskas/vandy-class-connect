'use client';
import { useRouter } from 'next/navigation';
import PocketBase from 'pocketbase';
import { useEffect, useState } from 'react';
import { FaUsers } from 'react-icons/fa';
import NavBar from '../components/NavBar';
import StarRating from '../components/StarRating';


const pb = new PocketBase('https://vandy-class-connect.pockethost.io');

export default function CourseDetailPage() {
  const router = useRouter();
  const id = new URLSearchParams(window.location.search).get('id'); // Get course ID from URL
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      try {
        const fetchedCourse = await pb.collection('courses').getOne(id, {
          expand: 'reviews.user',
        });
        console.log(fetchedCourse.expand.reviews);
        setCourse(fetchedCourse);
        setReviews(fetchedCourse.expand.reviews || []);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: `linear-gradient(
      0deg, 
      #C8D2F9 0%, 
      #7594A4 50%, 
      #84969F 79%, 
      #999999 100%)`,
      }}
    >
      <NavBar />

      {/* Back to Search Link */}
      <div className="mb-8">
        <button
          className="text-white text-lg"
          onClick={() => router.push('/home')}
        >
          ← Back to Search Page
        </button>
      </div>

      {/* Course Title and Download Syllabus */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-3xl font-semibold">
          {course.name} {/* Dynamic course name */}
        </h1>
        {course.syllabus && (
          <button
            className="bg-white text-indigo-700 py-2 px-6 rounded-full shadow-lg"
            onClick={() => window.open(course.syllabus, '_blank')}
          >
            Download Syllabus
          </button>
        )}
      </div>

      {/* Reviews Section */}
      {/* Reviews Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-4xl font-semibold">Reviews</h2>

          {/* Number of reviews, icon, and centered text */}
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center space-x-2">
              {/* Number of reviews */}
              <span className="text-5xl font-bold text-gray-900">
                {reviews.length}
              </span>
              {/* Icon next to number */}
              <FaUsers className="text-blue-500 text-5xl" />
            </div>
            {/* Centered text below number and icon */}
            <p className="text-gray-500 text-center leading-tight">
              Students Have Reviewed <br /> this Course
            </p>
          </div>
        </div>

        <div className="text-gray-600 mb-4">{`Showing ${reviews.length} of ${reviews.length}`}</div>

        {/* List of Reviews */}
        <div className="space-y-6">
          {reviews.map((review, index) => {
            const user = review.expand?.user || {}; // Access the expanded user field
            const profilePicture = user.profilePicture || '/images/user.png'; // Default profile picture if none exists

            return (
              <div key={index} className="flex items-start space-x-4">
                {/* User Profile Picture */}
                <img
                  src={profilePicture}
                  alt="User Profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : 'Anonymous'}
                    </h3>
                  </div>
                  {/* Star Rating */}
                  <StarRating rating={review.rating} readOnly={true} />
                  <p className="text-gray-600">{review.comment}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}