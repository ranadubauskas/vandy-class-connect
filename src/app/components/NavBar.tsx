"use client";
import Link from "next/link";
import { useContext } from "react";
import { AuthContext } from "../lib/contexts";

export default function NavBar() {
  const { userData, logoutUser } = useContext(AuthContext);

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between mb-3 p-4 space-y-4 sm:space-y-0 sm:space-x-4">
      {/* Logo and Title */}
      <Link href="/home" className="flex items-center space-x-2">
        <img src="/images/v-logo.png" alt="Logo" className="w-8 h-8 sm:w-12 sm:h-12" />
        <div className="text-base sm:text-2xl font-bold text-white truncate">
          VandyClassConnect
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="flex flex-wrap items-center justify-center space-y-2 sm:space-y-0 space-x-4">
        <Link href="/about" className="text-white hover:text-gray-300 text-xs sm:text-sm md:text-lg">
          About
        </Link>

        {userData && userData.id ? (
          <>
            <Link href="/home" className="text-white hover:text-gray-300 text-xs sm:text-sm md:text-lg">
              Home
            </Link>
            <Link href="/savedCourses" className="text-white hover:text-gray-300 text-xs sm:text-sm md:text-lg">
              Saved Courses
            </Link>
            <Link
              href={`/profile/${userData.id}`}
              className="text-white hover:text-gray-300 text-xs sm:text-sm md:text-lg"
            >
              Profile
            </Link>
            {userData.admin && (
              <Link href="/admin" className="text-white hover:text-gray-300 text-xs sm:text-sm md:text-lg">
                Admin
              </Link>
            )}
            <button
              className="text-white hover:text-gray-300 text-xs sm:text-sm md:text-lg"
              onClick={logoutUser}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                textAlign: "center",
                cursor: "pointer",
                lineHeight: "1", // Ensures consistent vertical alignment
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-white hover:text-gray-300 text-xs sm:text-sm md:text-lg">
              Log In
            </Link>
            <Link href="/register" className="text-white hover:text-gray-300 text-xs sm:text-sm md:text-lg">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}