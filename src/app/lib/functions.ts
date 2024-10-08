"use server";
import { cookies } from "next/headers";
import { signIn } from '../server';


export async function authenticate(formData: FormData) {
    try {
        await signIn(formData);
    } catch (error) {
        if (error instanceof Error) {
            return error.message;
        }
        throw error;
    }
}



export async function getUserCookies() {
    try {
        const cookieStore = await cookies();  // cookies() is already asynchronous and used to get the cookie store

        const allCookies = cookieStore.getAll();  // Fetch all cookies from the cookie store
        const hasRequiredCookies = allCookies.some(cookie => 
            ["id", "firstName", "lastName", "email"].includes(cookie.name)
        );

        if (!hasRequiredCookies) {
            return null;
        }

        // Create a single object from all the cookies
        const singleObject = allCookies.reduce((acc: any, cookie: any) => {
            acc[cookie.name] = cookie.value;
            return acc;
        }, {});

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
}
