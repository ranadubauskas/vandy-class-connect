"use client";
import Link from "next/link";
import { useContext, useState } from "react";
import { AuthContext } from "../lib/contexts";
import { useRouter } from "next/navigation";


export default function NavBar() {
  const { userData, logoutUser } = useContext(AuthContext);
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDropdownToggle = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleViewMyReviews = () => {
    router.push(`/ratings/${userData.id}`);
    setIsDropdownOpen(false);
  };

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between mb-3 p-4 space-y-4 sm:space-y-0">
      {/* Logo and Title */}
      <Link href="/home" className="flex items-center space-x-2">
        <img src="/images/v-logo.png" alt="Logo" className="w-8 h-8 sm:w-12 sm:h-12" />
        <div className="text-base sm:text-2xl font-bold text-white truncate">
          VandyClassConnect
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="flex flex-wrap items-center justify-center gap-4">
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
              className="text-white hover:text-gray-300 text-xs sm:text-sm md:text-lg bg-transparent border-none p-0 cursor-pointer"
              onClick={logoutUser}
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