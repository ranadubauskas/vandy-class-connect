'use client';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import localforage from 'localforage';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import RatingBox from '../components/ratingBox';
import { getUserCookies } from '../lib/functions';
import { Course } from '../lib/interfaces';
import pb from '../lib/pocketbaseClient';

interface CachedCoursesData {
  savedCourses: Course[];
  cachedAt: number;
}

export default function SavedCourses() {
  const [userCookies, setUserCookies] = useState(null);
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseToRemove, setCourseToRemove] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCookies = async () => {
      try {
        // Get user cookies to access saved course IDs
        const cookies = await getUserCookies();
        if (cookies) {
          setUserCookies(cookies);
        } else {
          setLoading(false);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error('Error fetching saved courses:', error);
        setErrorMessage('Error fetching saved courses');
        setLoading(false);
      }
    };

    fetchCookies();
  }, []);

  useEffect(() => {
    const fetchSavedCourses = async () => {
      if (!userCookies) return;
      const cacheKey = `saved_courses_${userCookies.id}`;
      const cacheExpiry = 5 * 60 * 1000;
      const now = Date.now();
      try {
        // Check if data is in cache
        const cachedData = await localforage.getItem<CachedCoursesData>(cacheKey);
        if (cachedData && now - cachedData.cachedAt < cacheExpiry) {
          // Use cached data
          setSavedCourses(cachedData.savedCourses);
          setErrorMessage(null);
          setLoading(false);
          return;
        }
        // Fetch data from server
        const userRecord = await pb
          .collection('users')
          .getOne(userCookies.id, { autoCancellation: false });
        if (userRecord?.savedCourses?.length) {
          const courseDetails = await Promise.all(
            userRecord.savedCourses.map((courseId) =>
              pb.collection('courses').getOne(courseId)
            )
          );
          setSavedCourses(courseDetails);
          setErrorMessage(null);
          // Cache the data
          await localforage.setItem(cacheKey, {
            savedCourses: courseDetails,
            cachedAt: now,
          });
        } else {
          setSavedCourses([]);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error('Error fetching saved courses:', error);
        setErrorMessage('Error fetching saved courses');
      } finally {
        setLoading(false);
      }
    };
    fetchSavedCourses();
  }, [userCookies]);

  const handleRemoveCourse = async () => {
    if (!courseToRemove) return;
    setIsRemoving(true);
    try {
      const updatedSavedCourses = savedCourses.filter(
        (course) => course.id !== courseToRemove
      );

      // Update user record in database
      await pb.collection('users').update(userCookies.id, {
        savedCourses: updatedSavedCourses.map((c) => c.id),
      });

      // Update cache in localforage
      const cacheKey = `saved_courses_${userCookies.id}`;
      const now = Date.now();
      await localforage.setItem(cacheKey, {
        savedCourses: updatedSavedCourses,
        cachedAt: now,
      });

      setSavedCourses(updatedSavedCourses);
      setCourseToRemove(null);
      setConfirmationOpen(false);
    } catch (error) {
      console.error('Error unsaving course:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const promptRemoveCourse = (courseId) => {
    setCourseToRemove(courseId);
    setConfirmationOpen(true);
  };

  // Compute grid classes based on the number of saved courses
  let gridClasses = "grid grid-cols-1 gap-4";

  if (savedCourses.length === 1) {
    // Only one saved course, keep it in one column
    // No additional classes needed
  } else if (savedCourses.length === 2) {
    gridClasses += " md:grid-cols-2";
  } else if (savedCourses.length >= 3) {
    gridClasses += " md:grid-cols-2 lg:grid-cols-3";
  }

  return (
    <div className="min-h-screen p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-white text-3xl font-semibold mb-4 md:mb-0">My Courses</h1>
        {/* Error Message */}
        {errorMessage && (
          <div className="text-red-500 text-center mt-4">{errorMessage}</div>
        )}
      </div>

      {/* Saved courses List */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {loading ? (
          <div className="text-gray-600 text-center text-2xl mt-8">Loading...</div>
        ) : savedCourses.length > 0 ? (
          <div className={gridClasses}>
            {savedCourses.map((course) => {
              const rating = course.averageRating ?? 'N/A';
              return (
                <div
                  key={course.id}
                  data-testid="course-item"
                  data-cy="saved-course-item"
                  className="bg-white text-black p-3 sm:p-4 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start">
                    {/* Course Information */}
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <RatingBox rating={rating} size="small" />
                      <div className="text-sm sm:text-base font-semibold">
                        <span className="font-bold">{course.code}</span>: {course.name}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        className="bg-gray-200 px-2 py-2 rounded-lg hover:bg-gray-300 transition duration-300 whitespace-nowrap text-xs sm:text-sm"
                        onClick={() => router.push(`/course?code=${course.code}&id=${course.id}`)}
                      >
                        View Course
                      </button>
                      <Tooltip title="Unsave Course">
                        <button
                          onClick={() => promptRemoveCourse(course.id)}
                          className="text-red-500 hover:text-red-700 transition duration-300 flex items-center"
                          data-testid="unsave-button"
                        >
                          <FiX size={18} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="text-gray-600 text-center text-lg mt-8"
            aria-label="No saved courses"
          >
            You have no saved courses yet.
          </div>
        )}
      </div>
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Remove Course
          <IconButton
            aria-label="close"
            onClick={() => !isRemoving && setConfirmationOpen(false)}
            disabled={isRemoving}
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'gray',
            }}
          >
            <FaTimes />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ minHeight: 80 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            {isRemoving ? (
              <DialogContentText className="text-center text-xl font-semibold">
                Removing Course...
              </DialogContentText>
            ) : (
              <DialogContentText>
                Are you sure you want to remove this course from your saved courses?
              </DialogContentText>
            )}
          </div>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center', paddingBottom: '16px' }}>
          <button
            onClick={handleRemoveCourse}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
            disabled={isRemoving}
          >
            Remove
          </button>
          <button
            onClick={() => setConfirmationOpen(false)}
            className="bg-gray-300 text-black px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-300"
            disabled={isRemoving}
          >
            Cancel
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
