'use client';
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getUserCookies, logout } from "./functions";

/**
 * Type definition for user information.
 */
interface UserInfoType {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  graduationYear: string;
  profilePic: string;
  admin?: boolean;
  courses_tutored?: string[];
}

/**
 * Type definition for authentication context data.
 */
interface AuthContextData {
  userData: UserInfoType | null;
  getUser: () => void;
  logoutUser: () => Promise<void>;
  loginUser: (userInfo: UserInfoType) => void;
}

/**
 * React context for authentication data and methods.
 */
export const AuthContext = createContext<AuthContextData | undefined>(undefined);

/**
 * Custom hook to access authentication context.
 *
 * @return {AuthContextData} Authentication context data and methods.
 * @throws Will throw an error if used outside of an AuthProvider.
 */
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Authentication provider that manages user authentication state.
 *
 * @param {object} props - Props containing children components.
 * @param {React.ReactNode} props.children - Child components to be wrapped by the provider.
 * @return {JSX.Element} The provider component.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userData, setUserData] = useState<UserInfoType | null>(null);

  /**
 * Sets user data from browser cookies.
 *
 * @return {Promise<void>} A promise that resolves when user data is set.
 */
  async function setUserDataFromCookies() {
    try {
      const userInfo = await getUserCookies();
      if (userInfo) {
        setUserData(userInfo);
      }
    } catch (error) {
      console.error("Error setting user data:", error);
    }
  }

  /**
   * Retrieves the current user's data from cookies and updates state.
   */
  const getUser = () => {
    setUserDataFromCookies();
  };

  /**
  * Logs in the user by updating the authentication state.
  *
  * @param {UserInfoType} userInfo - The user's information to set in state.
  */
  const loginUser = (userInfo: UserInfoType) => {
    setUserData(userInfo);
  };

  useEffect(() => {
    setUserDataFromCookies();
  }, []);

  /**
   * Logs out the user by clearing authentication state and cookies.
   *
   * @return {Promise<void>} A promise that resolves when logout is complete.
   */
  async function logoutUser(): Promise<void> {
    setUserData(null);
    await logout();
    router.push("/login");
  }

  const value = {
    userData,
    getUser,
    logoutUser,
    loginUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
