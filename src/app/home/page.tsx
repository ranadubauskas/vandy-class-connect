'use client';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from "../lib/contexts";
import { getUserCookies } from '../lib/functions';

export default function Home() {
  const [userCookies, setUserCookies] = useState(null);
  const userVal = useContext(AuthContext);
  const { logoutUser } = userVal; // Destructure the logoutUser function from AuthContext

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
      <div className="flex items-center justify-center h-screen flex-col">
        <ul>
          <li>
            {userCookies && (
              <h1 className="mt-4 text-xl">
                Welcome, {userCookies.firstName} {userCookies.lastName}!
              </h1>
            )}
          </li>
          <li>
            <h1>
              View your profile{' '}
              <a href="profile" style={{ color: 'blue' }}>
                here
              </a>
            </h1>
          </li>
        </ul>
        <button
          type="button"
          onClick={logoutUser}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 mt-6"
        >
          Log Out
        </button>
      </div>
  );
}