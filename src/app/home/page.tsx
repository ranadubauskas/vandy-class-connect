'use client';
import { useContext, useEffect, useState } from 'react';
import { IoIosSearch } from "react-icons/io";
import { IoFilterOutline } from "react-icons/io5";
import NavBar from '../components/NavBar';
import { AuthContext } from "../lib/contexts";
import { getUserCookies } from '../lib/functions';
import { getCourses } from '../server';

let courseSubjects = ['CS', 'MATH', 'BSCI', 'ASTR'];

export default function Home() {
  const [userCookies, setUserCookies] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const userVal = useContext(AuthContext);

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
    const fetchCourses = async () => {
      const fetchedCourses = await getCourses(subjectFilter);
      setCourses(fetchedCourses);
      setFilteredCourses(fetchedCourses);
    };
    fetchCourses();
  }, [subjectFilter]);

  useEffect(() => {
    const filtered = courses.filter((course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [searchQuery, courses]);

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

      {/* User Info and Logout Button */}
      <div className="flex items-center justify-start mt-12">
        {/* Adjusted the positioning */}
        {userCookies && (
          <h1 className="mt-1 mb- text-xl text-white">
            Welcome, {userCookies.firstName} {userCookies.lastName}!
          </h1>
        )}
      </div>

      {/* Search Bar and Filter */}
      <div className="flex justify-center items-center mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            const filtered = courses.filter((course) =>
              course.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCourses(filtered);
          }}
          className="p-4 w-[40rem] rounded-full border border-gray-300" // Increased width of search bar
          placeholder="Course Name"
        />

        {/* Filter Button */}
        <button
          className="ml-4 bg-gray-200 p-3 rounded-full"
          onClick={() => setShowFilterModal(true)}
        >
          <IoFilterOutline size={20} />
        </button>

      {/* Search Button */}
        <button
          className="ml-4 bg-gray-200 px-6 py-3 rounded-full flex items-center justify-center"
          onClick={() => setSearchQuery(searchQuery)}
        >
          <IoIosSearch size={24} className="mr-2" /> {/* Icon size and margin */}
          Search
        </button>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-2xl font-semibold mb-4">Select Subject</h2>
            <select
              className="p-4 w-full rounded-full border border-gray-300"
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setShowFilterModal(false); // Close modal on filter select
              }}
            >
              <option className="text-gray-400" value="" />
              {courseSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            {/* Close Button */}
            <button
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded-full"
              onClick={() => setShowFilterModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="text-white text-center mb-6">
        {searchQuery
          ? `Showing ${filteredCourses.length} results for "${searchQuery}"`
          : `Showing ${filteredCourses.length} courses`}
      </div>

      {/* Course List */}
      <div className="space-y-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="flex items-center justify-between bg-white text-black p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="text-2xl bg-gray-200 p-4 rounded-lg font-bold">
                {course.rating || "N/A"}
              </div>
              <div className="text-2xl font-bold">{course.name}</div>
            </div>
            <button
              className="bg-gray-200 px-6 py-3 rounded-lg"
              onClick={() => (window.location.href = `/course?id=${course.id}`)}
            >
              View Course
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
