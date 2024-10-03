'use client';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from "../lib/contexts";
import { getUserCookies } from '../lib/functions';

export default function Home() {
  const [userCookies, setUserCookies] = useState(null);
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-300 to-indigo-900 p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="text-3xl font-bold text-white">VandyClassConnect</div>
        <div className="flex space-x-4">
        <a href="#" className="text-white hover:text-gray-300">Home</a>
    <a href="#" className="text-white hover:text-gray-300">About</a>
    <a href="#" className="text-white hover:text-gray-300">Resources</a>
    <a href="#" className="text-white hover:text-gray-300">Profile</a>
          <a className="text-white hover:text-gray-300" onClick = {()=> {logoutUser()}}>Log Out</a>
        </div>
      </header>
         {/* User Info and Logout Button */}
         <div className="flex items-center justify-center mt-12 flex-col">
        {userCookies && (
          <h1 className="mt-4 text-xl text-white">
            Welcome, {userCookies.firstName} {userCookies.lastName}!
          </h1>
        )}
        {/* <button
          type="button"
          onClick={logoutUser}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 mt-6"
        >
          Log Out
        </button> */}
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          className="p-4 w-96 rounded-full border border-gray-300"
          placeholder="Course Name"
        />
        <button className="ml-4 bg-gray-200 px-6 py-3 rounded-full">Search</button>
      </div>

      {/* Search Results */}
      <div className="text-white text-center mb-6">Showing 8 of 42 Results for "CS"</div>

      <div className="space-y-6">
        {/* Course Card */}
        <div className="flex items-center justify-between bg-white text-black p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="text-2xl bg-gray-200 p-4 rounded-lg font-bold">4.6</div>
            <div className="text-2xl font-bold">CS 2201</div>
          </div>
          <button className="bg-gray-200 px-6 py-3 rounded-lg" onClick = {()=> window.location.href = "/course"}>View Course</button>
        </div>

        {/* Additional Course Cards */}
        <div className="flex items-center justify-between bg-white text-black p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="text-2xl bg-gray-200 p-4 rounded-lg font-bold">3.2</div>
            <div className="text-2xl font-bold">CS 3251</div>
          </div>
          <button className="bg-gray-200 px-6 py-3 rounded-lg" onClick = {()=> window.location.href = "/course"}>View Course</button>
        </div>

        <div className="flex items-center justify-between bg-white text-black p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="text-2xl bg-gray-200 p-4 rounded-lg font-bold">3.8</div>
            <div className="text-2xl font-bold">CS 3281</div>
          </div>
          <button className="bg-gray-200 px-6 py-3 rounded-lg" onClick = {()=> window.location.href = "/course"} >View Course</button>
        </div>
      </div>

   
    </div>
  );
}
