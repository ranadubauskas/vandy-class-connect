'use client';
import { useRouter } from 'next/navigation';
import PocketBase from 'pocketbase';
import { useEffect, useState } from 'react';
import { FaUsers, FaChalkboardTeacher } from 'react-icons/fa';
import NavBar from '../components/NavBar';
import StarRating from '../components/StarRating';
import { useAuth } from "../lib/contexts";

const pb = new PocketBase('https://vandy-class-connect.pockethost.io');
pb.autoCancellation(false);

export default function CourseDetailPage() {
  

  const router = useRouter();
  const id = new URLSearchParams(window.location.search).get('id'); // Get course ID from URL
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
        const fetchedReviews = fetchedCourse.expand?.reviews|| [];
        const fetchedTutors = fetchedCourse.tutors || [];
        const totalRating = fetchedReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const avgRating = fetchedCourse.averageRating || (fetchedReviews.length ? totalRating / fetchedReviews.length : 0);

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
    if(!currentUserId || !course) return;

    try{
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

      //Set state
      setIsTutor(true);
      setTutorDetails((prevTutors) => [...(prevTutors || []), curUser]);
    } catch (error) {
      console.error('Error adding tutor:', error);
    }
  }

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="min-h-screen p-6">
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

      {/* Course Code and Name as Title */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-3xl font-semibold">
          {course.code}: {course.name} {/* Dynamic course name */}
        </h1>

        {/* Buttons Section */}
        <div className="flex space-x-4">
          {course.syllabus && (
            <button
              className="bg-white text-black py-2 px-6 rounded-full shadow-lg"
              onClick={() => window.open(course.syllabus, '_blank')}
            >
              Download Syllabus
            </button>
          )}
          <button
            className="bg-white text-black py-2 px-6 rounded-full shadow-lg"
            onClick={() =>  router.push(`/addReview?id=${course.id}`)}
          >
            Add a Review
          </button>
          <button
            className="bg-white text-black py-2 px-6 rounded-full shadow-lg"
            onClick={toggleTutors}
          >
            Find a Tutor
          </button>

          {/*Dropdown list for tutors*/}
          {showTutors && (
            <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg overflow-auto max-h-48">
              <div className="p-4 flex justify-between item-center">
                <h3 className="font-semibold">Tutors</h3>
                <button onClick={() => setShowTutors(false)} className="text-gray-600">
                  &times;
                </button> 
              </div>
              <div className="p-4">
                {tutorDetails.length > 0 ? (
                  tutorDetails.map((tutor, index) => {
                    return (
                      <div key={index} className="flex items-center justify-between mb-2">
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
                          className="text-blue-500"
                        >
                          Copy Email
                        </button>
                      </div>
                    )
                  })
                ) : (
                  <p>No tutors available for this course</p>
                )}

                {/* Button to become a tutor yourself */}
                {!isTutor && (
                  <button 
                    className="mt-2 w-full bg-blue-500 text-white py-2 rounded"
                    onClick={addTutor}  
                  >
                    Tutor this course
                  </button>
                )}
              </div>
            </div>
          )}
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
                  {/* Star Rating for individual review */}
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
