'use client';
import { Tooltip } from "@mui/material";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { FaChalkboardTeacher, FaFileDownload, FaFlag, FaUsers } from 'react-icons/fa';
import { IoClose } from "react-icons/io5";
import Loading from "../components/Loading";
import RatingBox from '../components/ratingBox';
import StarRating from '../components/StarRating';
import { useAuth } from "../lib/contexts";
import pb from "../lib/pocketbaseClient";

pb.autoCancellation(false);

function CourseDetailPageComponent() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { userData } = useAuth(); // Getting the current user
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [tutorDetails, setTutorDetails] = useState([]);
  const [showTutors, setShowTutors] = useState(false);
  const [isTutor, setIsTutor] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState("");
  const [copiedEmailMessage, setCopiedEmailMessage] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);

  const currentUserId = userData?.id;

  useEffect(() => {
    if (!id || !currentUserId) return;
    const fetchCourse = async () => {
      try {
        const fetchedCourse = await pb.collection('courses').getOne(id, {
          $cancel: false,
          expand: 'reviews.user,reviews.professors,professors'
        });
        setCourse(fetchedCourse);

        if (fetchedCourse.syllabus) {
          fetchedCourse.syllabus = pb.files.getUrl(fetchedCourse, fetchedCourse.syllabus);
        }

        const fetchedReviews = fetchedCourse.expand?.reviews || [];
        setReviews(fetchedReviews);

        const totalRating = fetchedReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        const avgRating = fetchedReviews.length ? totalRating / fetchedReviews.length : fetchedCourse.averageRating || 0;
        setAverageRating(avgRating);

        const fetchedTutors = fetchedCourse.tutors || [];
        const currentTutor = fetchedTutors.includes(currentUserId);
        setIsTutor(currentTutor);

        // Fetch tutor user details
        const tutorPromises = fetchedTutors.map(async (userId) => {
          const user = await pb.collection('users').getOne(userId);
          return user;
        });
        const fetchedTutorDetails = await Promise.all(tutorPromises);
        setTutorDetails(fetchedTutorDetails);

        const professorList = fetchedCourse.expand?.professors || [];
        setProfessors(professorList);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id, currentUserId]);

  const reportReview = async (reviewId, userId) => {
    try {
      // Create the data object using the correct relation record IDs
      const data = {
        review: reviewId,
        reporter: currentUserId,
        reviewCreator: userId
      };

      // Create the review report entry in PocketBase
      await pb.collection('reviewReports').create(data);
      // Set the popup message
      setPopupMessage('Review has been reported and will be reviewed further.');
    } catch (error) {
      console.error('Error reporting review:', error);
    }
  };

  // Function to copy tutor email to clipboard
  const copyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailMessage('Email copied');
    setTimeout(() => setCopiedEmailMessage(''), 2000);
  }

  // Function to toggle visibility of tutor list
  const toggleTutors = () => {
    setShowTutors((prev) => !prev);
  }

  const addTutor = async () => {
    if (!currentUserId || !course) return;
    if (isTutor) {
      setPopupMessage('You have already added yourself as a tutor for this course.');
      return;
    }
    try {
      // Update course to include new tutor
      await pb.collection('courses').update(id, {
        tutors: [...(course.tutors || []), currentUserId]
      });

      // Fetch user to update courses tutored field
      const curUser = await pb.collection('users').getOne(currentUserId);

      // Update user to include course tutored
      await pb.collection('users').update(currentUserId, {
        courses_tutored: [...(curUser.courses_tutored || []), id]
      });

      setIsTutor(true);
      setTutorDetails((prevTutors) => [...(prevTutors || []), curUser]);
      setPopupMessage('Successfully added as a tutor for this course.');
    } catch (error) {
      console.error('Error adding tutor:', error);
    }
  }

  if (loading) {
    return <Loading />
  }

  if (!course) {
    return <div className="flex items-center justify-center h-screen">Course not found</div>;
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesProfessor = selectedProfessor
      ? review.expand?.professors?.some(
        (professor) => `${professor.firstName} ${professor.lastName}` === selectedProfessor
      )
      : true;

    const matchesRating = selectedRating > 0 ? review.rating >= selectedRating : true;
    return matchesProfessor && matchesRating;
  });

  // Determine grid classes based on the number of reviews
  let gridClasses = "grid grid-cols-1 gap-6"; // default

  if (filteredReviews.length === 2) {
    gridClasses = "grid grid-cols-1 md:grid-cols-2 gap-6";
  } else if (filteredReviews.length >= 3) {
    gridClasses = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  }

  return (
    <>
      <div className="min-h-screen p-6 sm:p-8 lg:p-10 review-card">
        {/* Back to Search Link */}
        <div className="mb-8">
          <button
            className="text-white text-xl hover:bg-gray-400 transition duration-300 px-2 py-1 rounded"
            onClick={() => router.push('/home')}
          >
            ← Back to Search Page
          </button>
        </div>

        {/* Course Code and Name as Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 course-details">
          <h1 className="text-white text-3xl font-semibold mb-4 md:mb-0">
            {course.code}: {course.name}
          </h1>

          {/* Buttons Section */}
          <div className="flex flex-wrap sm:flex-nowrap space-y-4 sm:space-y-0 sm:space-x-4">
            {course.syllabus && (
              <button
                className="bg-white text-black py-2 px-6 rounded-full shadow-lg hover:bg-gray-300 transition duration-300"
                onClick={() => window.open(course.syllabus, '_blank')}
                title="Download Syllabus"
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

            <button
              className="bg-white text-black py-2 px-6 rounded-full shadow-lg hover:bg-gray-300 transition duration-300"
              onClick={addTutor}
            >
              Tutor this Course
            </button>
          </div>
        </div>
        <div className="mb-4 flex space-x-4">
          <div>
            <label htmlFor="professorFilter" className="text-white text-lg mr-2">Filter by Professor:</label>
            {professors.length > 0 ? (
              <select
                id="professorFilter"
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
                className="p-2 rounded border bg-gray-200 px-3 py-2 rounded-full shadow-md  hover:bg-gray-300 transition"
              >
                <option value="" className="text-white">All Professors</option>
                {professors.map((professor, index) => {
                  const professorName = `${professor.firstName} ${professor.lastName}`.trim();
                  return (
                    <option key={index} value={professorName}>
                      {professorName}
                    </option>
                  );
                })}
              </select>
            ) : (
              <p className="text-gray-400 inline text-white text-lg">No professors found</p>
            )}
          </div>

          <div>
            <label htmlFor="ratingFilter" className="text-white text-lg mr-2">Filter by Rating:</label>
            <select
              id="ratingFilter"
              value={selectedRating}
              onChange={(e) => setSelectedRating(Number(e.target.value))}
              className="p-2 rounded border bg-gray-200 px-3 py-2 rounded-full shadow-md hover:bg-gray-300 transition"
            >
              <option value={0}>All Ratings</option>
              <option value={1}>1+</option>
              <option value={2}>2+</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
              <option value={5}>5 </option>
            </select>
          </div>
        </div>
        {/* Popup Message */}
        {popupMessage && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded shadow-lg">
            <p>{popupMessage}</p>
            <button
              className="mt-2 text-sm underline"
              onClick={() => setPopupMessage('')} // Close the popup
            >
              Close
            </button>
          </div>
        )}

        {/* Dropdown list for tutors */}
        {showTutors && (
          <>
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-black opacity-50 z-40"
              onClick={() => setShowTutors(false)} // Clicking outside closes the modal
            />

            {/* Popup Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="relative bg-white w-full max-w-lg p-6 rounded-lg shadow-lg overflow-auto">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-lg">Tutors</h3>
                  <button
                    aria-label="Close"
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
                        className="flex flex-col sm:flex-row items-center justify-between mb-4"
                      >
                        <Link href={`/profile/${tutor.id}`} className="transform hover:scale-110 transition-transform duration-200 hover:text-blue-700 hover:underline">

                          <div className="flex items-center">
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

                          </div>
                        </Link>
                        <button
                          onClick={() => copyEmail(tutor.email)}
                          className="mt-2 sm:mt-0 text-blue-500 hover:text-blue-900 transition duration-300"
                        >
                          Copy Email
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>No tutors available for this course</p>
                  )}
                  {/* Display copied message */}
                  {copiedEmailMessage && (
                    <p className="text-green-500 mt-2 text-center">
                      {copiedEmailMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Reviews Section with Average Rating */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex flex-row flex-nowrap justify-between items-center mb-4 overflow-x-auto">
            {/* Number of tutors for the course */}
            <button
              onClick={toggleTutors}
              className="flex flex-col items-center space-y-1 focus:outline-none mb-4 lg:mb-0"
            >
              <div className="flex items-center space-x-2">
                <span className="text-5xl font-bold text-gray-900">
                  {tutorDetails.length}
                </span>
                <FaChalkboardTeacher className="text-blue-500 text-5xl" />
              </div>
              <p className="text-gray-500 text-center leading-tight">
                Tutors for <br /> this Course
              </p>
            </button>

            {/* Average Rating Section */}
            <div className="flex flex-col items-center flex-grow mb-4 lg:mb-0">
              <h2 className="text-3xl font-semibold mt-2">Average Rating</h2>
              <div className="text-5xl font-bold text-gray-900 mt-1">
                {averageRating.toFixed(1)}
              </div>
              <div className="mt-1">
                <StarRating rating={averageRating} readOnly={true} />
              </div>
            </div>

            {/* Number of reviews */}
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-5xl font-bold text-gray-900">
                  {reviews.length}
                </span>
                <FaUsers className="text-blue-500 text-5xl" />
              </div>
              <p className="text-gray-500 text-center leading-tight">
                Reviews for <br /> this Course
              </p>
            </div>
          </div>

          <div className="mt-6 mb-2">
            <h2 className="text-3xl font-semibold">Reviews</h2>
          </div>

          <div className="space-y-6">
            {filteredReviews.length === 0 ? (
              <p className="text-gray-600 text-lg">No reviews yet.</p>
            ) : (
              <div className={gridClasses}>
                {filteredReviews.map((review, index) => {
                  const user = review.expand?.user || {};
                  const profilePicture = user.profilePicture || '/images/user.png';
                  const syllabusUrl = review.syllabus
                    ? pb.files.getUrl(review, review.syllabus)
                    : null;
                  const rating = review.rating || 0;

                  return (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-md h-full flex flex-col">
                      <div className="flex flex-col flex-1">
                        <div className="flex items-start space-x-4">
                          <Link href={`/profile/${user.id}`}
                            className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden transform hover:scale-110 transition-transform duration-200"
                          >
                            <img src={profilePicture} alt="User Profile" className="w-full h-full object-cover" />
                          </Link>
                          <div className="flex-grow">
                            <div className="flex items-center space-x-2">
                              <Link href={`/profile/${user.id}`}>
                                <h3 className="font-semibold hover:text-blue-700 transform hover:scale-110 hover:underline transition-transform duration-200">
                                  {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : 'Anonymous'}
                                </h3>
                              </Link>
                            </div>
                            {/* Star Rating and Action Buttons */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2 whitespace-nowrap">
                                {/* Rating Number in a Small Box */}
                                <RatingBox rating={review.rating || 'N/A'} size="small" />
                                {/* Star Rating */}
                                <StarRating rating={review.rating} readOnly={true} />
                              </div>
                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2 ml-4">
                                {/* Syllabus Download Button */}
                                {syllabusUrl && (
                                  <Tooltip title="Download Syllabus">
                                    <button
                                      title="Download Syllabus"
                                      className="download-syllabus bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 flex items-center justify-center"
                                      onClick={() => window.open(syllabusUrl, '_blank')}
                                    >
                                      <FaFileDownload className="text-xl" />
                                    </button>
                                  </Tooltip>
                                )}
                                {/* Report Review Button */}
                                <Tooltip title="Report Review">
                                  <button
                                    data-testid={`report-review-${review.id}`}
                                    aria-label="Report Review"
                                    onClick={() => reportReview(review.id, user.id)}
                                    className="text-red-500 hover:text-red-700 transition duration-300 flex items-center"
                                  >
                                    <FaFlag className="text-2xl" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                            {/* Review Comment */}
                            <p className="text-gray-600 mt-2">{review.comment}</p>
                            {/* Professor Name Box */}
                            {review.expand?.professors?.some((prof) => prof.firstName) && (
                              <div className="mt-2 p-1 border border-gray-300 rounded bg-gray-100 inline-block">
                                <h3 className="text-gray-800 font-semibold">
                                  Professor:{' '}
                                  {review.expand.professors
                                    .filter((prof) => prof.firstName)
                                    .map((prof, idx, filteredProfs) => (
                                      <span key={prof.id} className="font-normal">
                                        {prof.firstName} {prof.lastName}
                                        {idx < filteredProfs.length - 1 ? ', ' : ''}
                                      </span>
                                    ))}
                                </h3>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function CourseDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CourseDetailPageComponent />
    </Suspense>
  );
}
