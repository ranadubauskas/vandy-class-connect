'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoIosSearch } from "react-icons/io";
import { IoClose, IoFilterOutline } from "react-icons/io5";
import { getUserCookies } from '../lib/functions';
import { getAllCourses } from '../server';

export default function Home() {
  const [userCookies, setUserCookies] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilters, setSubjectFilters] = useState<string[]>([]); // Store multiple filters
  const [tempSubjectFilters, setTempSubjectFilters] = useState<string[]>([]); // Temporary selection for filters in the modal
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseSubjects, setCourseSubjects] = useState<string[]>([]);

  const router = useRouter();

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

  // Get all courses 1x on page load
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

  // Apply filters
  useEffect(() => {
    const filterCourses = () => {
      let filtered = courses;

      // Apply subject filters if any are selected
      if (subjectFilters.length > 0) {
        filtered = filtered.filter(course => subjectFilters.includes(course.subject));
      }

      // Apply search query filter
      if (searchQuery) {
        const queryWords = searchQuery.toLowerCase().split(' '); // Split search query into words
        filtered = filtered.filter(course => {
          // Check if any of the words match either the course code or course name
          return queryWords.every(word =>
            course.code.toLowerCase().includes(word) ||
            course.name.toLowerCase().includes(word)
          );
        });
      }

      setFilteredCourses(filtered); // Set the filtered list
    };

    filterCourses(); // Call the filtering logic whenever filters or search query changes
  }, [subjectFilters, searchQuery, courses]);

  const applyFilter = () => {
    setSubjectFilters(tempSubjectFilters); // Apply selected filters
    setShowFilterModal(false); // Close modal after saving
  };

  const toggleTempFilter = (subject: string) => {
    setTempSubjectFilters((prevFilters) =>
      prevFilters.includes(subject)
        ? prevFilters.filter((filter) => filter !== subject) // Remove filter if it's already selected
        : [...prevFilters, subject] // Add filter if it's not already selected
    );
  };

  const removeFilter = (filterToRemove: string) => {
    setSubjectFilters((prevFilters) =>
      prevFilters.filter((filter) => filter !== filterToRemove) // Remove the selected filter
    );
  };

  return (
    <div className="min-h-screen p-6">
      {/* User Info and Logout Button */}
      <div className="flex items-center justify-start mt-2">
        {userCookies && (
          <h1 className="mt-0 mb- text-2xl text-white">
            Welcome, {userCookies.firstName} {userCookies.lastName}!
          </h1>
        )}
      </div>
      <br></br>

      {/* Search Bar and Filter */}
      <div className="flex justify-center items-center mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-4 w-[40rem] rounded-full border border-gray-300"
          placeholder="Course Name"
        />

        {/* Filter Button */}
        <button
          className="ml-4 bg-gray-200 p-3 rounded-full hover:bg-gray-300 transition duration-300"
          onClick={() => setShowFilterModal(true)}
          aria-label="Open filter"
          title="Filter by Subject"
        >
          <IoFilterOutline size={20} />
        </button>

        {/* Search Button */}
        <button
          className="ml-4 bg-gray-200 px-6 py-3 rounded-full flex items-center justify-center hover:bg-gray-300 transition duration-300"
          onClick={() => setSearchQuery(searchQuery)}
        >
          <IoIosSearch size={24} className="mr-2" /> Search
        </button>
      </div>

      {/* Display selected filters */}
      <div className="mb-4 flex space-x-2">
        {subjectFilters.map((filter) => (
          <div key={filter} className="flex items-center bg-gray-200 px-3 py-1 rounded-full">
            <span className="mr-2">{filter}</span>
            <button
              onClick={() => removeFilter(filter)}
              className="text-red-500 hover:text-red-700"
            >
              <IoClose size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 relative">
            <h2 className="text-2xl font-semibold mb-4">Select Subjects</h2>

            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-600"
              onClick={() => setShowFilterModal(false)}
              aria-label="Close filter"
            >
              <IoClose size={20} />
            </button>

            {/* Display subjects with checkboxes */}
            <div className="mb-4">
              {courseSubjects.map((subject) => (
                <label key={subject} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tempSubjectFilters.includes(subject)} // Check if it's selected
                    onChange={() => toggleTempFilter(subject)}
                  />
                  <span>{subject}</span>
                </label>
              ))}
            </div>

            {/* Save Button */}
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
      <div className="text-white text-center mb-6 text-2xl">
        {searchQuery
          ? `Showing ${filteredCourses.length} results for "${searchQuery}"`
          : `Showing ${filteredCourses.length} courses`}
      </div>

      {/* Course List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-white text-center text-2xl">Loading...</div>
        ) : (
          filteredCourses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between bg-white text-black p-6 rounded-lg shadow-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl bg-gray-200 p-4 rounded-lg font-bold">
                  {course.averageRating.toFixed(1) || "N/A"}
                </div>
                <div className="text-2xl">
                  <span className="font-bold">{course.code}</span>: {course.name}
                </div>
              </div>
              <button
                className="bg-gray-200 px-6 py-3 rounded-lg"
                onClick={() => router.push(`/course?id=${course.id}`)}
              >
                View Course
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}