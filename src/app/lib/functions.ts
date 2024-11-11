/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { cookies } from "next/headers";

export async function getUserCookies() {
    try {
        const cookieStore = await cookies();  // cookies() is already asynchronous and used to get the cookie store

        const allCookies = cookieStore.getAll();  // Fetch all cookies from the cookie store
        const hasRequiredCookies = allCookies.some(cookie => 
            ["id", "firstName", "lastName", "email", "savedCourses"].includes(cookie.name)
        );

        if (!hasRequiredCookies) {
            return null;
        }

        // Create a single object from all the cookies
        const singleObject = allCookies.reduce((acc: any, cookie: any) => {
            acc[cookie.name] = cookie.value;
            return acc;
        }, {});

        try {
            singleObject.savedCourses = singleObject.savedCourses ? JSON.parse(singleObject.savedCourses) : [];
        } catch {
            singleObject.savedCourses = [];  // Default to empty array if parsing fails
        }

        return singleObject;
    } catch (error) {
        console.error("Error fetching user cookies:", error);
        if (error instanceof Error) {
            return error.message;
        }
        return null;
    }
}

export async function logout() {
    const allCookies = await cookies(); 
    //Get all cookies and loop through, deleting each one
    allCookies.delete("id");
    allCookies.delete("username");
    allCookies.delete("firstName");
    allCookies.delete("lastName");
    allCookies.delete("email");
    allCookies.delete("graduationYear");
    allCookies.delete("profilePic");
    allCookies.delete("reviews");
    allCookies.delete("savedCourses");
}
