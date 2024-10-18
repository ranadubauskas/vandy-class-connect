'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import PocketBase from 'pocketbase';
import { useEffect, useState } from 'react';
import { FaChalkboardTeacher, FaFileDownload, FaUsers } from 'react-icons/fa';
import { IoClose } from "react-icons/io5";
import Loading from "../components/Loading";
import StarRating from '../components/StarRating';
import { useAuth } from "../lib/contexts";

const pb = new PocketBase('https://vandy-class-connect.pockethost.io');
pb.autoCancellation(false);

export default function CourseDetailPage() {


  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { id: currentUserId, firstName, lastName, email, profilePic } = useAuth(); //Getting the current user
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [tutorDetails, setTutorDetails] = useState([]);
  const [showTutors, setShowTutors] = useState(false);
  const [isTutor, setIsTutor] = useState(false);

  useEffect(() => {
    if (!id || !currentUserId) return;
    const fetchCourse = async () => {
      try {
        const fetchedCourse = await pb.collection('courses').getOne(id, {
          $cancel: false,
          expand: 'reviews.user',
        });
        if (fetchedCourse.syllabus) {
          fetchedCourse.syllabus = pb.files.getUrl(fetchedCourse, fetchedCourse.syllabus);
        }
        const fetchedReviews = fetchedCourse.expand?.reviews || [];
        const fetchedTutors = fetchedCourse.tutors || [];
        const totalRating = fetchedReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        console.log('totalRating: ', totalRating);
        const avgRating = fetchedReviews.length ? totalRating / fetchedReviews.length : fetchedCourse.averageRating || 0;
        console.log('len: ', fetchedReviews.length);
        console.log('avgRating: ', avgRating);
        setCourse(fetchedCourse);
        setReviews(fetchedReviews);
        setAverageRating(avgRating);

        //Checking whether current user is a tutor
        const currentTutor = fetchedTutors.includes(currentUserId);
        setIsTutor(currentTutor);

        //Fetch tutor user details for each tutor
        const tutorPromises = fetchedTutors.map(async (userId) => {
          const user = await pb.collection('users').getOne(userId);
          return user;
        });

        //Wait for all user fetch promises to resolve
        const fetchedTutorDetails = await Promise.all(tutorPromises);
        setTutorDetails(fetchedTutorDetails);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, currentUserId]);

  //Function to copy tutor email to clipboard
  const copyEmail = (email) => {
    navigator.clipboard.writeText(email);
    alert(`Copied: ${email}`);
  }

  //Function to toggle visibility of tutor list
  const toggleTutors = () => {
    setShowTutors((prev) => !prev);
  }

  const addTutor = async () => {
    if (!currentUserId || !course) return;
    try {
      //Update course to include new tutor
      await pb.collection('courses').update(id, {
        tutors: [...(course.tutors || []), currentUserId]
      });

      //Fetch user to update courses tutored field
      const curUser = await pb.collection('users').getOne(currentUserId);

      //Update user to include course tutored
      await pb.collection('users').update(currentUserId, {
        courses_tutored: [...(curUser.courses_tutored || []), id]
      });

      setIsTutor(true);
      setTutorDetails((prevTutors) => [...(prevTutors || []), curUser]);
    } catch (error) {
      console.error('Error adding tutor:', error);
    }
  }

  if (loading) {
    return <Loading />
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <>
      <div className="min-h-screen p-6">
        {/* Back to Search Link */}
        <div className="mb-8">
          <button
            className="text-white text-xl hover:bg-gray-400 transition duration-300"
            onClick={() => router.push('/home')}
          >
            ← Back to Search Page
          </button>
        </div>

        {/* Course Code and Name as Title */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-white text-3xl font-semibold">
            {course.code}: {course.name} {/* Dynamic course name */}
          </h1>

          {/* Buttons Section */}
          <div className="flex space-x-4">
            {course.syllabus && (
              <button
                className="bg-white text-black py-2 px-6 rounded-full shadow-lg hover:bg-gray-300 transition duration-300"
                onClick={() => window.open(course.syllabus, '_blank')}
              >
                Download Syllabus
              </button>
            )}
            <button
              className="bg-white text-black py-2 px-6 rounded-full shadow-lg hover:bg-gray-300 transition duration-300"
              onClick={() => router.push(`/addReview?id=${course.id}`)}
            >
              Add a Review
            </button>
            <button
              className="bg-white text-black py-2 px-6 rounded-full shadow-lg hover:bg-gray-300 transition duration-300"
              onClick={toggleTutors}
            >
              Find a Tutor
            </button>

            {/* Dropdown list for tutors */}
            {showTutors && (
              <>
                {/* Backdrop Overlay */}
                <div
                  className="fixed inset-0 bg-black opacity-50 z-40"
                  onClick={() => setShowTutors(false)} // Clicking outside closes the modal
                />

                {/* Popup Modal */}
                <div className="fixed inset-0 flex items-center justify-center z-50">
                  <div className="relative bg-white w-full max-w-lg p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between">
                      <h3 className="font-semibold">Tutors</h3>
                      <button
                        onClick={() => setShowTutors(false)}
                        className="text-gray-600 hover:text-gray-900 transition duration-300"
                      >
                        <IoClose size={20} />
                      </button>
                    </div>
                    <div className="p-4">
                      {tutorDetails.length > 0 ? (
                        tutorDetails.map((tutor, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between mb-2"
                          >
                            <img
                              src={tutor.profilePicture || '/images/user.png'}
                              alt="Tutor Profile"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-grow ml-2">
                              <span className="font-semibold">
                                {tutor.firstName && tutor.lastName
                                  ? `${tutor.firstName} ${tutor.lastName}`
                                  : 'Anonymous'}
                              </span>
                            </div>
                            <button
                              onClick={() => copyEmail(tutor.email)}
                              className="text-blue-500 hover:text-blue-900 transition duration-300"
                            >
                              Copy Email
                            </button>
                          </div>
                        ))
                      ) : (
                        <p>No tutors available for this course</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            <button
              className="bg-white text-black py-2 px-6 rounded-full shadow-lg hover:bg-gray-300 transition duration-300"
              onClick={addTutor}
            >
              Tutor this Course
            </button>
          </div>
        </div>


        {/* Reviews Section with Average Rating */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start mb-4">
            {/* Number of tutors for the course */}
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                {/* Number of reviews */}
                <span className="text-5xl font-bold text-gray-900">
                  {tutorDetails.length}
                </span>
                {/* Icon next to number */}
                <FaChalkboardTeacher className="text-blue-500 text-5xl" />
              </div>
              {/* Centered text below number and icon */}
              <p className="text-gray-500 text-center leading-tight">
                Tutors for <br /> this Course
              </p>
            </div>

            {/* Average Rating Section Center-Aligned */}
            <div className="flex flex-col items-center flex-grow">
              <h2 className="text-3xl font-semibold mt-2">Average Rating</h2>

              {/* Average Rating Number */}
              <div className="text-5xl font-bold text-gray-900 mt-1">
                {averageRating.toFixed(1)} {/* Display average rating */}
              </div>

              {/* Render average star rating below the rating */}
              <div className="mt-1">
                <StarRating rating={averageRating} readOnly={true} />
              </div>
            </div>

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
                Reviews for <br /> this Course
              </p>
            </div>
          </div>

          <div className="mt-6 mb-2">
            <h2 className="text-3xl font-semibold">Reviews</h2> {/* Added subtitle */}
          </div>

          {/* List of Reviews */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-gray-600 text-lg">No reviews yet.</p>
            ) : (
              reviews.map((review, index) => {
                const user = review.expand?.user || {}; // Access the expanded user field
                const profilePicture = user.profilePicture || '/images/user.png'; // Default profile picture if none exists
                const syllabusUrl = review.syllabus ? pb.files.getUrl(review, review.syllabus) : null; // Get the syllabus URL if it exists

                return (
                  <div key={index}>
                    {/* Review content */}
                    <div className="flex items-start space-x-4 justify-between">
                      <div className="flex items-start space-x-4">
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
                          {/* Star Rating for individual review */}
                          <StarRating rating={review.rating} readOnly={true} />
                          <p className="text-gray-600">{review.comment}</p>
                        </div>
                      </div>

                      {/* Syllabus Download Button */}
                      {syllabusUrl && (
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-gray-700 font-bold">Download Syllabus:</span>
                          <button
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 flex items-center justify-center"
                            onClick={() => window.open(syllabusUrl, '_blank')}
                          >
                            <FaFileDownload />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Divider line */}
                    {index < reviews.length - 1 && (
                      <hr className="my-6 border-t border-gray-300" /> // Divider between reviews
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
    </>
  );
}
