"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';
import { AuthContext } from "../lib/contexts";

export default function NavBar() {
  const userVal = useContext(AuthContext);
  const pathname = usePathname();

  // Directly use id from context
  const isLoggedIn = Boolean(userVal?.id);  // Use the id directly from context

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 p-4 sm:p-0">
      {/* Logo and Title */}
      <Link href="/home" className="flex items-center space-x-4 mb-4 sm:mb-0">
        <img src="images/v-logo.png" alt="Logo" className="w-16 h-12" />
        <div className="text-3xl sm:text-4xl font-bold text-white">
          VandyClassConnect
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="flex flex-wrap justify-center sm:justify-end space-x-0 sm:space-x-4 space-y-2 sm:space-y-0">
        <Link href="/about" className="text-white hover:text-gray-300 text-lg sm:text-2xl">
          About
        </Link>

        {/* Conditionally render links based on login status */}
        {isLoggedIn ? (
          <>
            {pathname !== '/login' && pathname !== '/register' && (
              <>
              <Link href="/" className="text-white hover:text-gray-300 text-lg sm:text-2xl">
                  Home
                </Link>
                <Link href="/savedCourses" className="text-white hover:text-gray-300 text-lg sm:text-2xl">
                  Saved Courses
                </Link>
                <Link href="/profile" className="text-white hover:text-gray-300 text-lg sm:text-2xl">
                  Profile
                </Link>
                <button
                  className="text-white hover:text-gray-300 text-lg sm:text-2xl"
                  onClick={userVal.logoutUser}  // Directly call logoutUser from context
                >
                  Log Out
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {pathname !== '/login' && pathname !== '/register' && (
              <Link href="/login" className="text-white hover:text-gray-300 text-lg sm:text-2xl">
                Log In
              </Link>
            )}
            {pathname !== '/register' && (
              <Link href="/register" className="text-white hover:text-gray-300 text-lg sm:text-2xl">
                Register
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}