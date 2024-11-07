'use client';
import { useRouter } from 'next/navigation';
import { Tooltip } from "@mui/material";
import { useEffect, useState } from 'react';
import { IoIosSearch } from "react-icons/io";
import { IoClose, IoFilterOutline } from "react-icons/io5";
import { FaRegBookmark, FaBookmark } from 'react-icons/fa';
import { getUserCookies } from '../lib/functions';
import { getAllCourses } from '../server';
import PocketBase from 'pocketbase';

export default function Home() {
  const [userCookies, setUserCookies] = useState(null);
  const [savedCourses, setSavedCourses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilters, setSubjectFilters] = useState<string[]>([]);
  const [tempSubjectFilters, setTempSubjectFilters] = useState<string[]>([]);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseSubjects, setCourseSubjects] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const router = useRouter();

  const pb = new PocketBase('https://vandy-class-connect.pockethost.io');
  pb.autoCancellation(false);

  useEffect(() => {
    const fetchCookies = async () => {
      try {
        const cookies = await getUserCookies();
        if (cookies) {
          setUserCookies(cookies);
        } else {
          console.log("No user cookies found");
        }
      } catch (error) {
        console.error('Error fetching cookies:', error);
      }
    };

    fetchCookies();
  }, []);

  useEffect(() => {
    const fetchSavedCourses = async () => {
      if(!userCookies) return;

      try {
        const userRecord = await pb.collection('users').getOne(userCookies.id);
        if (userRecord && userRecord.savedCourses) {
          setSavedCourses(userRecord.savedCourses);
        } else {
          console.log("No save courses found");
        }
      } catch (error) {
        console.error('Error fetching saved courses:', error);
      }
    };
    fetchSavedCourses();
  }, [userCookies]);

  useEffect(() => {
    setTempSubjectFilters(subjectFilters);
  }, [subjectFilters]);

  useEffect(() => {
    const fetchCourses = async () => {
      const courses = await getAllCourses();
      setCourses(courses);
      const subjects = Array.from(new Set(courses.map(course => course.subject)));
      setCourseSubjects(subjects);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const filterCourses = () => {
      let filtered = courses;

      if (subjectFilters.length > 0) {
        filtered = filtered.filter(course => subjectFilters.includes(course.subject));
      }
      if (ratingFilter !== null) {
        filtered = filtered.filter(course => course.averageRating >= ratingFilter);
      }
      if (searchQuery) {
        const queryWords = searchQuery.toLowerCase().split(' ');
        filtered = filtered.filter(course =>
          queryWords.every(word =>
            course.code.toLowerCase().includes(word) ||
            course.name.toLowerCase().includes(word)
          )
        );
      }

      setFilteredCourses(filtered);
    };

    filterCourses();
  }, [subjectFilters, ratingFilter, searchQuery, courses]);

  const applyFilter = () => {
    setSubjectFilters(tempSubjectFilters);
    setShowFilterModal(false);
  };

  const toggleTempFilter = (subject: string) => {
    setTempSubjectFilters((prevFilters) =>
      prevFilters.includes(subject)
        ? prevFilters.filter((filter) => filter !== subject)
        : [...prevFilters, subject]
    );
  };

  const updateSaved = async (userId, courseId, isSaved) => {
      try {
        const userRecord = await pb.collection('users').getOne(userId);

        let updatedSavedCourses;

        if(isSaved) { //Remove course from savedCourses
          updatedSavedCourses = userRecord.savedCourses.filter(id => id !== courseId);
        } else { //Add course to savedCourses
          updatedSavedCourses = [...userRecord.savedCourses, courseId];
        }

        //Update user record in database
        await pb.collection('users').update(userId, {
          savedCourses: updatedSavedCourses,
        });
        setSavedCourses(updatedSavedCourses);
      } catch (error) {
        console.error("Error saving course:", error);
      }
  };
  const toggleSaveCourse = (courseId) => {
    const isSaved = savedCourses.includes(courseId);

    updateSaved(userCookies.id, courseId, isSaved);
    setSavedCourses((prevSavedCourses) =>
      isSaved
        ? prevSavedCourses.filter(id => id !== courseId)
        : [...prevSavedCourses, courseId]
    );
  };

  const removeFilter = (filterToRemove: string) => {
    setSubjectFilters((prevFilters) =>
      prevFilters.filter((filter) => filter !== filterToRemove)
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* User Info */}
      <div className="flex items-center justify-start mt-2">
        {userCookies && (
          <h1 className="text-xl sm:text-2xl text-white">
            Welcome, {userCookies.firstName} {userCookies.lastName}!
          </h1>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-3 w-full sm:w-80 lg:w-[40rem] rounded-full border border-gray-300"
          placeholder="Search for a course"
        />
        <button
          className="bg-gray-200 p-3 rounded-full hover:bg-gray-300 transition duration-300"
          onClick={() => setShowFilterModal(true)}
          aria-label="Open filter"
          title="Filter by Subject"
        >
          <IoFilterOutline size={20} />
        </button>
        <button
          className="bg-gray-200 px-6 py-3 rounded-full flex items-center justify-center hover:bg-gray-300 transition duration-300 w-full sm:w-auto"
          onClick={() => setSearchQuery(searchQuery)}
        >
          <IoIosSearch size={24} className="mr-2" /> Search
        </button>
      </div>

      {/* Display Selected Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {subjectFilters.map((filter) => (
          <div
            key={filter}
            className="flex items-center bg-gray-200 px-4 py-2 rounded-full text-sm sm:text-base lg:text-lg"
          >
            <span className="mr-2">{filter}</span>
            <button
              onClick={() => removeFilter(filter)}
              className="text-red-500 hover:text-red-700"
            >
              <IoClose size={16} />
            </button>
          </div>
        ))}
        {ratingFilter && (
          <div className="flex items-center bg-gray-200 px-4 py-2 rounded-full text-sm sm:text-base lg:text-lg">
            <span className="mr-2">Rating: {ratingFilter}+</span>
            <button
              onClick={() => setRatingFilter(null)}
              className="text-red-500 hover:text-red-700"
            >
              <IoClose size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-72 sm:w-80 relative">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Select Filters</h2>
            <button
              className="absolute top-2 right-2 text-gray-600"
              onClick={() => setShowFilterModal(false)}
              aria-label="Close filter"
            >
              <IoClose size={20} />
            </button>

            {/* Subject Filters */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 font-bold">Filter by Subject:</label>
              {courseSubjects.map((subject) => (
                <label key={subject} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tempSubjectFilters.includes(subject)}
                    onChange={() => toggleTempFilter(subject)}
                  />
                  <span>{subject}</span>
                </label>
              ))}
            </div>

            {/* Rating Filter */}
            <div className="mb-4">
              <label className="block mb-2 font-bold">Minimum Rating:</label>
              <select
                value={ratingFilter || ''}
                onChange={(e) => setRatingFilter(e.target.value ? parseFloat(e.target.value) : null)}
                className="p-2 rounded border border-gray-300 w-full"
              >
                <option value="">All Ratings</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5</option>
              </select>
            </div>

            <button
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded-full"
              onClick={applyFilter}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="text-white text-center mb-6 text-lg sm:text-2xl">
        {searchQuery
          ? `Showing ${filteredCourses.length} results for "${searchQuery}"`
          : `Showing ${filteredCourses.length} courses`}
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-white text-center text-lg sm:text-2xl">Loading...</div>
        ) : (
          filteredCourses.map((course) => {
            const isSaved = savedCourses.includes(course.id);
            return (
            <div
              key={course.id}
              className="flex flex-col sm:flex-row items-center justify-between bg-white text-black p-4 sm:p-6 rounded-lg shadow-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="text-lg sm:text-2xl bg-gray-200 p-3 rounded-lg font-bold">
                  {course.averageRating.toFixed(1) || "N/A"}
                </div>
                <div className="text-lg sm:text-2xl">
                  <span className="font-bold">{course.code}</span>: {course.name}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  className="mt-4 sm:mt-0 bg-gray-200 px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-gray-300 transition duration-300"
                  onClick={() => router.push(`/course?id=${course.id}`)}
                >
                  View Course
                </button>

                <Tooltip title={isSaved ? "Unsave Course" : "Save Course"}>
                  <button
                    onClick={() => toggleSaveCourse(course.id)}
                    className="text-black-500 hover:text-black-700 transition duration-300 flex items-center"
                  >
                    {isSaved ? <FaBookmark size={24}/> : <FaRegBookmark size={24}/>}
                  </button>
                </Tooltip>
              </div>
            </div>
          )})
        )}
      </div>
    </div>
  );
}