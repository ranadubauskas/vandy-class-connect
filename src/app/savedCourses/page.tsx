'use client';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip } from "@mui/material";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { FiX } from "react-icons/fi";
import { getUserCookies } from '../lib/functions';
import pb from "../lib/pocketbaseClient";


pb.autoCancellation(false);

export default function savedCourses() {
  const [userCookies, setUserCookies] = useState(null);
  const [savedCourses, setSavedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [courseToRemove, setCourseToRemove] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(null); 


  useEffect(() => {
    const fetchCookies = async () => {
      try {
        // Get user cookies to access saved course IDs
        const cookies = await getUserCookies();
        if (cookies) {
          setUserCookies(cookies);
          setSavedCourses(cookies.savedCourses || []);
          console.log(cookies.savedCourses);

        } else {
          console.log("No saved courses found");
          setErrorMessage(null);
        }
      } catch (error) {
        console.error('Error fetching saved courses:', error);
        setErrorMessage("Error fetching saved courses");
        
      } 
    };

    fetchCookies();
  }, []);

  useEffect(() => {
    const fetchSavedCourses = async () => {
      if(!userCookies) return;

      try {
        const userRecord = await pb.collection('users').getOne(userCookies.id, {autoCancellation: false});
        if (userRecord?.savedCourses?.length) {
          const courseDetails = await Promise.all(
            userRecord.savedCourses.map((courseId) =>
            pb.collection('courses').getOne(courseId)
            )
          );
          setSavedCourses(courseDetails);
          setErrorMessage(null);
        } else {
          console.log("No saved courses found");
          setErrorMessage(null);
        }
      } catch (error) {
        console.error('Error fetching saved courses:', error);
        setErrorMessage("Error fetching saved courses");
        
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
      const updatedSavedCourses = savedCourses.filter((course) => course.id !== courseToRemove);
      await pb.collection('users').update(userCookies.id, { savedCourses: updatedSavedCourses.map(c => c.id) });
      setSavedCourses(updatedSavedCourses);
      setCourseToRemove(null);
      setConfirmationOpen(false);
    } catch (error) {
      console.error('Error unsaving course:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  }

  const promptRemoveCourse = (courseId) => {
    setCourseToRemove(courseId);
    setConfirmationOpen(true);
  };


//   return (
//     <div className="min-h-screen p-6 sm:p-8 lg:p-10">
//       {/* Header */}
//       <div className="mb-6 flex justify-between items-center">
//         <h1 className="text-white text-3xl font-semibold mb-4 md:mb-0">My Courses</h1>
//         <button
//           onClick={toggleEditMode}
//           className="ml-auto bg-white text-black px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
//         >
//           {editMode ? "Save Changes" : "Edit"}
//         </button>
//         {/* Error Message */}
//       {errorMessage && (
//         <div className="text-red-500 text-center mt-4">{errorMessage}</div>
//       )}
//       </div>



  return (
    <div className="min-h-screen p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-white text-3xl font-semibold mb-4 md:mb-0">My Courses</h1>
        <button
          onClick={toggleEditMode}
          className="ml-auto bg-white text-black px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          {editMode ? "Save Changes" : "Edit"}
        </button>
        {/* Error Message */}
      {errorMessage && (
        <div className="text-red-500 text-center mt-4">{errorMessage}</div>
      )}
      </div>
      

      {/* Saved courses List */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {loading ? (
          <div className="text-gray-600 text-center text-2xl mt-8">
            Loading...
          </div>
        ) : savedCourses.length > 0 ? (
         <div className="space-y-4">
            {savedCourses.map((course) => {
              let rating = course.averageRating.toFixed(1);

              const ratingColorClass =
                rating == undefined || rating == 0.0
                  ? "bg-gray-400"  // Gray if rating is undefined or exactly 0.0
                  : rating > 0 && rating < 2
                    ? "bg-red-400"    // Red for (0, 2)
                    : rating >= 2 && rating < 4
                      ? "bg-yellow-300" // Yellow for [2, 4)
                      : "bg-green-300"; // Green for [4, 5]
              if (rating == 0.0) {
                rating = "N/A";
              }
              
              return (
                <div
                  key={course.id}
                  className="flex items-center justify-between bg-white text-black p-4 sm:p-6 rounded-lg shadow-lg"
                >
                
                {/*Course Information*/}
                <div className="flex items-center space-x-4">
                  <div className={`text-lg p-2 rounded-lg font-bold shadow-lg ${ratingColorClass}`}>
                    {rating}
                  </div>
                  <div className="text-lg sm:text-2xl">
                    <span className="font-bold">{course.code}</span>: {course.name}
                  </div>
                </div>

                {/*Buttons*/}
                <div className="flex items-center space-x-4">
                  <button
                    className="bg-gray-200 px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-gray-300 transition duration-300"
                    onClick={() => router.push(`/course?id=${course.id}`)}
                  >
                    View Course
                  </button>
                  {editMode && (
                    <Tooltip title="Unsave Course">
                      <button
                        onClick={() => promptRemoveCourse(course.id)}
                        className="text-red-500 hover:text-red-700 transition duration-300 flex items-center"
                        data-testid="unsave-button"
                        >
                          <FiX size={24}/>
                        </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-600 text-center text-lg mt-8">
          You have no saved courses yet.
        </div>
      )}
    </div>
    {/*Confirmation Dialog*/}
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
      <DialogActions style={{ justifyContent: 'center', paddingBottom: '16px'}}>
        <button onClick={handleRemoveCourse} color="secondary">
          Remove
        </button>
      </DialogActions>
    </Dialog>

</div>
);
}