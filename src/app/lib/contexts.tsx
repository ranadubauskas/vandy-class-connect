// lib/contexts.js
'use client';
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getUserCookies, logout } from "./functions";

interface UserInfoType {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  graduationYear: string;
  profilePic: string;
  admin: boolean;
}

interface AuthContextData {
  userData: UserInfoType | null;
  getUser: () => void;
  logoutUser: () => Promise<void>;
  loginUser: (userInfo: UserInfoType) => void;
}

export const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userData, setUserData] = useState<UserInfoType | null>(null);

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

  const getUser = () => {
    setUserDataFromCookies();
  };

  const loginUser = (userInfo: UserInfoType) => {
    setUserData(userInfo);
  };

  useEffect(() => {
    setUserDataFromCookies();
  }, []);

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
