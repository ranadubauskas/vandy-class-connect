'use client';
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getUserCookies, logout } from "./functions";


interface AuthContextData {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    graduationYear: string;
    profilePic: string;
    refetchUser: () => void;
    logoutUser: () => Promise<void>;
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
    const [id, setId] = useState("");
    const [username, setUsername] = useState("");
    const [profilePic, setProfilePic] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [graduationYear, setGraduationYear] = useState("");

    async function setUserDataFromCookies() {
        try {
            const userInfo = await getUserCookies();
            if (userInfo) {
                setId(userInfo.id);
                setUsername(userInfo.username);
                setFirstName(userInfo.firstName);
                setLastName(userInfo.lastName);
                setEmail(userInfo.email);
                setGraduationYear(userInfo.graduationYear);
                setProfilePic(userInfo.profilePic);
            }

        } catch (error) {
            console.error("Error setting user data:", error);
        }
    }


    const refetchUser = () => {
        setUserDataFromCookies();
    };

    useEffect(() => {
        setUserDataFromCookies();
    }, []);

    async function logoutUser(): Promise<void> {
        setId("");
        setUsername("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setGraduationYear("");
        setProfilePic("");
        logout();
        router.push("/login");
    }

    const value = {
        id,
        username,
        firstName,
        lastName,
        email,
        graduationYear,
        refetchUser,
        profilePic,
        logoutUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
