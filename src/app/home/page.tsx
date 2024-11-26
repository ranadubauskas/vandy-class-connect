'use client';
import { Tooltip } from "@mui/material";
import localforage from 'localforage';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { IoIosSearch } from "react-icons/io";
import { IoChevronDown, IoClose } from "react-icons/io5";
import RatingBox from "../components/ratingBox";
import { getUserCookies } from '../lib/functions';
import pb from "../lib/pocketbaseClient";
import { getAllCourses } from '../server';

import './styles.css';

export default function Home() {
  const [userCookies, setUserCookies] = useState(null);
  const [savedCourses, setSavedCourses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilters, setSubjectFilters] = useState<string[]>([]);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseSubjects, setCourseSubjects] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const router = useRouter();
  const subjectDropdownRef = useRef(null);

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
      if (!userCookies) return;

      try {
        const userRecord = await pb.collection('users').getOne(userCookies.id, { autoCancellation: false });
        if (userRecord && userRecord.savedCourses) {
          setSavedCourses(userRecord.savedCourses);
        } else {
          console.log("No saved courses found");
        }
      } catch (error) {
        console.error('Error fetching saved courses:', error);
      }
    };
    fetchSavedCourses();
  }, [userCookies]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const cachedCoursesData = localStorage.getItem('courses');
        if (cachedCoursesData) {
          const { courses: cachedCourses, cachedAt } = JSON.parse(cachedCoursesData);

          // Check if the cache is still valid (within 5 minutes)
          const cacheAge = Date.now() - cachedAt;
          const cacheValidity = 5 * 60 * 1000; // 5 minutes in milliseconds

          if (cacheAge < cacheValidity) {
            console.log('Using cached courses:', cachedCourses);
            setCourses(cachedCourses);
            setCourseSubjects(Array.from(new Set(cachedCourses.map(course => course.subject))));
            setLoading(false);
            return;
          } else {
            console.log('Cache expired, fetching new data...');
          }
        }

        // Fetch new courses if cache is expired or not available
        const courses = await getAllCourses();
        setCourses(courses);

        // Cache courses with timestamp
        const cacheData = {
          courses,
          cachedAt: Date.now(),
        };
        localStorage.setItem('courses', JSON.stringify(cacheData));

        console.log('Fetched and cached courses:', courses);

        const subjects = Array.from(new Set(courses.map(course => course.subject)));
        setCourseSubjects(subjects);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error); // Ensure this error is logged
        setLoading(false);
      }
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
      filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      setFilteredCourses(filtered);
    };

    filterCourses();
  }, [subjectFilters, ratingFilter, searchQuery, courses]);

  const updateSaved = async (userId, courseId, isSaved) => {
    try {
      const userRecord = await pb.collection('users').getOne(userId, { autoCancellation: false });
  
      let updatedSavedCourses;
  
      if (isSaved) {
        // Remove course from savedCourses
        updatedSavedCourses = userRecord.savedCourses.filter(id => id !== courseId);
      } else {
        // Add course to savedCourses
        updatedSavedCourses = [...userRecord.savedCourses, courseId];
      }
  
      // Update user record in database
      await pb.collection('users').update(userId, {
        savedCourses: updatedSavedCourses,
      });
  
      // Update saved courses in localforage
      const cacheKey = `saved_courses_${userId}`;
      const now = Date.now();
  
      // Fetch current cached data if available
      let cachedData = await localforage.getItem(cacheKey);
      if (!cachedData) {
        cachedData = { savedCourses: [], cachedAt: now };
      }
  
      let updatedCachedCourses;
      if (isSaved) {
        // Remove course from cache
        updatedCachedCourses = cachedData.savedCourses.filter(course => course.id !== courseId);
      } else {
        // Fetch course details to add to cache
        const newCourse = await pb.collection('courses').getOne(courseId, { autoCancellation: false });
        updatedCachedCourses = [...cachedData.savedCourses, newCourse];
      }
  
      await localforage.setItem(cacheKey, {
        savedCourses: updatedCachedCourses,
        cachedAt: now,
      });
  
      // Update the state
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        subjectDropdownRef.current &&
        !subjectDropdownRef.current.contains(event.target)
      ) {
        setIsSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-3 w-full sm:w-80 lg:w-[40rem] rounded-full border border-gray-300 "
          placeholder="Search for a course"
        />
        <button
          className="bg-gray-200 px-6 py-3 rounded-full flex items-center justify-center hover:bg-gray-300 transition duration-300 w-full sm:w-auto shadow-lg"
          onClick={() => setSearchQuery(searchQuery)}
        >
          <IoIosSearch size={24} className="mr-2" /> Search
        </button>
      </div>

      {/* Filter section */}
      <div className="flex flex-wrap items-center space-x-4 mb-4">
        {/* Subject Filter */}
        <div className="flex items-center space-x-2">
          <label
            id="subjectFilterLabel"
            className="text-white text-lg font-bold"
          >
            Filter by Subject:</label>
          <div className="relative" ref={subjectDropdownRef}>
            <button
              aria-label="Open subject filter"
              aria-labelledby="subjectFilterLabel"
              onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
              className="p-2 rounded border bg-gray-200 px-2 py-2 rounded-full shadow-md hover:bg-gray-300 transition flex items-center"
            >
              <span className="text-black text-left">
                {subjectFilters.length > 0 ? `${subjectFilters.length} selected` : 'All Subjects'}
              </span>
              <IoChevronDown size={20} className="ml-2" />
            </button>
            {isSubjectDropdownOpen && (
              <div
                role="listbox"
                className="absolute mt-2 bg-white border rounded shadow-lg max-h-60 overflow-auto z-10 w-40"
              >
                {courseSubjects.map((subject, index) => (
                  <label key={index} className="flex items-center p-2 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={subjectFilters.includes(subject)}
                      onChange={() => {
                        setSubjectFilters((prevFilters) =>
                          prevFilters.includes(subject)
                            ? prevFilters.filter((filter) => filter !== subject)
                            : [...prevFilters, subject]
                        );
                      }}
                      className="mr-2"
                    />
                    <span>{subject}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rating Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="ratingFilter" className="text-white text-lg font-bold">Filter by Rating:</label>
          <select
            id="ratingFilter"
            value={ratingFilter || ""}
            onChange={(e) => setRatingFilter(e.target.value ? parseFloat(e.target.value) : null)}
            className="p-2 rounded border bg-gray-200 px-2 py-2 rounded-full shadow-md hover:bg-gray-300 transition"
          >
            <option value="" className="text-gray-700">All Ratings</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5</option>
          </select>
        </div>
      </div>

      {/* Display Selected Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {subjectFilters.map((filter) => (
          <div
            key={filter}
            className="flex items-center bg-gray-200 px-2 py-1 rounded-full text-sm sm:text-base lg:text-lg"
          >
            <span className="mr-1 text-s font-semibold">Subject:</span>
            <span className="mr-2">{filter}</span>
            <button
              aria-label={`Remove filter ${filter}`}
              onClick={() => removeFilter(filter)}
              className="text-red-500 hover:text-red-700"
            >
              <IoClose size={16} />
            </button>
          </div>
        ))}
        {ratingFilter && (
          <div className="flex items-center bg-gray-200 px-2 py-1 rounded-full text-sm sm:text-base lg:text-lg">
            <span className="mr-1 text-s font-semibold">Rating:</span>
            <span className="mr-2 text-s">{ratingFilter}+</span>
            <button
              aria-label={`Remove rating filter ${ratingFilter}`}
              onClick={() => setRatingFilter(null)}
              className="text-red-500 hover:text-red-700"
            >
              <IoClose size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="text-white text-center mb-6 text-lg sm:text-2xl">
        {searchQuery
          ? `Showing ${filteredCourses.length} results for "${searchQuery}"`
          : `Showing ${filteredCourses.length} courses`}
      </div>

      {/* Course List */}
      {loading ? (
        <div className="text-white text-center text-lg sm:text-2xl">Loading...</div>
      ) : (
        <div className="grid-container grid gap-6">
          {filteredCourses.map((course) => {
            const isSaved = savedCourses.includes(course.id);
            const rating = course.averageRating ?? 0;
            return (
              <div
                key={course.id}
                className="flex items-center justify-between bg-white text-black p-4 rounded-lg shadow-lg"
              >
                {/* Course details section */}
                <div className="flex items-center space-x-4 flex-1 course-card">
                  <RatingBox rating={rating} />
                  <div className="flex-1">
                    <div className="text-lg font-bold whitespace-normal break-words course-subject">{course.code}</div>
                    <div className="text-lg whitespace-normal break-words">{course.name}</div>
                  </div>
                </div>

                {/* Actions section */}
                <div className="flex items-center space-x-4 ml-auto">
                  <button
                    className="view-course bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-300 shadow-lg text-base whitespace-nowrap"
                    onClick={() => router.push(`/course?code=${course.code}&id=${course.id}`)}
                  >
                    View Course
                  </button>
                  <Tooltip title={isSaved ? "Unsave Course" : "Save Course"}>
                    <button
                      data-testid={`save-button-${course.id}`}
                      onClick={() => toggleSaveCourse(course.id)}
                      className="text-black-500 hover:text-black-700 transition duration-300 flex items-center"
                    >
                      {isSaved ? <FaBookmark size={24} /> : <FaRegBookmark size={24} />}
                    </button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
