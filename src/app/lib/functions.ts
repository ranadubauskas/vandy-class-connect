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
        if (
            !cookies().has("id") ||
            !cookies().has("firstName") ||
            !cookies().has("lastName") ||
            !cookies().has("email")
        ) {
            return null;
        }
        const singleObject = cookies()
            .getAll()
            .reduce((acc: any, cookie: any) => {
                acc[cookie.name] = cookie.value;
                return acc;
            }, {});

        return singleObject;
    } catch (error) {
        if (error instanceof Error) {
            return error.message;
        }
    }
}

export async function logout() {
    //Get all cookies and loop through, deleting each one
    cookies().delete("id");
    cookies().delete("username");
    cookies().delete("firstName");
    cookies().delete("lastName");
    cookies().delete("email");
    cookies().delete("graduationYear");
    cookies().delete("profilePic");
}
