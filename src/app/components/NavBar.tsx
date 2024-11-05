"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';
import { AuthContext } from "../lib/contexts";

export default function NavBar() {
  const userVal = useContext(AuthContext);
  const pathname = usePathname();
  const isLoggedIn = Boolean(userVal?.id);

  return (
    <header className="flex items-center justify-between mb-4 p-4 sm:p-0 space-x-2 sm:space-x-4">
      {/* Logo and Title - Reduced size on smaller screens */}
      <Link href="/home" className="flex items-center space-x-2 sm:space-x-4">
        <img src="/images/v-logo.png" alt="Logo" className="w-8 h-8 sm:w-12 sm:h-12" />
        <div className="text-lg sm:text-3xl font-bold text-white truncate">
          VandyClassConnect
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
        <Link href="/about" className="text-white hover:text-gray-300 text-sm sm:text-lg">
          About
        </Link>

        {isLoggedIn ? (
          <>
            {pathname !== '/login' && pathname !== '/register' && (
              <>
                <Link href="/" className="text-white hover:text-gray-300 text-sm sm:text-lg">
                  Home
                </Link>
                <Link href="/savedCourses" className="text-white hover:text-gray-300 text-sm sm:text-lg">
                  Saved Courses
                </Link>
                <Link href= {`/profile/${userVal.id}`}className="text-white hover:text-gray-300 text-sm sm:text-lg">
                  Profile
                </Link>
                <button
                  className="text-white hover:text-gray-300 text-sm sm:text-lg"
                  onClick={userVal.logoutUser}
                >
                  Log Out
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {pathname !== '/login' && pathname !== '/register' && (
              <Link href="/login" className="text-white hover:text-gray-300 text-sm sm:text-lg">
                Log In
              </Link>
            )}
            {pathname !== '/register' && (
              <Link href="/register" className="text-white hover:text-gray-300 text-sm sm:text-lg">
                Register
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}