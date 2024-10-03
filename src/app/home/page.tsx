'use client';
import { useContext, useEffect, useState } from 'react';
import NavBar from '../components/NavBar'; 
import { AuthContext } from "../lib/contexts";
import { getUserCookies } from '../lib/functions';


export default function Home() {
  const [userCookies, setUserCookies] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const userVal = useContext(AuthContext);
  const { logoutUser } = userVal;

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
      <NavBar/>
      {/* User Info and Logout Button */}
      <div className="flex items-center justify-center mt-12 flex-col">
        {userCookies && (
          <h1 className="mt-4 text-xl text-white">
            Welcome, {userCookies.firstName} {userCookies.lastName}!
          </h1>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          value={searchQuery} // Bind input to searchQuery state
          onChange={(e) => setSearchQuery(e.target.value)} // Update searchQuery on input change
          className="p-4 w-96 rounded-full border border-gray-300"
          placeholder="Course Name"
        />
        <button
          className="ml-4 bg-gray-200 px-6 py-3 rounded-full"
          onClick={() => setSearchTerm(searchQuery)} // Trigger search on button click
        >
          Search
        </button>
      </div>
      {/* Search Results */}
      <div className="text-white text-center mb-6">
        {searchTerm
          ? `Showing 8 of 42 Results for "${searchTerm}"`
          : 'Showing 8 of 42 Results for "CS"'}</div>

      <div className="space-y-6">
        {/* Course Card */}
        <div className="flex items-center justify-between bg-white text-black p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="text-2xl bg-gray-200 p-4 rounded-lg font-bold">4.6</div>
            <div className="text-2xl font-bold">CS 2201</div>
          </div>
          <button className="bg-gray-200 px-6 py-3 rounded-lg" onClick={() => window.location.href = "/course"}>View Course</button>
        </div>

        {/* Additional Course Cards */}
        <div className="flex items-center justify-between bg-white text-black p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="text-2xl bg-gray-200 p-4 rounded-lg font-bold">3.2</div>
            <div className="text-2xl font-bold">CS 3251</div>
          </div>
          <button className="bg-gray-200 px-6 py-3 rounded-lg" onClick={() => window.location.href = "/course"}>View Course</button>
        </div>

        <div className="flex items-center justify-between bg-white text-black p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="text-2xl bg-gray-200 p-4 rounded-lg font-bold">3.8</div>
            <div className="text-2xl font-bold">CS 3270</div>
          </div>
          <button className="bg-gray-200 px-6 py-3 rounded-lg" onClick={() => window.location.href = "/course"} >View Course</button>
        </div>
      </div>


    </div>
  );
}
